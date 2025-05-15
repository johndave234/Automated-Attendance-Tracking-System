import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import InstructorTabBar from '../../components/InstructorTabBar';
import Header from '../../components/Header';
import TrendChart from '../../components/TrendChart';
import InstructorCourses from './InstructorCourses';
import QRCodeGenerator from './QRCode';
import { API_URL } from '../../config/api';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const InstructorDashboard = () => {
  const navigation = useNavigation();
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

  const handleLogout = () => {
    navigation.replace('RoleSelection');
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
            <View style={styles.statsContainer}>
              <View style={styles.statsRow}>
                <View style={[styles.statCard, { backgroundColor: '#165973' }]}>
                  <Ionicons name="people-outline" size={28} color="#fff" />
                  <Text style={styles.statValue}>{statistics.totalStudents}</Text>
                  <Text style={styles.statLabel}>Total Students</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: '#7FB3D1' }]}>
                  <Ionicons name="book-outline" size={28} color="#fff" />
                  <Text style={styles.statValue}>{statistics.totalCourses}</Text>
                  <Text style={styles.statLabel}>Total Courses</Text>
                </View>
              </View>
              <View style={styles.statsRow}>
                <View style={[styles.statCard, { backgroundColor: '#165973' }]}>
                  <Ionicons name="school-outline" size={28} color="#fff" />
                  <Text style={styles.statValue}>{statistics.activeClasses}</Text>
                  <Text style={styles.statLabel}>Active Classes</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: '#7FB3D1' }]}>
                  <Ionicons name="stats-chart" size={28} color="#fff" />
                  <Text style={styles.statValue}>{statistics.attendanceRate}%</Text>
                  <Text style={styles.statLabel}>Attendance Rate</Text>
                </View>
              </View>
            </View>
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
    marginRight: -2,
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

export default InstructorDashboard; 