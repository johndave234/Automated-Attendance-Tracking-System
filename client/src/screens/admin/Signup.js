import React, { useState, useEffect } from 'react';
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
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import CustomAlert from '../../components/CustomAlert';
import { ADMIN_CREDENTIALS } from '../../config/auth';
import { useAuth } from '../../context/AuthContext';
import { API_URL, endpoints } from '../../config/api';

const { width, height } = Dimensions.get('window');

const Signup = ({ route }) => {
  const navigation = useNavigation();
  const { onCreateSuccess } = route.params || {};
  const { isAdminLoggedIn } = useAuth();
  const [fullName, setFullName] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [password, setPassword] = useState('');
  const [accountType, setAccountType] = useState('student');
  const [showPassword, setShowPassword] = useState(false);
  const [alert, setAlert] = useState({ visible: false, type: '', message: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if admin is not logged in
  useEffect(() => {
    if (!isAdminLoggedIn) {
      navigation.replace('AdminLogin');
    }
  }, [isAdminLoggedIn]);

  const handleSignup = async () => {
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      setError('');
      
      const endpoint = accountType === 'student' ? endpoints.studentCreate : endpoints.instructorCreate;
      const url = `${API_URL}${endpoint}`;
      
      console.log('Starting signup process...');
      console.log('API URL:', url);
      console.log('Account type:', accountType);
      
      const requestBody = {
        idNumber,
        fullName,
        password,
        ...(accountType === 'student' && { course: 'BSIT', year: '1', section: 'A' }),
        ...(accountType === 'instructor' && { department: 'IT' })
      };

      // Test server connectivity first
      try {
        console.log('Testing server connectivity...');
        const testResponse = await fetch(`${API_URL}/test`);
        if (!testResponse.ok) {
          throw new Error('Server connectivity test failed');
        }
        console.log('Server connectivity test passed');
      } catch (testError) {
        console.error('Server connectivity test failed:', testError);
        throw new Error('Cannot connect to server. Please check your network connection.');
      }

      console.log('Sending signup request...');
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'admin-id': ADMIN_CREDENTIALS.ADMIN_ID,
          'admin-password': ADMIN_CREDENTIALS.ADMIN_PASSWORD
        },
        body: JSON.stringify(requestBody)
      });

      console.log('Response status:', response.status);
      let data;
      try {
        data = await response.json();
        console.log('Response data:', data);
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
        throw new Error('Invalid response from server');
      }

      if (response.ok) {
        setAlert({
          visible: true,
          type: 'success',
          message: 'Account created successfully'
        });
        
        // Clear form
        setFullName('');
        setIdNumber('');
        setPassword('');
        
        // Call the onCreateSuccess callback if provided
        if (onCreateSuccess) {
          onCreateSuccess();
        }
        
        // Navigate back
        setTimeout(() => {
          navigation.goBack();
        }, 1500);
      } else {
        const errorMessage = data?.message || 'Failed to create account';
        console.error('Server returned error:', errorMessage);
        setAlert({
          visible: true,
          type: 'error',
          message: errorMessage
        });
      }
    } catch (error) {
      console.error('Signup error:', {
        message: error.message,
        stack: error.stack
      });
      setAlert({
        visible: true,
        type: 'error',
        message: error.message || 'Failed to connect to server. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    if (!fullName || !idNumber || !password) {
      setAlert({
        visible: true,
        type: 'error',
        message: 'Please fill in all fields'
      });
      return false;
    }
    return true;
  };

  return (
    <TouchableWithoutFeedback onPress={Platform.OS === 'web' ? undefined : Keyboard.dismiss}>
      <SafeAreaView style={styles.container}>
        <View style={styles.background} />
        
        {alert.visible && (
          <CustomAlert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert({ ...alert, visible: false })}
          />
        )}
        
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : Platform.OS === 'android' ? 'height' : undefined}
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
              source={require('../../assets/images/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Add a new user to the system</Text>
          </View>

          {/* Signup Form */}
          <View style={styles.form}>
            {/* Account Type Selection */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Account Type</Text>
              <View style={styles.accountTypeContainer}>
                <TouchableOpacity 
                  style={[
                    styles.accountTypeButton,
                    accountType === 'student' && styles.accountTypeButtonActive
                  ]}
                  onPress={() => setAccountType('student')}
                >
                  <Text style={[
                    styles.accountTypeText,
                    accountType === 'student' && styles.accountTypeTextActive
                  ]}>Student</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[
                    styles.accountTypeButton,
                    accountType === 'instructor' && styles.accountTypeButtonActive
                  ]}
                  onPress={() => setAccountType('instructor')}
                >
                  <Text style={[
                    styles.accountTypeText,
                    accountType === 'instructor' && styles.accountTypeTextActive
                  ]}>Instructor</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>ID Number</Text>
              <TextInput
                style={[styles.input, Platform.OS === 'web' && styles.webInput]}
                placeholder="Enter ID number"
                value={idNumber}
                onChangeText={(text) => setIdNumber(text)}
                keyboardType="default"
                autoCapitalize="none"
                enterKeyHint="next"
                autoComplete="username"
                spellCheck={false}
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={[styles.input, Platform.OS === 'web' && styles.webInput]}
                placeholder="Enter full name"
                value={fullName}
                onChangeText={(text) => setFullName(text)}
                keyboardType="default"
                autoCapitalize="words"
                enterKeyHint="next"
                spellCheck={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.passwordInput, Platform.OS === 'web' && styles.webInput]}
                  placeholder="Enter password"
                  value={password}
                  onChangeText={(text) => setPassword(text)}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  enterKeyHint="done"
                  autoComplete="new-password"
                  spellCheck={false}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
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
              style={[
                styles.signupButton,
                isLoading && styles.signupButtonDisabled
              ]}
              onPress={handleSignup}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.signupButtonText}>Create Account</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '35%',
    backgroundColor: '#165973',
    borderBottomLeftRadius: width * 0.3,
    borderBottomRightRadius: width * 0.3,
  },
  content: {
    flex: 1,
    padding: 20,
    ...(Platform.OS === 'web' && {
      maxWidth: 480,
      alignSelf: 'center',
      width: '100%',
    }),
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 1,
    padding: 8,
  },
  header: {
    alignItems: 'center',
    marginTop: height * 0.05,
    marginBottom: 30,
  },
  logo: {
    width: width * 0.3,
    height: width * 0.3,
    marginBottom: 20,
    ...(Platform.OS === 'web' && {
      width: 120,
      height: 120,
    }),
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    ...(Platform.OS === 'web' && {
      boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    }),
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    width: '100%',
    height: 45,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
    color: '#000000',
  },
  passwordContainer: {
    width: '100%',
    height: 45,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#ffffff',
  },
  passwordInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#000000',
  },
  eyeIcon: {
    padding: 10,
  },
  signupButton: {
    backgroundColor: '#165973',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  signupButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  signupButtonDisabled: {
    backgroundColor: '#ddd',
  },
  accountTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  accountTypeButton: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  accountTypeButtonActive: {
    backgroundColor: '#165973',
    borderColor: '#165973',
  },
  accountTypeText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  accountTypeTextActive: {
    color: '#fff',
  },
  webInput: {
    outlineStyle: 'none',
    outline: 'none',
    WebkitAppearance: 'none',
    MozAppearance: 'none',
    appearance: 'none',
  },
});

export default Signup; 