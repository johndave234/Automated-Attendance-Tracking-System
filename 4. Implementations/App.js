import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Welcome from './client/src/screens/students/Welcome';
import StudentLogin from './client/src/screens/students/StudentLogin';
import AdminLogin from './client/src/screens/admin/AdminLogin';
import Dashboard from './client/src/screens/admin/Dashboard';
import Signup from './client/src/screens/admin/Signup';
import RoleSelection from './client/src/screens/students/RoleSelection';
import StudentDashboard from './client/src/screens/students/StudentDashboard';
import InstructorDashboard from './client/src/screens/instructor/InstructorDashboard';
import InstructorLogin from './client/src/screens/instructor/InstructorLogin';
import EnrolledStudent from './client/src/screens/instructor/EnrolledStudent';
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
          <Stack.Screen name="StudentLogin" component={StudentLogin} />
          <Stack.Screen name="AdminLogin" component={AdminLogin} />
          <Stack.Screen name="InstructorLogin" component={InstructorLogin} />
          <Stack.Screen name="Dashboard" component={Dashboard} />
          <Stack.Screen name="Signup" component={Signup} />
          <Stack.Screen name="RoleSelection" component={RoleSelection} />
          <Stack.Screen name="StudentDashboard" component={StudentDashboard} />
          <Stack.Screen name="InstructorDashboard" component={InstructorDashboard} />
          <Stack.Screen name="EnrolledStudent" component={EnrolledStudent} />
        </Stack.Navigator>
      </NavigationContainer>
    </AuthProvider>
  );
}
