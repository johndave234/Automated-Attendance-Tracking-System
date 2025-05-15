import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL, endpoints } from '../../config/api';
import CustomAlert from '../../components/CustomAlert';
import axios from 'axios';

const QRCodeGenerator = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionCreating, setSessionCreating] = useState(false);
  const [sessionData, setSessionData] = useState(null);
  const [attendanceList, setAttendanceList] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [alert, setAlert] = useState({
    visible: false,
    type: 'error',
    message: ''
  });
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes in seconds
  const qrRefreshInterval = useRef(null);
  const qrValueRef = useRef(null); // Store the QR value
  const [qrRefreshTrigger, setQrRefreshTrigger] = useState(0); // Force refresh when needed

  useEffect(() => {
    fetchInstructorCourses();
  }, []);

  const fetchInstructorCourses = async () => {
    try {
      const idNumber = await AsyncStorage.getItem('idNumber');
      
      if (!idNumber) {
        throw new Error('Instructor ID number not found');
      }

      const response = await fetch(`${API_URL}${endpoints.instructorCourses}/${idNumber}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch courses');
      }

      setCourses(Array.isArray(data) ? data : []);
      
    } catch (error) {
      setAlert({
        visible: true,
        type: 'error',
        message: error.message || 'Error fetching courses'
      });
    } finally {
      setLoading(false);
    }
  };

  // Create a new session for the selected course
  const createSession = async (course) => {
    try {
      setSessionCreating(true);
      
      // Get current date and day of week
      const today = new Date();
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const currentDay = days[today.getDay()];
      
      const response = await axios.post(`${API_URL}${endpoints.sessionCreate}`, {
        courseId: course._id,
        courseCode: course.courseCode,
        date: today,
        day: currentDay
      });

      if (response.data.success) {
        setSessionData(response.data.session);
        setAlert({
          visible: true,
          type: 'success',
          message: 'Attendance session created successfully!'
        });
        return response.data.session;
      } else {
        throw new Error(response.data.message || 'Failed to create session');
      }
    } catch (error) {
      console.error('Error creating session:', error);
      
      // Check if there's an existing session for today
      if (error.response && error.response.data && error.response.data.session) {
        setSessionData(error.response.data.session);
        setAlert({
          visible: true,
          type: 'info',
          message: 'Using existing session for today.'
        });
        return error.response.data.session;
      } else {
        setAlert({
          visible: true,
          type: 'error',
          message: error.response?.data?.message || 'Failed to create attendance session'
        });
        return null;
      }
    } finally {
      setSessionCreating(false);
    }
  };

  // Fetch attendance for current session
  const fetchSessionAttendance = async (sessionId) => {
    if (!sessionId) return;
    
    try {
      setRefreshing(true);
      
      const response = await axios.get(`${API_URL}${endpoints.sessions}/${sessionId}`);
      
      if (response.data.success) {
        const session = response.data.session;
        // Filter students who are present
        const presentStudents = session.students.filter(student => 
          student.status === 'Present' || student.status === 'Late'
        );
        
        setAttendanceList(presentStudents);
        return presentStudents;
      } else {
        setAlert({
          visible: true,
          type: 'error',
          message: 'Failed to fetch attendance data'
        });
        return [];
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
      setAlert({
        visible: true,
        type: 'error',
        message: 'Failed to fetch attendance data'
      });
      return [];
    } finally {
      setRefreshing(false);
    }
  };

  const generateQRValue = (course, session) => {
    // Add expiration time (2 minutes from now)
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 2 * 60 * 1000); // 2 minutes
    
    // Reset timer to 2 minutes
    setTimeLeft(120);
    
    // Ensure session ID is prominently included for the new system
    const qrData = {
      sessionId: session && session._id ? session._id : null,
      courseId: course._id,
      courseCode: course.courseCode,
      timestamp: new Date().toISOString(),
      expiresAt: expiresAt.toISOString()  // Add expiration timestamp
    };
    
    // Include other fields for backward compatibility
    if (course.enrollmentCode) {
      qrData.enrollmentCode = course.enrollmentCode;
    }
    
    // For backward compatibility with the old system
    if (!qrData.uniqueCode) {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      let uniqueCode = '';
      for (let i = 0; i < 6; i++) {
        uniqueCode += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      qrData.uniqueCode = uniqueCode;
    }
    
    // Avoid generating QR codes with null sessionId
    if (!qrData.sessionId) {
      delete qrData.sessionId;
    }
    
    console.log("Generated QR data:", qrData);
    const qrValue = JSON.stringify(qrData);
    qrValueRef.current = qrValue;
    
    // Increment refresh trigger to force QRCode component to update
    setQrRefreshTrigger(prev => prev + 1);
    
    return qrValue;
  };

  // Generate initial QR code value when course and session are selected
  useEffect(() => {
    if (selectedCourse && sessionData && !qrValueRef.current) {
      generateQRValue(selectedCourse, sessionData);
    }
  }, [selectedCourse, sessionData]);

  // Set up a timer to refresh the QR code every 2 minutes
  useEffect(() => {
    if (selectedCourse && sessionData) {
      // Clear any existing interval
      if (qrRefreshInterval.current) {
        clearInterval(qrRefreshInterval.current);
      }
      
      // Set up the countdown timer
      const countdownInterval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // When time expires, regenerate QR code
            generateQRValue(selectedCourse, sessionData);
            return 120;
          }
          return prev - 1;
        });
      }, 1000);
      
      qrRefreshInterval.current = countdownInterval;
      
      // Clean up on unmount
      return () => {
        if (qrRefreshInterval.current) {
          clearInterval(qrRefreshInterval.current);
        }
      };
    }
  }, [selectedCourse, sessionData]);

  // Format time for display (mm:ss)
  const formatTimeLeft = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleCourseSelect = async (course) => {
    setSelectedCourse(course);
    const session = await createSession(course);
    
    if (session) {
      // Start a periodic check for attendance updates
      const intervalId = setInterval(async () => {
        await fetchSessionAttendance(session._id);
      }, 10000); // Check every 10 seconds
      
      // Clean up interval when component unmounts or course changes
      return () => clearInterval(intervalId);
    }
  };

  const renderCourseCard = (course) => {
    const isSelected = selectedCourse?._id === course._id;
    return (
      <TouchableOpacity
        key={course._id}
        style={[styles.courseCard, isSelected && styles.selectedCard]}
        onPress={() => handleCourseSelect(course)}
        disabled={sessionCreating}
      >
        <View style={styles.courseHeader}>
          <Text style={styles.courseCode}>{course.courseCode}</Text>
          <View style={styles.statsContainer}>
            <Ionicons name="people-outline" size={20} color="#165973" />
            <Text style={styles.statText}>{course.totalStudents || course.students?.length || 0}</Text>
          </View>
        </View>
        <Text style={styles.courseName}>{course.courseName}</Text>
        <Text style={styles.courseDetails}>
          Room: {course.room || 'Not specified'}
        </Text>
        <Text style={styles.enrollmentCode}>
          Enrollment Code: {course.enrollmentCode}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderAttendanceList = () => {
    if (!attendanceList || attendanceList.length === 0) {
      return (
        <View style={styles.emptyAttendance}>
          <Ionicons name="people-outline" size={48} color="#999" />
          <Text style={styles.emptyText}>No students have recorded attendance yet</Text>
        </View>
      );
    }
    
    return (
      <View style={styles.attendanceContainer}>
        <Text style={styles.attendanceTitle}>Present Students ({attendanceList.length})</Text>
        {attendanceList.map((student) => (
          <View key={student.studentId} style={styles.studentItem}>
            <View style={styles.studentInfo}>
              <Text style={styles.studentName}>{student.studentName}</Text>
              <Text style={styles.studentId}>{student.studentId}</Text>
            </View>
            <View style={styles.attendanceTime}>
              <Text style={styles.timeLabel}>Time In:</Text>
              <Text style={styles.timeValue}>
                {student.timeIn ? new Date(student.timeIn).toLocaleTimeString() : 'N/A'}
              </Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#165973" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          {selectedCourse && sessionData ? (
            <View style={styles.qrContainer}>
              <Text style={styles.selectedCourseTitle}>
                {selectedCourse.courseCode} - {selectedCourse.courseName}
              </Text>
              
              <View style={styles.sessionInfo}>
                <Text style={styles.sessionDate}>
                  Session: {new Date(sessionData.session.date).toLocaleDateString()}
                </Text>
                <Text style={styles.sessionTime}>
                  {sessionData.session.day}, {sessionData.session.startTime} - {sessionData.session.endTime}
                </Text>
                <Text style={styles.sessionRoom}>
                  Room: {sessionData.session.room || selectedCourse.room || 'Not specified'}
                </Text>
              </View>
              
              <View style={styles.qrWrapper}>
                <QRCode
                  key={qrRefreshTrigger}
                  value={qrValueRef.current || generateQRValue(selectedCourse, sessionData)}
                  size={200}
                  color="#165973"
                  backgroundColor="white"
                />
                
                <View style={styles.expirationContainer}>
                  <Text style={styles.expirationText}>
                    Expires in: {formatTimeLeft(timeLeft)}
                  </Text>
                  <View style={styles.expirationBarContainer}>
                    <View 
                      style={[
                        styles.expirationBar, 
                        {width: `${(timeLeft / 120) * 100}%`}
                      ]} 
                    />
                  </View>
                </View>
              </View>
              
              <View style={styles.buttonContainer}>
                <TouchableOpacity 
                  style={styles.refreshQRButton}
                  onPress={() => {
                    // Manually regenerate the QR code
                    generateQRValue(selectedCourse, sessionData);
                  }}
                >
                  <Ionicons name="refresh" size={18} color="#fff" style={{marginRight: 5}} />
                  <Text style={styles.refreshButtonText}>Refresh QR Code</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.refreshButton}
                  onPress={() => fetchSessionAttendance(sessionData._id)}
                  disabled={refreshing}
                >
                  {refreshing ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.refreshButtonText}>Refresh Attendance</Text>
                  )}
                </TouchableOpacity>
              </View>
              
              {renderAttendanceList()}
              
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => {
                  // Clear the QR refresh interval
                  if (qrRefreshInterval.current) {
                    clearInterval(qrRefreshInterval.current);
                    qrRefreshInterval.current = null;
                  }
                  
                  // Reset QR value
                  qrValueRef.current = null;
                  
                  // Reset state
                  setSelectedCourse(null);
                  setSessionData(null);
                  setAttendanceList([]);
                }}
              >
                <Ionicons name="arrow-back" size={24} color="#165973" />
                <Text style={styles.backButtonText}>Back to Courses</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={styles.title}>Select a Course</Text>
              <Text style={styles.subtitle}>
                Choose a course to generate its QR code and track attendance
              </Text>
              {courses.length === 0 ? (
                <View style={styles.emptyCourses}>
                  <Ionicons name="book-outline" size={48} color="#999" />
                  <Text style={styles.emptyText}>No courses available</Text>
                </View>
              ) : (
                courses.map(renderCourseCard)
              )}
            </>
          )}
        </View>
      </ScrollView>

      <CustomAlert
        visible={alert.visible}
        type={alert.type}
        message={alert.message}
        onClose={() => setAlert(prev => ({ ...prev, visible: false }))}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#165973',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  courseCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  selectedCard: {
    borderColor: '#165973',
    borderWidth: 2,
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  courseCode: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#165973',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    color: '#666',
    marginLeft: 4,
  },
  courseName: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  courseDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  enrollmentCode: {
    fontSize: 14,
    color: '#666',
  },
  qrContainer: {
    alignItems: 'center',
    padding: 16,
  },
  selectedCourseTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#165973',
    textAlign: 'center',
    marginBottom: 16,
  },
  sessionInfo: {
    backgroundColor: '#e9f7fc',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#bde3ed',
  },
  sessionDate: {
    fontSize: 16,
    fontWeight: '500',
    color: '#165973',
    marginBottom: 4,
  },
  sessionTime: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  sessionRoom: {
    fontSize: 14,
    color: '#333',
  },
  qrWrapper: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    marginBottom: 16,
  },
  expirationContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  expirationText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  expirationBarContainer: {
    width: '100%',
    height: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  expirationBar: {
    height: '100%',
    backgroundColor: '#165973',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  refreshQRButton: {
    backgroundColor: '#165973',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  refreshButton: {
    backgroundColor: '#165973',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  attendanceContainer: {
    width: '100%',
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 2,
  },
  attendanceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  studentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  studentId: {
    fontSize: 12,
    color: '#666',
  },
  attendanceTime: {
    alignItems: 'flex-end',
  },
  timeLabel: {
    fontSize: 12,
    color: '#999',
  },
  timeValue: {
    fontSize: 12,
    color: '#165973',
    fontWeight: '500',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  backButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#165973',
  },
  emptyCourses: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyAttendance: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 24,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 2,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
});

export default QRCodeGenerator; 