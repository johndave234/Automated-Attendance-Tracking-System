import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Dimensions,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../config';
import CustomAlert from '../../components/CustomAlert';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, typography, shadows, borderRadius } from '../../config/theme';

const { width } = Dimensions.get('window');

// Project colors
const projectColors = {
  navy: '#1a237e',     // Dark navy blue for primary background
  orange: '#ff5722',   // Orange accent color for buttons and highlights
  white: '#FFFFFF',    // White for text on dark backgrounds
  lightGray: '#f5f6fa', // Light gray for backgrounds
  darkGray: '#333333', // Dark gray for text
  mediumGray: '#666666', // Medium gray for secondary text
};

const StudentDashboard = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const studentData = route.params?.studentData || {};
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [courses, setCourses] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState({
    present: 0,
    absent: 0,
    total: 0,
    rate: 0
  });
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'error'
  });

  useEffect(() => {
    fetchCourses();
    fetchAttendanceStats();
  }, []);

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

  const fetchCourses = async () => {
    try {
      setIsLoading(true);
      // For demo purposes, we'll use mock data
      // In a real app, you would fetch this from your API
      setTimeout(() => {
        setCourses([
          { id: '1', code: 'CS101', name: 'Introduction to Computer Science', instructor: 'Dr. Smith' },
          { id: '2', code: 'MATH201', name: 'Calculus II', instructor: 'Prof. Johnson' },
          { id: '3', code: 'ENG102', name: 'Academic Writing', instructor: 'Dr. Williams' },
          { id: '4', code: 'PHYS101', name: 'Physics I', instructor: 'Prof. Brown' },
          { id: '5', code: 'CHEM101', name: 'General Chemistry', instructor: 'Dr. Davis' },
        ]);
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching courses:', error);
      setIsLoading(false);
    }
  };

  const fetchAttendanceStats = async () => {
    try {
      // For demo purposes, we'll use mock data
      // In a real app, you would fetch this from your API
      setTimeout(() => {
        setAttendanceStats({
          present: 42,
          absent: 8,
          total: 50,
          rate: 84
        });
      }, 1000);
    } catch (error) {
      console.error('Error fetching attendance stats:', error);
    }
  };

  const handleLogout = async () => {
    // Show confirmation dialog
    Alert.alert(
      "Confirm Logout",
      "Are you sure you want to log out?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
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
          }
        }
      ],
      { cancelable: true }
    );
  };

  const renderCourseItem = ({ item }) => (
    <View style={styles.courseItem}>
      <View style={styles.courseHeader}>
        <Text style={styles.courseCode}>{item.code}</Text>
        <TouchableOpacity style={styles.viewButton}>
          <Text style={styles.viewButtonText}>View Details</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.courseName}>{item.name}</Text>
      <Text style={styles.instructorName}>Instructor: {item.instructor}</Text>
    </View>
  );

  const renderDashboardTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.statsContainer}>
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Attendance Rate</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{attendanceStats.present}</Text>
              <Text style={styles.statLabel}>Present</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{attendanceStats.absent}</Text>
              <Text style={styles.statLabel}>Absent</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{attendanceStats.rate}%</Text>
              <Text style={styles.statLabel}>Rate</Text>
            </View>
          </View>
        </View>
      </View>
      
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Courses</Text>
      </View>
      
      {isLoading ? (
        <ActivityIndicator size="large" color={projectColors.orange} style={styles.loader} />
      ) : courses.length > 0 ? (
        courses.slice(0, 3).map((item) => renderCourseItem({ item }))
      ) : (
        <Text style={styles.noCourses}>No courses enrolled yet</Text>
      )}
    </ScrollView>
  );

  const renderCoursesTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>My Courses</Text>
      </View>
      
      {isLoading ? (
        <ActivityIndicator size="large" color={projectColors.orange} style={styles.loader} />
      ) : courses.length > 0 ? (
        <FlatList
          data={courses}
          renderItem={renderCourseItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.coursesList}
        />
      ) : (
        <Text style={styles.noCourses}>No courses enrolled yet</Text>
      )}
    </View>
  );
  
  const renderQRScannerTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.qrContainer}>
        <Ionicons name="qr-code-outline" size={100} color={projectColors.orange} />
        <Text style={styles.qrText}>Tap to scan attendance QR code</Text>
        <TouchableOpacity 
          style={styles.scanButton}
          onPress={() => navigation.navigate('QRScanner', { studentData })}
        >
          <Text style={styles.scanButtonText}>Scan QR Code</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.welcomeText}>Hi,</Text>
          <Text style={styles.studentName}>{studentData.fullName || 'Student'}</Text>
        </View>
        <TouchableOpacity 
          onPress={handleLogout} 
          style={styles.logoutButton}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={projectColors.white} size="small" />
          ) : (
            <Ionicons name="log-out-outline" size={24} color={projectColors.white} />
          )}
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <View style={styles.mainContent}>
        {activeTab === 'dashboard' && renderDashboardTab()}
        {activeTab === 'courses' && renderCoursesTab()}
        {activeTab === 'scanner' && renderQRScannerTab()}
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'dashboard' && styles.activeTab]} 
          onPress={() => setActiveTab('dashboard')}
        >
          <Ionicons 
            name={activeTab === 'dashboard' ? 'home' : 'home-outline'} 
            size={24} 
            color={activeTab === 'dashboard' ? projectColors.orange : projectColors.white} 
          />
          <Text style={[styles.tabLabel, activeTab === 'dashboard' && styles.activeTabLabel]}>Dashboard</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'courses' && styles.activeTab]} 
          onPress={() => setActiveTab('courses')}
        >
          <Ionicons 
            name={activeTab === 'courses' ? 'book' : 'book-outline'} 
            size={24} 
            color={activeTab === 'courses' ? projectColors.orange : projectColors.white} 
          />
          <Text style={[styles.tabLabel, activeTab === 'courses' && styles.activeTabLabel]}>Courses</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'scanner' && styles.activeTab]} 
          onPress={() => setActiveTab('scanner')}
        >
          <Ionicons 
            name={activeTab === 'scanner' ? 'qr-code' : 'qr-code-outline'} 
            size={24} 
            color={activeTab === 'scanner' ? projectColors.orange : projectColors.white} 
          />
          <Text style={[styles.tabLabel, activeTab === 'scanner' && styles.activeTabLabel]}>Scan QR</Text>
        </TouchableOpacity>
      </View>

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
    backgroundColor: projectColors.lightGray,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: projectColors.navy,
    borderBottomWidth: 0,
    ...shadows.medium,
  },
  headerContent: {
    flex: 1,
  },
  welcomeText: {
    ...typography.body1,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: spacing.xs,
  },
  studentName: {
    ...typography.h2,
    color: projectColors.white,
  },
  logoutButton: {
    padding: spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
  },
  mainContent: {
    flex: 1,
    backgroundColor: projectColors.lightGray,
  },
  tabContent: {
    flex: 1,
    padding: spacing.md,
  },
  statsContainer: {
    marginBottom: spacing.lg,
  },
  statsCard: {
    backgroundColor: projectColors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.medium,
  },
  statsTitle: {
    ...typography.h3,
    color: projectColors.navy,
    marginBottom: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    ...typography.h2,
    color: projectColors.orange,
    marginBottom: spacing.xs,
  },
  statLabel: {
    ...typography.body2,
    color: projectColors.mediumGray,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    color: projectColors.navy,
  },
  courseItem: {
    backgroundColor: projectColors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.small,
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  courseCode: {
    ...typography.body2,
    fontWeight: 'bold',
    color: projectColors.orange,
  },
  courseName: {
    ...typography.h3,
    color: projectColors.darkGray,
    marginBottom: spacing.xs,
  },
  instructorName: {
    ...typography.body2,
    color: projectColors.mediumGray,
  },
  viewButton: {
    backgroundColor: `${projectColors.orange}15`,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  viewButtonText: {
    ...typography.caption,
    color: projectColors.orange,
    fontWeight: '500',
  },
  noCourses: {
    ...typography.body1,
    color: projectColors.mediumGray,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  loader: {
    marginTop: spacing.xl,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: projectColors.navy,
    borderTopWidth: 0,
    height: 60,
    ...shadows.medium,
  },
  tab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  activeTab: {
    borderTopWidth: 2,
    borderTopColor: projectColors.orange,
  },
  tabLabel: {
    ...typography.caption,
    marginTop: spacing.xs,
    color: projectColors.white,
  },
  activeTabLabel: {
    color: projectColors.orange,
    fontWeight: '500',
  },
  qrContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  qrText: {
    ...typography.body1,
    textAlign: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
    color: projectColors.mediumGray,
  },
  scanButton: {
    backgroundColor: projectColors.orange,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    ...shadows.small,
  },
  scanButtonText: {
    color: projectColors.white,
    ...typography.body1,
    fontWeight: '600',
  },
  coursesList: {
    paddingBottom: spacing.xl,
  },
});

export default StudentDashboard; 