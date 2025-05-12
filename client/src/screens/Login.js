import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config';
import { ADMIN_CREDENTIALS } from '../config/auth';
import { useAuth } from '../context/AuthContext';
import CustomAlert from '../components/CustomAlert';
import { colors, typography, shadows, spacing, borderRadius } from '../config/theme';

const { width, height } = Dimensions.get('window');

const Login = () => {
  const navigation = useNavigation();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'error'
  });

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

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password');
      return;
    }

    try {
      setIsLoading(true);
      
      // Check if credentials match admin
      if (username === ADMIN_CREDENTIALS.ADMIN_ID && password === ADMIN_CREDENTIALS.ADMIN_PASSWORD) {
        // Set admin as logged in
        login('admin', { id: username });
        
        showAlert('Success', 'Admin login successful!', 'success');
        
        // Navigate to Dashboard after showing success message
        setTimeout(() => {
          navigation.replace('Dashboard');
        }, 1500);
        return;
      }
      
      // Try student login
      try {
        const studentResponse = await axios.post(`${API_URL}/api/students/login`, {
          studentId: username.trim(),
          password: password.trim()
        });
        
        if (studentResponse.data.success) {
          const studentData = {
            idNumber: studentResponse.data.student.idNumber,
            fullName: studentResponse.data.student.fullName
          };
          
          // Store student data in AsyncStorage
          await AsyncStorage.multiSet([
            ['studentId', studentData.idNumber],
            ['studentName', studentData.fullName],
            ['userType', 'student']
          ]);
          
          // Update auth context
          login('student', studentData);
          
          showAlert('Success', 'Student login successful!', 'success');
          
          setTimeout(() => {
            navigation.replace('StudentDashboard', { studentData });
          }, 1500);
          return;
        }
      } catch (studentError) {
        // Failed student login, try instructor login
      }
      
      // Try instructor login
      try {
        const instructorResponse = await axios.post(`${API_URL}/api/instructors/login`, {
          instructorId: username.trim(),
          password: password.trim()
        });
        
        if (instructorResponse.data.success) {
          const instructorData = {
            idNumber: instructorResponse.data.instructor.idNumber,
            fullName: instructorResponse.data.instructor.fullName
          };
          
          // Store instructor data
          await AsyncStorage.multiSet([
            ['instructorId', instructorData.idNumber],
            ['instructorName', instructorData.fullName],
            ['userType', 'instructor']
          ]);
          
          // Update auth context
          login('instructor', instructorData);
          
          showAlert('Success', 'Instructor login successful!', 'success');
          
          setTimeout(() => {
            navigation.replace('InstructorDashboard', { instructorData });
          }, 1500);
          return;
        }
      } catch (instructorError) {
        // Login failed for all roles
        setError('Invalid username or password');
      }
      
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Platform.OS === 'web' ? undefined : Keyboard.dismiss}>
      <SafeAreaView style={styles.container}>
        <View style={styles.background} />
        
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.content}
        >
          {/* Back Button */}
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={28} color="#ffffff" />
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <Image
              source={require('../assets/images/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>Login</Text>
            <Text style={styles.subtitle}>Please login with your credentials</Text>
          </View>

          {/* Login Form */}
          <View style={styles.form}>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Username / ID</Text>
              <TextInput
                style={[styles.input, Platform.OS === 'web' && styles.webInput]}
                placeholder="Enter your username or ID"
                value={username}
                onChangeText={(text) => {
                  setError('');
                  setUsername(text);
                }}
                keyboardType="default"
                autoCapitalize="none"
                editable={!isLoading}
                enterKeyHint="next"
                autoComplete="username"
                spellCheck={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <View style={[styles.passwordContainer, Platform.OS === 'web' && styles.webPasswordContainer]}>
                <TextInput
                  style={[styles.passwordInput, Platform.OS === 'web' && styles.webInput]}
                  placeholder="Enter your password"
                  value={password}
                  onChangeText={(text) => {
                    setError('');
                    setPassword(text);
                  }}
                  secureTextEntry={!showPassword}
                  editable={!isLoading}
                  enterKeyHint="done"
                  autoComplete="current-password"
                  spellCheck={false}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={24}
                    color="#999999"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.forgotPassword}
              disabled={isLoading}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.loginButtonText}>Login</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>

        <CustomAlert
          visible={alertConfig.visible}
          title={alertConfig.title}
          message={alertConfig.message}
          type={alertConfig.type}
          onClose={hideAlert}
        />
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '35%',
    backgroundColor: colors.primary,
    borderBottomLeftRadius: width * 0.3,
    borderBottomRightRadius: width * 0.3,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  backButton: {
    position: 'absolute',
    top: spacing.lg,
    left: spacing.lg,
    zIndex: 1,
    padding: spacing.sm,
  },
  header: {
    alignItems: 'center',
    marginTop: height * 0.05,
    marginBottom: spacing.xl,
  },
  logo: {
    width: width * 0.4,
    height: width * 0.4,
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h1,
    color: colors.text.inverse,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body2,
    color: colors.text.inverse,
    opacity: 0.8,
  },
  form: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.medium,
  },
  errorText: {
    color: colors.error,
    ...typography.body2,
    marginBottom: spacing.md,
  },
  inputContainer: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.body2,
    color: colors.text.primary,
    marginBottom: spacing.xs,
    fontWeight: '500',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    fontSize: 16,
    color: colors.text.primary,
    backgroundColor: colors.surface,
  },
  webInput: {
    outlineStyle: 'none',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
  },
  webPasswordContainer: {
    outlineStyle: 'none',
  },
  passwordInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: spacing.md,
    fontSize: 16,
    color: colors.text.primary,
  },
  eyeIcon: {
    padding: spacing.sm,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: spacing.lg,
  },
  forgotPasswordText: {
    ...typography.body2,
    color: colors.secondary,
  },
  loginButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    ...shadows.small,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: colors.text.inverse,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default Login; 