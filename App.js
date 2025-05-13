import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, StyleSheet, LogBox, Platform } from 'react-native';
import Welcome from './client/src/screens/students/Welcome';
import Login from './client/src/screens/Login';
import Dashboard from './client/src/screens/admin/Dashboard';
import Signup from './client/src/screens/admin/Signup';
import StudentDashboard from './client/src/screens/students/StudentDashboard';
import InstructorDashboard from './client/src/screens/instructor/InstructorDashboard';
import EnrolledStudent from './client/src/screens/instructor/EnrolledStudent';
import QRScanner from './client/src/screens/students/QRScanner';
import { AuthProvider } from './client/src/context/AuthContext';

// Ignore specific warnings
LogBox.ignoreLogs(['Warning: ...']); // Add specific warnings to ignore

const Stack = createNativeStackNavigator();

// Error boundary component
const ErrorBoundary = ({ children }) => {
  const [hasError, setHasError] = useState(false);
  
  useEffect(() => {
    console.log('App initialized on platform:', Platform.OS);
  }, []);
  
  if (hasError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Something went wrong!</Text>
        <Text>Please restart the app.</Text>
      </View>
    );
  }
  
  return (
    <React.Fragment>
      {children}
    </React.Fragment>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName="Welcome"
            screenOptions={{
              headerShown: false
            }}
          >
            <Stack.Screen name="Welcome" component={Welcome} />
            <Stack.Screen name="Login" component={Login} />
            <Stack.Screen name="Dashboard" component={Dashboard} />
            <Stack.Screen name="Signup" component={Signup} />
            <Stack.Screen name="StudentDashboard" component={StudentDashboard} />
            <Stack.Screen name="InstructorDashboard" component={InstructorDashboard} />
            <Stack.Screen name="EnrolledStudent" component={EnrolledStudent} />
            <Stack.Screen name="QRScanner" component={QRScanner} />
          </Stack.Navigator>
        </NavigationContainer>
      </AuthProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
});
