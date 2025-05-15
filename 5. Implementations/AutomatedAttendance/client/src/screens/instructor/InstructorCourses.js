import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  ScrollView,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL, endpoints } from '../../config/api';
import CustomAlert from '../../components/CustomAlert';
import SearchBar from '../../components/SearchBar';
import QRCode from 'react-native-qrcode-svg';
import axios from 'axios';
import { useNavigation, useRoute } from '@react-navigation/native';

const InstructorCourses = () => {
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [alert, setAlert] = useState({
    visible: false,
    type: 'success',
    message: '',
    showConfirmButton: false,
    confirmText: '',
    cancelText: '',
    onConfirm: null,
  });

  const [qrModal, setQrModal] = useState({
    visible: false,
    course: null,
    timeLeft: 1800,
    uniqueCode: '',
    generatedAt: null,
  });

  const [activeQRCodes, setActiveQRCodes] = useState({});

  const navigation = useNavigation();

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    filterCourses();
  }, [searchQuery, courses]);

  // Timer effect for QR code expiration
  useEffect(() => {
    let timer;
    if (qrModal.visible && qrModal.timeLeft > 0) {
      timer = setInterval(() => {
        setQrModal(prev => ({
          ...prev,
          timeLeft: prev.timeLeft - 1
        }));
      }, 1000);
    } else if (qrModal.timeLeft === 0) {
      setQrModal(prev => ({ ...prev, visible: false }));
      // Remove expired code from active codes
      if (qrModal.course) {
        setActiveQRCodes(prev => {
          const newCodes = { ...prev };
          delete newCodes[qrModal.course._id];
          return newCodes;
        });
      }
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [qrModal.visible, qrModal.timeLeft]);

  const filterCourses = () => {
    if (!searchQuery.trim()) {
      setFilteredCourses(courses);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = courses.filter(course => 
      course.courseCode.toLowerCase().includes(query) ||
      course.courseName.toLowerCase().includes(query) ||
      course.enrollmentCode.toLowerCase().includes(query)
    );
    setFilteredCourses(filtered);
  };

  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const instructorId = await AsyncStorage.getItem('idNumber');
      
      if (!instructorId) {
        setError('Instructor ID not found. Please login again.');
        navigation.replace('InstructorLogin');
        return;
      }

      const response = await axios.get(`${API_URL}/api/courses/instructor/${instructorId}`);

      if (response.data) {
        setCourses(response.data);
      } else {
        setError('No courses found');
      }
    } catch (err) {
      console.error('Error details:', err.response?.data || err.message);
      if (err.response?.status === 401) {
        setError('Session expired. Please login again.');
        navigation.replace('InstructorLogin');
      } else {
        setError(`Failed to fetch courses: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const generateUniqueCode = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  };

  const checkExistingQRCode = (courseId) => {
    const existingCode = activeQRCodes[courseId];
    if (!existingCode) return null;

    const now = new Date().getTime();
    const expirationTime = existingCode.generatedAt + (1800 * 1000); // 30 minutes in milliseconds (changed from 2 minutes to 30 minutes)

    if (now < expirationTime) {
      const timeLeft = Math.ceil((expirationTime - now) / 1000);
      return {
        ...existingCode,
        timeLeft,
      };
    }

    // Remove expired code
    setActiveQRCodes(prev => {
      const newCodes = { ...prev };
      delete newCodes[courseId];
      return newCodes;
    });
    return null;
  };

  const handleQRCode = (course) => {
    const existingCode = checkExistingQRCode(course._id);

    if (existingCode) {
      // Use existing code if not expired
      setQrModal({
        visible: true,
        course: course,
        timeLeft: existingCode.timeLeft,
        uniqueCode: existingCode.uniqueCode,
        generatedAt: existingCode.generatedAt,
      });
    } else {
      // Show confirmation for new code generation
      setAlert({
        visible: true,
        type: 'warning',
        message: 'Are you sure you want to generate QR code for this course?',
        showConfirmButton: true,
        confirmText: 'Yes',
        cancelText: 'No',
        onConfirm: () => {
          setAlert(prev => ({ ...prev, visible: false }));
          const uniqueCode = generateUniqueCode();
          const generatedAt = new Date().getTime();

          // Save new code to active codes
          setActiveQRCodes(prev => ({
            ...prev,
            [course._id]: {
              uniqueCode,
              generatedAt,
              courseId: course._id,
            }
          }));

          setQrModal({
            visible: true,
            course: course,
            timeLeft: 1800,
            uniqueCode: uniqueCode,
            generatedAt: generatedAt,
          });
        }
      });
    }
  };

  const generateQRValue = (course, uniqueCode, generatedAt) => {
    // Calculate expiration timestamp (30 minutes from generation time)
    const expirationTime = new Date(generatedAt + (1800 * 1000));
    
    const qrData = {
      courseId: course._id,
      courseCode: course.courseCode,
      enrollmentCode: course.enrollmentCode,
      uniqueCode: uniqueCode,
      timestamp: new Date(generatedAt).toISOString(),
      expiresIn: 1800, // Changed from 120 seconds (2 minutes) to 1800 seconds (30 minutes)
      expiresAt: expirationTime.toISOString() // Add explicit expiration timestamp
    };
    return JSON.stringify(qrData);
  };

  const renderCourseCard = ({ item }) => (
    <TouchableOpacity 
      style={styles.courseCard}
      onPress={() => navigation.navigate('EnrolledStudent', { courseId: item._id })}
    >
      <View style={styles.courseHeader}>
        <Text style={styles.courseCode}>{item.courseCode}</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Ionicons name="people-outline" size={20} color="#165973" />
            <Text style={styles.statText}>{item.totalStudents || 0}</Text>
          </View>
        </View>
      </View>
      <Text style={styles.courseName}>{item.courseName}</Text>
      <View style={styles.courseFooter}>
        <View style={styles.enrollmentCode}>
          <Text style={styles.enrollmentLabel}>Enrollment Code:</Text>
          <Text style={styles.enrollmentValue}>{item.enrollmentCode}</Text>
        </View>
        <TouchableOpacity 
          style={styles.qrButton}
          onPress={() => handleQRCode(item)}
        >
          <Ionicons name="qr-code-outline" size={24} color="#165973" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchWrapper}>
        <SearchBar
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search courses..."
          showCreateButton={false}
        />
      </View>
      
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#165973" />
        </View>
      ) : filteredCourses.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="book-outline" size={48} color="#999" />
          <Text style={styles.emptyText}>
            {searchQuery.trim() 
              ? 'No courses found matching your search'
              : 'No courses assigned yet'}
          </Text>
          <TouchableOpacity onPress={fetchCourses}>
            <Text style={styles.refreshText}>Tap to refresh</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredCourses}
          renderItem={renderCourseCard}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshing={loading}
          onRefresh={fetchCourses}
        />
      )}

      <CustomAlert
        visible={alert.visible}
        type={alert.type}
        message={alert.message}
        showConfirmButton={alert.showConfirmButton}
        confirmText={alert.confirmText}
        cancelText={alert.cancelText}
        onConfirm={alert.onConfirm}
        onClose={() => setAlert(prev => ({ ...prev, visible: false }))}
      />

      <Modal
        visible={qrModal.visible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setQrModal(prev => ({ ...prev, visible: false }))}
      >
        <View style={styles.overlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              {qrModal.course?.courseCode} - {qrModal.course?.courseName}
            </Text>
            <Text style={styles.timerText}>
              Expires in: {qrModal.timeLeft} seconds
            </Text>
            <View style={styles.qrWrapper}>
              {qrModal.course && (
                <QRCode
                  value={generateQRValue(qrModal.course, qrModal.uniqueCode, qrModal.generatedAt)}
                  size={200}
                  color="#165973"
                  backgroundColor="white"
                />
              )}
            </View>
            <View style={styles.codeContainer}>
              <Text style={styles.codeLabel}>Manual Code:</Text>
              <Text style={styles.codeValue}>{qrModal.uniqueCode}</Text>
            </View>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setQrModal(prev => ({ ...prev, visible: false }))}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  refreshText: {
    marginTop: 10,
    fontSize: 14,
    color: '#2196F3',
    textAlign: 'center',
  },
  listContainer: {
    padding: 16,
  },
  searchWrapper: {
    padding: 16,
    paddingBottom: 0,
    backgroundColor: '#f5f5f5',
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
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
  },
  statText: {
    marginLeft: 4,
    fontSize: 16,
    color: '#165973',
    fontWeight: '500',
  },
  courseName: {
    fontSize: 16,
    color: '#333',
    marginBottom: 12,
  },
  courseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  enrollmentCode: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  enrollmentLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 6,
  },
  enrollmentValue: {
    fontSize: 14,
    color: '#165973',
    fontWeight: '500',
  },
  qrButton: {
    padding: 8,
    marginLeft: 16,
  },
  qrWrapper: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginVertical: 16,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    width: '90%',
    maxWidth: 340,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#165973',
    marginBottom: 20,
    textAlign: 'center',
  },
  timerText: {
    fontSize: 16,
    color: '#f44336',
    marginBottom: 16,
    fontWeight: '500',
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 20,
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    width: '100%',
    justifyContent: 'center',
  },
  codeLabel: {
    fontSize: 16,
    color: '#666',
    marginRight: 8,
  },
  codeValue: {
    fontSize: 20,
    color: '#165973',
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  closeButton: {
    backgroundColor: '#165973',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default InstructorCourses; 