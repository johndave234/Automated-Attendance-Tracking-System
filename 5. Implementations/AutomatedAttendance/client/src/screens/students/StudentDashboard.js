import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../config';
import CustomAlert from '../../components/CustomAlert';
import TabBar from '../../components/TabBar';
import Header from '../../components/Header';
import { Ionicons } from '@expo/vector-icons';

const StudentDashboard = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const studentData = route.params?.studentData || {};
  const [isLoading, setIsLoading] = useState(true);
  const [recentCourses, setRecentCourses] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState({
    rate: '0%',
    classesToday: 0
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'error'
  });
  
  // Manual code attendance state
  const [isManualCodeModalVisible, setIsManualCodeModalVisible] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [manualCodeError, setManualCodeError] = useState('');
  const [isSubmittingCode, setIsSubmittingCode] = useState(false);
  const [selectedCourseForCode, setSelectedCourseForCode] = useState(null);

  const studentTabs = [
    {
      key: 'dashboard',
      label: 'Dashboard',
      icon: 'home-outline',
      activeIcon: 'home',
    },
    {
      key: 'courses',
      label: 'Courses',
      icon: 'book-outline',
      activeIcon: 'book',
    }
  ];

  // Fetch enrolled courses and attendance data
  const fetchDashboardData = async () => {
    if (!studentData.idNumber) return;
    
    try {
      setIsLoading(true);
      
      // Fetch enrolled courses
      const coursesResponse = await axios.get(`${API_URL}/api/students/enrolled-courses/${studentData.idNumber}`);
      
      if (coursesResponse.data.success) {
        // Get the courses data
        const coursesData = coursesResponse.data.courses || [];
        
        // Sort by most recent or alphabetically if needed
        const sortedCourses = [...coursesData].sort((a, b) => a.courseCode.localeCompare(b.courseCode));
        
        // Take only the first 3 courses for the dashboard
        setRecentCourses(sortedCourses.slice(0, 3));
        
        // Update attendance stats based on course count
        setAttendanceStats({
          rate: coursesData.length > 0 ? '85%' : '0%', // This should be calculated from real data
          classesToday: coursesData.length
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      showAlert('Error', 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [studentData.idNumber]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchDashboardData();
  };

  const handleTabPress = (tabKey) => {
    if (tabKey === 'courses') {
      navigation.navigate('StudentCourses', { studentData });
    } else {
      setActiveTab(tabKey);
    }
  };

  const handleQRScan = (course) => {
    // Navigate to QR Scanner screen with course info
    navigation.navigate('QRScanner', { 
      courseId: course.id,
      courseCode: course.courseCode,
      studentId: studentData.idNumber
    });
  };

  // Function for manual code attendance
  const handleManualCode = (course) => {
    // Clear previous data and set the selected course
    setManualCode('');
    setManualCodeError('');
    setIsSubmittingCode(false);
    setSelectedCourseForCode(course);
    setIsManualCodeModalVisible(true);
  };
  
  // Function to submit the manual attendance code
  const submitManualCode = async () => {
    if (!manualCode.trim()) {
      setManualCodeError('Please enter the attendance code');
      return;
    }
    
    setIsSubmittingCode(true);
    
    try {
      console.log('Submitting manual code:', {
        courseId: selectedCourseForCode.id,
        courseCode: selectedCourseForCode.courseCode,
        studentId: studentData.idNumber,
        manualCode: manualCode.trim()
      });
      
      const response = await axios.post(`${API_URL}/api/attendance/manual`, {
        courseId: selectedCourseForCode.id,
        courseCode: selectedCourseForCode.courseCode,
        studentId: studentData.idNumber,
        manualCode: manualCode.trim(),
        studentName: studentData.fullName
      });
      
      console.log('Manual attendance response:', response.data);
      
      if (response.data.success) {
        // Close modal and show success message
        setIsManualCodeModalVisible(false);
        showAlert('Success', response.data.message || 'Attendance recorded successfully', 'success');
      } else {
        // Show error in modal
        setManualCodeError(response.data.message || 'Invalid attendance code');
      }
    } catch (error) {
      console.error('Error submitting manual code:', error.response?.data || error.message);
      setManualCodeError(error.response?.data?.message || 'Failed to submit attendance code');
    } finally {
      setIsSubmittingCode(false);
    }
  };

  const showAlert = (title, message, type = 'error') => {
    setAlertConfig({
      visible: true,
      title,
      message,
      type
    });
  };

  const hideAlert = () => {
    setAlertConfig(prev => ({ ...prev, visible: false }));
  };

  const handleLogout = async () => {
    try {
      setIsLoading(true);
      
      const response = await axios.post(`${API_URL}/api/students/logout`, {
        studentId: studentData.idNumber
      });

      if (response.data.success) {
        // Clear AsyncStorage
        await AsyncStorage.multiRemove(['studentId', 'studentName', 'userType']);
        
        showAlert('Success', 'Logged out successfully', 'success');
        setTimeout(() => {
          navigation.replace('Login');
        }, 1500);
      } else {
        throw new Error(response.data.message || 'Logout failed');
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to logout');
    } finally {
      setIsLoading(false);
    }
  };

  const renderCourseItem = ({ item }) => (
    <View style={styles.courseCard}>
      <View style={styles.courseHeader}>
        <Text style={styles.courseCode}>{item.courseCode}</Text>
        <Text style={styles.courseName}>{item.courseName}</Text>
      </View>
      
      <View style={styles.courseDetailsWrapper}>
        <View style={styles.detailRow}>
          <Ionicons name="person-outline" size={16} color="#666" style={styles.detailIcon} />
          <Text style={styles.instructorName}>Instructor: {item.instructor || 'Not assigned'}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={16} color="#666" style={styles.detailIcon} />
          <Text style={styles.courseSchedule}>{item.schedule}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Ionicons name="location-outline" size={16} color="#666" style={styles.detailIcon} />
          <Text style={styles.courseRoom}>Room: {item.room || 'Not assigned'}</Text>
        </View>
      </View>
      
      <View style={styles.courseActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('StudentCourses', { studentData })}
        >
          <Ionicons name="list-outline" size={20} color="#165973" />
          <Text style={styles.actionButtonText}>Details</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleQRScan(item)}
        >
          <Ionicons name="qr-code-outline" size={20} color="#165973" />
          <Text style={styles.actionButtonText}>Scan QR</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleManualCode(item)}
        >
          <Ionicons name="keypad-outline" size={20} color="#165973" />
          <Text style={styles.actionButtonText}>Enter Code</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderAttendanceStats = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statCard}>
        <Ionicons name="calendar-outline" size={24} color="#165973" />
        <Text style={styles.statValue}>{attendanceStats.rate}</Text>
        <Text style={styles.statLabel}>Attendance Rate</Text>
      </View>
      
      <View style={styles.statCard}>
        <Ionicons name="time-outline" size={24} color="#1E88E5" />
        <Text style={styles.statValue}>{attendanceStats.classesToday}</Text>
        <Text style={styles.statLabel}>Enrolled Courses</Text>
      </View>
    </View>
  );

  // Render manual code modal
  const renderManualCodeModal = () => {
    return (
      <Modal
        visible={isManualCodeModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsManualCodeModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Enter Attendance Code</Text>
              <TouchableOpacity onPress={() => setIsManualCodeModalVisible(false)} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.manualCodeContainer}>
              {selectedCourseForCode && (
                <View style={styles.selectedCourseInfo}>
                  <Text style={styles.selectedCourseCode}>{selectedCourseForCode.courseCode}</Text>
                  <Text style={styles.selectedCourseName}>{selectedCourseForCode.courseName}</Text>
                </View>
              )}
              
              <Text style={styles.codeInstructions}>
                Please enter the attendance code provided by your instructor to record your attendance.
              </Text>
              
              <TextInput
                style={[styles.codeInput, manualCodeError ? styles.codeInputError : null]}
                value={manualCode}
                onChangeText={(text) => {
                  setManualCode(text);
                  if (text.trim()) setManualCodeError('');
                }}
                placeholder="Enter attendance code"
                placeholderTextColor="#999"
                autoCapitalize="none"
                autoCorrect={false}
              />
              
              {manualCodeError ? (
                <Text style={styles.codeErrorText}>{manualCodeError}</Text>
              ) : null}
            </View>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setIsManualCodeModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.submitButton,
                  (!manualCode.trim() || isSubmittingCode) ? styles.disabledButton : null
                ]}
                onPress={submitManualCode}
                disabled={!manualCode.trim() || isSubmittingCode}
              >
                {isSubmittingCode ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>Submit</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title={`Hi, ${studentData.fullName || 'Student'}`}
        subtitle="Welcome to your dashboard"
        onLogout={isLoading ? null : handleLogout}
        showLogout={true}
      />

      {/* Main Content */}
      <View style={styles.content}>
        {isLoading && !isRefreshing ? (
          <ActivityIndicator size="large" color="#165973" style={styles.loader} />
        ) : (
          <FlatList
            data={recentCourses}
            renderItem={renderCourseItem}
            keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
            ListHeaderComponent={
              <>
                {renderAttendanceStats()}
                
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Recent Courses</Text>
                  <TouchableOpacity 
                    style={styles.viewAllButton}
                    onPress={() => navigation.navigate('StudentCourses', { studentData })}
                  >
                    <Text style={styles.viewAllText}>View All</Text>
                  </TouchableOpacity>
                </View>
                
                {recentCourses.length === 0 && (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>You are not enrolled in any courses</Text>
                    <TouchableOpacity
                      style={styles.enrollButton}
                      onPress={() => navigation.navigate('StudentCourses', { studentData })}
                    >
                      <Text style={styles.enrollButtonText}>Enroll in Courses</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            }
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                colors={['#165973']}
              />
            }
          />
        )}
      </View>

      {/* TabBar */}
      <TabBar
        tabs={studentTabs}
        activeTab={activeTab}
        onTabPress={handleTabPress}
      />

      {/* Manual Code Modal */}
      {renderManualCodeModal()}

      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={hideAlert}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 5,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  viewAllButton: {
    padding: 5,
  },
  viewAllText: {
    color: '#165973',
    fontWeight: '500',
  },
  courseCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  courseHeader: {
    marginBottom: 10,
  },
  courseCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#165973',
  },
  courseName: {
    fontSize: 14,
    color: '#333',
    marginTop: 4,
  },
  courseDetailsWrapper: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailIcon: {
    marginRight: 8,
  },
  instructorName: {
    fontSize: 13,
    color: '#666',
    flex: 1,
  },
  courseSchedule: {
    fontSize: 13,
    color: '#666',
    flex: 1,
  },
  courseRoom: {
    fontSize: 13,
    color: '#666',
    flex: 1,
  },
  courseActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 5,
    flex: 1,
  },
  actionButtonText: {
    fontSize: 12,
    color: '#165973',
    marginTop: 4,
  },
  emptyState: {
    padding: 30,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    marginTop: 10,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 15,
  },
  enrollButton: {
    backgroundColor: '#165973',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  enrollButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    width: '100%',
    maxHeight: '60%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#165973',
  },
  closeButton: {
    padding: 5,
  },
  manualCodeContainer: {
    padding: 15,
  },
  selectedCourseInfo: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f7f9fa',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#165973',
  },
  selectedCourseCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#165973',
    marginBottom: 4,
  },
  selectedCourseName: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  codeInstructions: {
    fontSize: 14,
    color: '#555',
    marginBottom: 15,
    lineHeight: 20,
  },
  codeInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  codeInputError: {
    borderColor: '#dc3545',
  },
  codeErrorText: {
    color: '#dc3545',
    fontSize: 14,
    marginBottom: 10,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    padding: 15,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    backgroundColor: '#f2f2f2',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '500',
  },
  submitButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    backgroundColor: '#165973',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
});

export default StudentDashboard; 