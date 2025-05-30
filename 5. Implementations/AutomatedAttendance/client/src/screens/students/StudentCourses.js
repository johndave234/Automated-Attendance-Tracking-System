import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  FlatList,
  Text,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';
import { API_URL, endpoints } from '../../config/api';
import Header from '../../components/Header';
import TabBar from '../../components/TabBar';
import CustomAlert from '../../components/CustomAlert';
import SearchBar from '../../components/SearchBar';
import CustomModal from '../../components/Modal';
import { Ionicons } from '@expo/vector-icons';

const StudentCourses = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const studentData = route.params?.studentData || {};
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('courses');
  const [searchQuery, setSearchQuery] = useState('');
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'error'
  });
  
  // Modal state
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isCodeModalVisible, setIsCodeModalVisible] = useState(false);
  const [availableCourses, setAvailableCourses] = useState([]);
  const [modalSearchQuery, setModalSearchQuery] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [enrollmentCode, setEnrollmentCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [codeError, setCodeError] = useState('');
  
  // New state for manual code attendance
  const [isManualCodeModalVisible, setIsManualCodeModalVisible] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [manualCodeError, setManualCodeError] = useState('');
  const [isSubmittingCode, setIsSubmittingCode] = useState(false);
  const [selectedCourseForCode, setSelectedCourseForCode] = useState(null);
  
  // Filter courses based on search query
  const filteredCourses = courses.filter(course => 
    course.courseCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.courseName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.instructor?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.room?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter available courses based on search query
  const filteredAvailableCourses = availableCourses.filter(course => 
    course.courseCode?.toLowerCase().includes(modalSearchQuery.toLowerCase()) ||
    course.courseName?.toLowerCase().includes(modalSearchQuery.toLowerCase()) ||
    (course.instructor && course.instructor.toLowerCase().includes(modalSearchQuery.toLowerCase()))
  );

  const fetchEnrolledCourses = async () => {
    try {
      console.log('Fetching courses for student:', studentData.idNumber);
      const response = await axios.get(`${API_URL}/api/students/enrolled-courses/${studentData.idNumber}`);
      console.log('API Response:', response.data);
      
      if (response.data.success) {
        setCourses(response.data.courses);
      } else {
        showAlert('Error', response.data.message || 'Failed to fetch courses');
      }
    } catch (error) {
      console.error('Error fetching courses:', error.response?.data || error.message);
      showAlert('Error', error.response?.data?.message || 'Failed to fetch enrolled courses');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const fetchAvailableCourses = async () => {
    try {
      console.log('Fetching available courses');
      setIsLoading(true);
      
      const response = await axios.get(`${API_URL}${endpoints.courses}/available`);
      console.log('Available courses:', response.data);
      
      if (response.data && response.data.length > 0) {
        // Store available courses
        setAvailableCourses(response.data);
        setModalSearchQuery('');
        setSelectedCourseId('');
        
        // Show the modal
        setIsModalVisible(true);
      } else {
        console.log('No available courses found');
        showAlert('Info', 'No courses are available for enrollment. Please contact your administrator.');
      }
    } catch (error) {
      console.error('Error fetching available courses:', error.response?.data || error.message);
      const errorMessage = error.response?.data?.message || 'Failed to fetch available courses';
      showAlert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const enrollInCourse = async (courseId) => {
    try {
      console.log('Attempting to enroll in course:', courseId);
      console.log('Student ID:', studentData.idNumber);
      
      const response = await axios.post(`${API_URL}${endpoints.courses}/${courseId}/enroll-student`, {
        studentId: studentData.idNumber
      });
      
      console.log('Enrollment response:', response.data);
      
      if (response.data.success || response.data.message.includes('success')) {
        showAlert('Success', 'Enrolled in course successfully', 'success');
        // Wait a bit before refreshing the course list
        setTimeout(() => {
          fetchEnrolledCourses();
        }, 1000);
      } else {
        showAlert('Error', response.data.message || 'Failed to enroll in course');
      }
    } catch (error) {
      console.error('Error enrolling in course:', error.response?.data || error.message);
      const errorMessage = error.response?.data?.message || 'Failed to enroll in course';
      showAlert('Error', errorMessage);
    }
  };

  // Handle enrollment from modal
  const handleEnrollInCourse = async () => {
    if (selectedCourseId) {
      await enrollInCourse(selectedCourseId);
      setIsModalVisible(false);
    } else {
      showAlert('Error', 'Please select a course to enroll');
    }
  };

  // Custom render function for the modal content
  const renderModalContent = () => {
    return (
      <View style={styles.modalContainer}>
        <SearchBar
          searchValue={modalSearchQuery}
          onSearchChange={setModalSearchQuery}
          searchPlaceholder="Search courses to enroll..."
          showCreateButton={false}
        />
        
        <ScrollView style={styles.enrollCoursesList}>
          {filteredAvailableCourses.length > 0 ? (
            filteredAvailableCourses.map(course => (
              <TouchableOpacity
                key={course._id}
                style={[
                  styles.courseOption,
                  selectedCourseId === course._id && styles.selectedCourseOption
                ]}
                onPress={() => handleCourseSelect(course)}
              >
                <View style={styles.courseOptionContent}>
                  <Text style={styles.courseOptionCode}>{course.courseCode}</Text>
                  <Text style={styles.courseOptionName}>{course.courseName}</Text>
                  <Text style={styles.courseOptionInstructor}>
                    Instructor: {course.instructor || 'Not assigned'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#666" />
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptySearchResults}>
              <Text style={styles.emptySearchText}>No courses found</Text>
              <Text style={styles.emptySearchSubtext}>Try a different search term</Text>
            </View>
          )}
        </ScrollView>
      </View>
    );
  };

  useEffect(() => {
    if (studentData.idNumber) {
      fetchEnrolledCourses();
    } else {
      console.error('No student ID available');
      setIsLoading(false);
    }
  }, [studentData.idNumber]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchEnrolledCourses();
  };

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

  const handleTabPress = (tabKey) => {
    if (tabKey === 'dashboard') {
      navigation.navigate('StudentDashboard', { studentData });
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

  // New function for manual code attendance
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

  const renderCourseItem = ({ item }) => (
    <View style={styles.courseCard}>
      <View style={styles.courseHeader}>
        <View style={styles.courseInfo}>
          <Text style={styles.courseCode}>{item.courseCode}</Text>
          <Text style={styles.courseName}>{item.courseName}</Text>
        </View>
        <TouchableOpacity 
          style={styles.qrButton}
          onPress={() => handleQRScan(item)}
        >
          <Ionicons name="qr-code-outline" size={24} color="#165973" />
          <Text style={styles.qrButtonText}>Scan QR</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.courseDetailsWrapper}>
        <View style={styles.detailsContainer}>
          <View style={styles.instructorRow}>
            <Ionicons name="person-outline" size={16} color="#666" style={styles.detailIcon} />
            <Text numberOfLines={1} style={styles.instructorText}>Instructor: {item.instructor}</Text>
          </View>
          
          <View style={styles.scheduleRow}>
            <Ionicons name="calendar-outline" size={16} color="#666" style={styles.detailIcon} />
            <Text style={styles.courseSchedule}>{item.schedule}</Text>
          </View>
          
          <View style={styles.roomRow}>
            <Ionicons name="location-outline" size={16} color="#666" style={styles.detailIcon} />
            <Text style={styles.courseRoom}>Room: {item.room}</Text>
          </View>
        </View>
      </View>
    </View>
  );

  console.log('Current courses state:', courses);
  console.log('Student Data:', studentData);

  // When a course is selected, show the code modal
  const handleCourseSelect = (course) => {
    setSelectedCourseId(course._id);
    setSelectedCourse(course);
    setEnrollmentCode('');
    setCodeError('');
    setIsModalVisible(false);
    setIsCodeModalVisible(true);
  };
  
  // Validate enrollment code and show inline errors
  const validateEnrollmentCode = (code) => {
    setEnrollmentCode(code);
    
    if (!code.trim()) {
      setCodeError('Please enter the enrollment code');
    } else {
      setCodeError('');
    }
  };
  
  // Handle enrollment with code
  const handleEnrollWithCode = async () => {
    if (!enrollmentCode.trim()) {
      setCodeError('Please enter the enrollment code');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // First step: Verify the enrollment code
      const verifyResponse = await axios.post(`${API_URL}${endpoints.courseVerifyCode}`, {
        courseId: selectedCourseId,
        enrollmentCode: enrollmentCode
      });
      
      console.log('Verification response:', verifyResponse.data);
      
      // If verification fails, show error and stop
      if (!verifyResponse.data.success) {
        setCodeError('Invalid enrollment code. Please try again.');
        showAlert('Error', 'Invalid enrollment code', 'error');
        setIsSubmitting(false);
        return;
      }
      
      // If verification succeeds, proceed with enrollment
      const enrollResponse = await axios.post(`${API_URL}${endpoints.courses}/${selectedCourseId}/enroll-student`, {
        studentId: studentData.idNumber
      });
      
      console.log('Enrollment response:', enrollResponse.data);
      
      if (enrollResponse.data.success || enrollResponse.data.message.includes('success')) {
        // If enrollment is successful, close the modal and show success alert
        setIsCodeModalVisible(false);
        showAlert('Success', 'Enrolled in course successfully', 'success');
        
        // Wait a bit before refreshing the course list
        setTimeout(() => {
          fetchEnrolledCourses();
        }, 1000);
      } else {
        // If there's an error message from the server, show it
        setCodeError(enrollResponse.data.message || 'Failed to enroll in course');
        showAlert('Error', enrollResponse.data.message || 'Failed to enroll in course', 'error');
      }
    } catch (error) {
      console.error('Error during enrollment process:', error.response?.data || error.message);
      
      // Check if this is a verification error or enrollment error
      const errorMessage = error.response?.data?.message || 'An error occurred during enrollment';
      
      // Update the UI with the error
      setCodeError(errorMessage);
      showAlert('Error', errorMessage, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render enrollment code modal
  const renderCodeModal = () => {
    // Convert string values to boolean
    const isDisabled = Boolean(isSubmitting || codeError || !enrollmentCode.trim());
    
    return (
      <Modal
        visible={isCodeModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsCodeModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.codeModalContent]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Enter Enrollment Code</Text>
              <TouchableOpacity onPress={() => setIsCodeModalVisible(false)} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.codeModalContainer}>
              {selectedCourse && (
                <View style={styles.selectedCourseInfo}>
                  <Text style={styles.selectedCourseCode}>{selectedCourse.courseCode}</Text>
                  <Text style={styles.selectedCourseName}>{selectedCourse.courseName}</Text>
                  <Text style={styles.selectedCourseInstructor}>
                    Instructor: {selectedCourse.instructor || 'Not assigned'}
                  </Text>
                </View>
              )}
              
              <Text style={styles.codeInstructions}>
                Please enter the enrollment code provided by your instructor to enroll in this course.
              </Text>
              
              <TextInput
                style={[styles.codeInput, codeError ? styles.codeInputError : null]}
                value={enrollmentCode}
                onChangeText={validateEnrollmentCode}
                placeholder="Enter enrollment code"
                placeholderTextColor="#999"
                autoCapitalize="none"
                autoCorrect={false}
              />
              
              {codeError ? (
                <Text style={styles.codeErrorText}>{codeError}</Text>
              ) : null}
            </View>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => {
                  setIsCodeModalVisible(false);
                  setIsModalVisible(true);
                }}
              >
                <Text style={styles.cancelButtonText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.enrollButton,
                  isDisabled ? styles.disabledButton : null
                ]}
                onPress={handleEnrollWithCode}
                disabled={isDisabled}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.enrollButtonText}>Enroll</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

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
          <View style={[styles.modalContent, styles.manualCodeModalContent]}>
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
        title="My Courses"
        subtitle={`Student: ${studentData.fullName || 'Unknown'}`}
      />

      <View style={styles.content}>
        <SearchBar
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search courses..."
          showCreateButton={true}
          createButtonText="Add"
          onCreatePress={() => fetchAvailableCourses()}
        />
        
        {isLoading ? (
          <ActivityIndicator size="large" color="#165973" />
        ) : courses.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>You are not enrolled in any courses</Text>
            <Text style={styles.emptyStateSubText}>Please contact your administrator</Text>
            <TouchableOpacity 
              style={styles.checkButton}
              onPress={fetchAvailableCourses}
            >
              <Text style={styles.checkButtonText}>Check Available Courses</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={filteredCourses}
            renderItem={renderCourseItem}
            keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
            contentContainerStyle={styles.coursesList}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={onRefresh}
                colors={['#165973']}
              />
            }
          />
        )}
      </View>

      <TabBar
        tabs={studentTabs}
        activeTab={activeTab}
        onTabPress={handleTabPress}
      />

      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={hideAlert}
      />

      {/* Course search modal */}
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Available Courses</Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            {renderModalContent()}
            
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setIsModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {renderCodeModal()}
      {renderManualCodeModal()}
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
    padding: 20,
  },
  coursesList: {
    paddingBottom: 20,
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
    elevation: 5,
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  courseInfo: {
    flex: 1,
    marginRight: 10,
  },
  courseCode: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#165973',
    marginBottom: 5,
  },
  courseName: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
  },
  qrButton: {
    borderRadius: 8,
    padding: 10,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  qrButtonText: {
    color: '#165973',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  courseDetailsWrapper: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 2,
  },
  detailsContainer: {
    justifyContent: 'flex-start',
  },
  instructorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  roomRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIcon: {
    marginRight: 6,
  },
  instructorText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
    marginRight: 10,
    paddingTop: 0,
  },
  courseSchedule: {
    fontSize: 14,
    color: '#666',
    marginBottom: 1,
    paddingTop: 0,
  },
  courseRoom: {
    fontSize: 14,
    color: '#666',
    paddingTop: 0,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStateSubText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  checkButton: {
    backgroundColor: '#165973',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    marginTop: 15,
  },
  checkButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
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
    maxHeight: '80%',
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
  modalContainer: {
    padding: 15,
  },
  enrollCoursesList: {
    maxHeight: 300,
    marginTop: 10,
  },
  courseOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  selectedCourseOption: {
    borderColor: '#4CAF50',
    backgroundColor: '#f1f8e9',
  },
  courseOptionContent: {
    flex: 1,
  },
  courseOptionCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#165973',
    marginBottom: 4,
  },
  courseOptionName: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  courseOptionInstructor: {
    fontSize: 12,
    color: '#666',
  },
  emptySearchResults: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptySearchText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
    marginBottom: 5,
  },
  emptySearchSubtext: {
    fontSize: 14,
    color: '#999',
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
  enrollButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    backgroundColor: '#165973',
  },
  enrollButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
  codeModalContent: {
    maxHeight: '60%',
  },
  codeModalContainer: {
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
  selectedCourseInstructor: {
    fontSize: 12,
    color: '#666',
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
  manualCodeModalContent: {
    maxHeight: '60%',
  },
  manualCodeContainer: {
    padding: 15,
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
});

export default StudentCourses; 