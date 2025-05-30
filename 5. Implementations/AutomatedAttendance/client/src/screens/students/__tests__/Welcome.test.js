import React from 'react';
import { render } from '@testing-library/react-native';
import Welcome from '../Welcome';
import StudentLogin from '../StudentLogin';
import StudentDashboard from '../StudentDashboard';
import RoleSelection from '../RoleSelection';
import StudentCourses from '../StudentCourses';
import ManualAttendance from '../ManualAttendance';
import QRScanner from '../QRScanner';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve('token')),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
}));

// Mock axios
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(() => Promise.resolve({ data: {} })),
    post: jest.fn(() => Promise.resolve({ data: {} })),
  })),
}));

// Mock expo-icons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

// Mock navigation and route
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
  }),
  useRoute: () => ({
    params: {
      studentData: {},
      courseId: '123',
      courseCode: 'TEST101',
      studentId: '456',
      studentName: 'Test Student'
    }
  }),
}));

// Mock expo-camera
jest.mock('expo-camera', () => ({
  Camera: 'Camera',
  requestCameraPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  useCameraPermissions: () => [{ granted: true }, jest.fn()],
}));

describe('Welcome Screen Tests', () => {
  test('should display the welcome message', () => {
    const { getByText } = render(<Welcome />);
    const welcomeText = getByText(/Your Ultimate Automated Attendance System/);
    expect(welcomeText).toBeTruthy();
  });

  test('should have a login button', () => {
    const { getByText } = render(<Welcome />);
    const loginButton = getByText('Login');
    expect(loginButton).toBeTruthy();
  });
});

describe('Student Login Tests', () => {
  test('should render login form', () => {
    const { getByText } = render(<StudentLogin />);
    expect(getByText(/Login/)).toBeTruthy();
  });
});

describe('Role Selection Tests', () => {
  test('should render role options', () => {
    const { getByText } = render(<RoleSelection />);
    expect(getByText(/Role Selection/)).toBeTruthy();
  });
});

describe('Student Dashboard Tests', () => {
  test('should render dashboard', () => {
    const { getByText } = render(<StudentDashboard />);
    expect(getByText(/Dashboard/)).toBeTruthy();
  });
});

describe('Student Courses Tests', () => {
  test('should render courses list', () => {
    const { getByText } = render(<StudentCourses />);
    expect(getByText(/Courses/)).toBeTruthy();
  });
});

describe('Manual Attendance Tests', () => {
  test('should render attendance form', () => {
    const { getByText } = render(<ManualAttendance />);
    expect(getByText(/Attendance/)).toBeTruthy();
  });
});

describe('QR Scanner Tests', () => {
  test('should render scanner', () => {
    const { getByText } = render(<QRScanner />);
    expect(getByText(/QR/)).toBeTruthy();
  });
}); 