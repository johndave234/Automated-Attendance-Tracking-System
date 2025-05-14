import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { API_URL, endpoints } from '../../config/api';
import { useNavigation, useRoute } from '@react-navigation/native';
import Header from '../../components/Header';

const ManualAttendance = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { courseId, courseCode, studentId, studentName } = route.params;
  
  const [attendanceCode, setAttendanceCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  const handleSubmit = async () => {
    if (!attendanceCode.trim()) {
      setError('Please enter an attendance code');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      console.log('Submitting manual attendance with code:', attendanceCode);
      console.log('Student ID:', studentId);
      console.log('Course Code:', courseCode);
      
      // Send request to record attendance using manual code
      const response = await axios.post(`${API_URL}${endpoints.sessions}/record`, {
        courseCode: courseCode,
        studentId: studentId,
        uniqueCode: attendanceCode,
        isManualCode: true
      });
      
      console.log('Attendance response:', response.data);
      
      if (response.data.success) {
        setSuccess(true);
        setSuccessMessage(
          response.data.student && response.data.student.timeRecorded 
            ? `Attendance recorded at ${response.data.student.timeRecorded}`
            : 'Attendance recorded successfully'
        );
        
        // Clear the input
        setAttendanceCode('');
      } else {
        setError(response.data.message || 'Failed to record attendance');
      }
    } catch (error) {
      console.error('Error recording attendance:', error.response?.data || error.message);
      const errorMessage = error.response?.data?.message || 'Failed to record attendance';
      setError(errorMessage);
      
      // Show specific error for expired codes
      if (errorMessage.includes('expired')) {
        Alert.alert(
          'QR Code Expired',
          'This attendance code has expired. Please ask your instructor for a new code.',
          [{ text: 'OK' }]
        );
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleBackPress = () => {
    navigation.goBack();
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Manual Attendance"
        subtitle={`Course: ${courseCode}`}
        showBackButton={true}
        onBackPress={handleBackPress}
      />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <View style={styles.card}>
          <Text style={styles.title}>Enter Attendance Code</Text>
          <Text style={styles.subtitle}>
            Enter the attendance code provided by your instructor to mark your attendance for this class.
          </Text>
          
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Enter attendance code"
              value={attendanceCode}
              onChangeText={setAttendanceCode}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={8}
              editable={!loading && !success}
            />
            
            {error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : null}
            
            {success ? (
              <View style={styles.successContainer}>
                <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                <Text style={styles.successText}>{successMessage}</Text>
              </View>
            ) : null}
          </View>
          
          <TouchableOpacity
            style={[
              styles.submitButton,
              (loading || success || !attendanceCode.trim()) ? styles.disabledButton : null
            ]}
            onPress={handleSubmit}
            disabled={loading || success || !attendanceCode.trim()}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>Submit</Text>
            )}
          </TouchableOpacity>
          
          {success ? (
            <TouchableOpacity
              style={styles.newCodeButton}
              onPress={() => {
                setSuccess(false);
                setSuccessMessage('');
                setAttendanceCode('');
              }}
            >
              <Text style={styles.newCodeButtonText}>Enter Another Code</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </KeyboardAvoidingView>
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
    padding: 20,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#165973',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 8,
    padding: 16,
    fontSize: 18,
    textAlign: 'center',
    letterSpacing: 2,
  },
  errorText: {
    color: '#DC3545',
    marginTop: 8,
    fontSize: 14,
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 8,
  },
  successText: {
    color: '#4CAF50',
    marginLeft: 8,
    fontSize: 14,
    flex: 1,
  },
  submitButton: {
    backgroundColor: '#165973',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
  newCodeButton: {
    padding: 12,
    alignItems: 'center',
  },
  newCodeButtonText: {
    color: '#165973',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default ManualAttendance; 