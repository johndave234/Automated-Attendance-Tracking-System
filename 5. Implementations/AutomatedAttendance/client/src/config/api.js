import { Platform } from 'react-native';

// API Configuration
const LOCAL_IP = '192.168.254.197'; // Your computer's actual IP address
const LOCALHOST = 'localhost';

// Get the correct API URL based on platform
const getApiUrl = () => {
  if (Platform.OS === 'web') {
    return `http://${LOCALHOST}:5001`;
  }
  // For mobile devices (both iOS and Android)
  return `http://${LOCAL_IP}:5001`;
};

export const API_URL = getApiUrl();

// Log the API URL for debugging
console.log('Platform:', Platform.OS);
console.log('API URL:', API_URL);

export const endpoints = {
    studentCreate: '/api/students/create',
    instructorCreate: '/api/instructors/create',
    studentLogin: '/api/students/login',
    studentLogout: '/api/students/logout',
    instructorLogin: '/api/instructors/login',
    instructorLogout: '/api/instructors/logout',
    courses: '/api/courses',
    courseCreate: '/api/courses',
    courseUpdate: '/api/courses/update',  // Will be appended with /:id in the component
    courseDelete: '/api/courses/delete',  // Will be appended with /:id in the component
    instructorCourses: '/api/courses/instructor',
    courseStudents: '/api/courses/students',
}; 