import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL, endpoints } from '../../config/api';
import CustomAlert from '../../components/CustomAlert';

const QRCodeGenerator = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({
    visible: false,
    type: 'error',
    message: ''
  });

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

  const generateQRValue = (course) => {
    // Generate a QR code value that includes course details and timestamp
    const qrData = {
      courseId: course._id,
      courseCode: course.courseCode,
      enrollmentCode: course.enrollmentCode,
      timestamp: new Date().toISOString(),
    };
    return JSON.stringify(qrData);
  };

  const renderCourseCard = (course) => {
    const isSelected = selectedCourse?._id === course._id;
    return (
      <TouchableOpacity
        key={course._id}
        style={[styles.courseCard, isSelected && styles.selectedCard]}
        onPress={() => setSelectedCourse(course)}
      >
        <View style={styles.courseHeader}>
          <Text style={styles.courseCode}>{course.courseCode}</Text>
          <View style={styles.statsContainer}>
            <Ionicons name="people-outline" size={20} color="#165973" />
            <Text style={styles.statText}>{course.totalStudents || 0}</Text>
          </View>
        </View>
        <Text style={styles.courseName}>{course.courseName}</Text>
        <Text style={styles.enrollmentCode}>
          Enrollment Code: {course.enrollmentCode}
        </Text>
      </TouchableOpacity>
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
          {selectedCourse ? (
            <View style={styles.qrContainer}>
              <Text style={styles.selectedCourseTitle}>
                {selectedCourse.courseCode} - {selectedCourse.courseName}
              </Text>
              <View style={styles.qrWrapper}>
                <QRCode
                  value={generateQRValue(selectedCourse)}
                  size={200}
                  color="#165973"
                  backgroundColor="white"
                />
              </View>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setSelectedCourse(null)}
              >
                <Ionicons name="arrow-back" size={24} color="#165973" />
                <Text style={styles.backButtonText}>Back to Courses</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={styles.title}>Select a Course</Text>
              <Text style={styles.subtitle}>
                Choose a course to generate its QR code
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
    marginBottom: 24,
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
    marginBottom: 24,
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
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
});

export default QRCodeGenerator; 