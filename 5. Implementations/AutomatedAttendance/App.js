import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Welcome from './client/src/screens/students/Welcome';
import Login from './client/src/screens/Login';
import Dashboard from './client/src/screens/admin/Dashboard';
import Signup from './client/src/screens/admin/Signup';
import StudentDashboard from './client/src/screens/students/StudentDashboard';
import InstructorDashboard from './client/src/screens/instructor/InstructorDashboard';
import EnrolledStudent from './client/src/screens/instructor/EnrolledStudent';
import QRScanner from './client/src/screens/students/QRScanner';
import { AuthProvider } from './client/src/context/AuthContext';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
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
  );
}
