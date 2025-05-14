import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Dimensions,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import InstructorTabBar from '../../components/InstructorTabBar';
import Header from '../../components/Header';
import StatisticsChart from '../../components/StatisticsChart';
import TrendChart from '../../components/TrendChart';
import InstructorCourses from './InstructorCourses';
import QRCodeGenerator from './QRCode';
import { API_URL } from '../../config/api';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const InstructorDashboard = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const instructorData = route.params?.instructorData || {};
  const [activeTab, setActiveTab] = useState('dashboard');
  const [statistics, setStatistics] = useState({
    totalStudents: 0,
    totalCourses: 0,
    activeClasses: 0,
    attendanceRate: 0,
  });
  const [trendData, setTrendData] = useState({
    labels: [],
    datasets: [
      {
        data: [0],
      },
    ],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'error'
  });

  useEffect(() => {
    fetchStatistics();
    fetchTrendData();
  }, []);

  const fetchStatistics = async () => {
    try {
      // TODO: Replace with actual API calls for instructor statistics
      setStatistics({
        totalStudents: 150,
        totalCourses: 5,
        activeClasses: 3,
        attendanceRate: 85,
      });
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const fetchTrendData = async () => {
    try {
      // Get last 7 days
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date;
      }).reverse();

      // TODO: Replace with actual attendance data
      const mockAttendanceData = [75, 82, 88, 85, 90, 87, 85];

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
            data: mockAttendanceData,
            color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
            strokeWidth: 2,
          },
        ],
      });
    } catch (error) {
      console.error('Error fetching trend data:', error);
    }
  };

  const showAlert = (title, message, type = 'error') => {
    Alert.alert(title, message);
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
              
              const response = await axios.post(`${API_URL}/api/instructors/logout`, {
                instructorId: instructorData.idNumber
              });

              if (response.data.success) {
                // Clear AsyncStorage
                await AsyncStorage.multiRemove(['instructorId', 'instructorName', 'userType']);
                
                Alert.alert('Success', 'Logged out successfully');
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

  const handleTabPress = (tabKey) => {
    setActiveTab(tabKey);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <ScrollView style={styles.dashboardContent}>
            <View style={styles.chartSection}>
              <TrendChart
                data={trendData}
                title="Attendance Rate (Last 7 Days)"
              />
            </View>
            <StatisticsChart
              stats={[
                {
                  icon: 'people-outline',
                  value: statistics.totalStudents,
                  label: 'Total Students',
                  backgroundColor: '#165973',
                },
                {
                  icon: 'book-outline',
                  value: statistics.totalCourses,
                  label: 'Total Courses',
                  backgroundColor: '#7FB3D1',
                },
                {
                  icon: 'school-outline',
                  value: statistics.activeClasses,
                  label: 'Active Classes',
                  backgroundColor: '#165973',
                },
                {
                  icon: 'stats-chart',
                  value: `${statistics.attendanceRate}%`,
                  label: 'Attendance Rate',
                  backgroundColor: '#7FB3D1',
                }
              ]}
            />
          </ScrollView>
        );
      case 'courses':
        return <InstructorCourses />;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Instructor Dashboard"
        showLogout
        onLogout={handleLogout}
      />
      
      <View style={styles.content}>
        {renderContent()}
      </View>

      <InstructorTabBar
        activeTab={activeTab}
        onTabPress={handleTabPress}
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
  dashboardContent: {
    flex: 1,
    padding: 16,
  },
  tabContent: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartSection: {
    alignItems: 'flex-end',
    paddingRight: 0,
    marginBottom: 20,
    marginRight:-2,
  },
});

export default InstructorDashboard; 