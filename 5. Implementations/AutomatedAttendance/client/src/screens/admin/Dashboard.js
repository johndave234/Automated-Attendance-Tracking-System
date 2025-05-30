import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import TabBar from '../../components/TabBar';
import Header from '../../components/Header';
import StatisticsChart from '../../components/StatisticsChart';
import TrendChart from '../../components/TrendChart';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../config/api';
import { ADMIN_CREDENTIALS } from '../../config/auth';
import Courses from './Courses';
import Users from './Users';
import Ionicons from 'react-native-vector-icons/Ionicons';
import CustomAlert from '../../components/CustomAlert';

const Dashboard = () => {
  const navigation = useNavigation();
  const { loginAdmin, logoutAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [statistics, setStatistics] = useState({
    students: 0,
    instructors: 0,
    courses: 0,
  });
  const [trendData, setTrendData] = useState({
    labels: [],
    datasets: [
      {
        data: [0], // Initialize with a single 0 to prevent empty data error
      },
    ],
  });
  const [isFixingInstructors, setIsFixingInstructors] = useState(false);
  const [alert, setAlert] = useState({
    visible: false,
    type: 'success',
    message: ''
  });

  useEffect(() => {
    loginAdmin();
    fetchStatistics();
    fetchTrendData();
  }, []);

  const fetchStatistics = async () => {
    try {
      // Fetch students count
      const studentsRes = await fetch(`${API_URL}/api/students`, {
        headers: {
          'Content-Type': 'application/json',
          'admin-id': ADMIN_CREDENTIALS.ADMIN_ID,
          'admin-password': ADMIN_CREDENTIALS.ADMIN_PASSWORD
        }
      });
      const students = await studentsRes.json();

      // Fetch instructors count
      const instructorsRes = await fetch(`${API_URL}/api/instructors`, {
        headers: {
          'Content-Type': 'application/json',
          'admin-id': ADMIN_CREDENTIALS.ADMIN_ID,
          'admin-password': ADMIN_CREDENTIALS.ADMIN_PASSWORD
        }
      });
      const instructors = await instructorsRes.json();

      // Fetch courses count
      const coursesRes = await fetch(`${API_URL}/api/courses`, {
        headers: {
          'Content-Type': 'application/json',
          'admin-id': ADMIN_CREDENTIALS.ADMIN_ID,
          'admin-password': ADMIN_CREDENTIALS.ADMIN_PASSWORD
        }
      });
      const courses = await coursesRes.json();

      setStatistics({
        students: Array.isArray(students) ? students.length : 0,
        instructors: Array.isArray(instructors) ? instructors.length : 0,
        courses: Array.isArray(courses) ? courses.length : 0,
      });
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const fetchTrendData = async () => {
    try {
      // Fetch students with creation dates
      const studentsRes = await fetch(`${API_URL}/api/students`, {
        headers: {
          'Content-Type': 'application/json',
          'admin-id': ADMIN_CREDENTIALS.ADMIN_ID,
          'admin-password': ADMIN_CREDENTIALS.ADMIN_PASSWORD
        }
      });
      const students = await studentsRes.json();

      // Get last 7 days
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date;
      }).reverse();

      // Process data to get counts per day
      const counts = last7Days.map(date => {
        const dayStart = new Date(date.setHours(0, 0, 0, 0));
        const dayEnd = new Date(date.setHours(23, 59, 59, 999));
        
        return students.filter(student => {
          const createdAt = new Date(student.createdAt);
          return createdAt >= dayStart && createdAt <= dayEnd;
        }).length;
      });

      // Format dates for labels
      const labels = last7Days.map(date => {
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${month}/${day}`;
      });

      setTrendData({
        labels,
        datasets: [
          {
            data: counts,
            color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
            strokeWidth: 2,
          },
        ],
      });
    } catch (error) {
      console.error('Error fetching trend data:', error);
      // Set default data in case of error
      setTrendData({
        labels: [''],
        datasets: [{ data: [0] }],
      });
    }
  };

  const handleLogout = () => {
    logoutAdmin();
    navigation.replace('RoleSelection');
  };

  const handleTabPress = (tabKey) => {
    setActiveTab(tabKey);
  };

  const handleStatPress = (type) => {
    switch (type) {
      case 'students':
      case 'courses':
        setActiveTab(type === 'students' ? 'users' : 'courses');
        break;
    }
  };

  const fixInstructorNames = async () => {
    try {
      setIsFixingInstructors(true);
      
      const response = await fetch(`${API_URL}/api/courses/fix-instructor-names`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'admin-id': ADMIN_CREDENTIALS.ADMIN_ID,
          'admin-password': ADMIN_CREDENTIALS.ADMIN_PASSWORD
        }
      });
      
      const data = await response.json();
      console.log('Fix instructor names response:', data);
      
      if (response.ok) {
        setAlert({
          visible: true,
          type: 'success',
          message: `${data.message} (${data.updatedCourses} of ${data.totalCourses} courses updated)`
        });
        
        // Refresh statistics after fixing
        fetchStatistics();
      } else {
        setAlert({
          visible: true,
          type: 'error',
          message: data.message || 'Failed to fix instructor names'
        });
      }
    } catch (error) {
      console.error('Error fixing instructor names:', error);
      setAlert({
        visible: true,
        type: 'error',
        message: 'Error fixing instructor names: ' + error.message
      });
    } finally {
      setIsFixingInstructors(false);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <ScrollView style={styles.dashboardContent}>
            <TrendChart
              data={trendData}
              title="New Accounts Created (Last 7 Days)"
            />
            <View style={styles.statsContainer}>
              <View style={styles.statsRow}>
                <TouchableOpacity 
                  style={[styles.statCard, { backgroundColor: '#165973' }]}
                  onPress={() => handleStatPress('students')}
                >
                  <Ionicons name="people-outline" size={28} color="#fff" />
                  <Text style={styles.statValue}>{statistics.students}</Text>
                  <Text style={styles.statLabel}>Students</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.statCard, { backgroundColor: '#7FB3D1' }]}
                  onPress={() => handleStatPress('students')}
                >
                  <Ionicons name="school-outline" size={28} color="#fff" />
                  <Text style={styles.statValue}>{statistics.instructors}</Text>
                  <Text style={styles.statLabel}>Instructors</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.statsRow}>
                <TouchableOpacity 
                  style={[styles.statCard, { backgroundColor: '#165973' }]}
                  onPress={() => handleStatPress('courses')}
                >
                  <Ionicons name="book-outline" size={28} color="#fff" />
                  <Text style={styles.statValue}>{statistics.courses}</Text>
                  <Text style={styles.statLabel}>Courses</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.statCard, { backgroundColor: '#7FB3D1' }]}
                  onPress={fixInstructorNames}
                  disabled={isFixingInstructors}
                >
                  <Ionicons name="build-outline" size={28} color="#fff" />
                  <Text style={styles.statValue}>
                    {isFixingInstructors ? "..." : "Fix"}
                  </Text>
                  <Text style={styles.statLabel}>Instructor Names</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        );
      case 'users':
        return <Users onUpdate={fetchStatistics} />;
      case 'courses':
        return <Courses />;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Admin Dashboard"
        showLogout
        onLogout={handleLogout}
      />
      
      <View style={styles.content}>
        {renderContent()}
      </View>

      <TabBar
        activeTab={activeTab}
        onTabPress={handleTabPress}
      />
      
      <CustomAlert
        visible={alert.visible}
        type={alert.type}
        message={alert.message}
        onClose={() => setAlert(prev => ({ ...prev, visible: false }))}
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
    padding: 16,
    paddingBottom: 0,
  },
  dashboardContent: {
    flex: 1,
  },
  statsContainer: {
    padding: 16,
    gap: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 20,
  },
  statCard: {
    flex: 1,
    padding: 15,
    borderRadius: 12,
    minHeight: 120,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 10,
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
});

export default Dashboard; 