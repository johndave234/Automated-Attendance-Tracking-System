import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import TabBar from '../../components/TabBar';
import Header from '../../components/Header';
import StatisticsChart from '../../components/StatisticsChart';
import TrendChart from '../../components/TrendChart';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../config/api';
import { ADMIN_CREDENTIALS } from '../../config/auth';
import { colors, spacing, shadows } from '../../config/theme';
import Courses from './Courses';
import Users from './Users';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const Dashboard = () => {
  const navigation = useNavigation();
  const route = useRoute();
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
  const [isLoading, setIsLoading] = useState(false);

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
              
              // Use the admin logout function from context
              logoutAdmin();
              
              // Clear AsyncStorage
              await AsyncStorage.multiRemove(['adminId', 'adminName', 'userType']);
              
              Alert.alert('Success', 'Logged out successfully');
              setTimeout(() => {
                navigation.replace('Login');
              }, 1500);
            } catch (error) {
              Alert.alert('Error', 'Failed to logout');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ],
      { cancelable: true }
    );
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

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <ScrollView style={styles.dashboardContent}>
            <TrendChart
              data={trendData}
              title="New Accounts Created (Last 7 Days)"
            />
            <StatisticsChart
              stats={[
                {
                  icon: 'people-outline',
                  value: statistics.students,
                  label: 'Students',
                  backgroundColor: colors.primary,
                  onPress: () => handleStatPress('students')
                },
                {
                  icon: 'school-outline',
                  value: statistics.instructors,
                  label: 'Instructors',
                  backgroundColor: colors.secondary,
                  onPress: () => handleStatPress('students')
                },
                {
                  icon: 'book-outline',
                  value: statistics.courses,
                  label: 'Courses',
                  backgroundColor: colors.primary,
                  onPress: () => handleStatPress('courses')
                },
                {
                  icon: 'stats-chart',
                  value: `${((statistics.students / (statistics.courses || 1)) || 0).toFixed(1)}`,
                  label: 'Students per Course',
                  backgroundColor: colors.secondary,
                }
              ]}
            />
          </ScrollView>
        );
      case 'users':
        return <Users onUpdate={() => {
          fetchStatistics();
          fetchTrendData();
        }} />;
      case 'courses':
        return <Courses onUpdate={fetchStatistics} />;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="Admin Dashboard" 
        showLogout={true}
        onLogout={handleLogout}
      />
      <View style={styles.content}>
        {renderContent()}
      </View>
      <TabBar
        tabs={[
          { key: 'dashboard', label: 'Dashboard', icon: 'home-outline', activeIcon: 'home' },
          { key: 'users', label: 'Users', icon: 'people-outline', activeIcon: 'people' },
          { key: 'courses', label: 'Courses', icon: 'book-outline', activeIcon: 'book' }
        ]}
        activeTab={activeTab}
        onTabPress={handleTabPress}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
    paddingBottom: 0,
  },
  dashboardContent: {
    flex: 1,
  },
});

export default Dashboard; 