import React, { useState } from 'react';
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  StatusBar,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { API_URL } from '../../config';
import { useAuth } from '../../context/AuthContext';
import { colors as projectColors, spacing, typography, shadows, borderRadius } from '../../config/theme';

const QRScanner = ({ route }) => {
  const [qrCodeInput, setQrCodeInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation();
  const { user } = useAuth();
  const { studentData } = route.params || {};

  const handleManualSubmit = async () => {
    if (!qrCodeInput.trim()) {
      Alert.alert("Error", "Please enter a valid code");
      return;
    }
    
    try {
      setIsLoading(true);

      // Try to parse the QR code data
      let attendanceData;
      try {
        attendanceData = JSON.parse(qrCodeInput);
      } catch (e) {
        throw new Error('Invalid code format. Please try again.');
      }
      
      // Validate the QR code data
      if (!attendanceData.courseId || !attendanceData.instructorId || !attendanceData.timestamp) {
        throw new Error('Invalid code format');
      }

      // Send attendance data to backend
      const response = await axios.post(`${API_URL}/api/attendance/record`, {
        studentId: studentData?.idNumber || user?.id,
        courseId: attendanceData.courseId,
        instructorId: attendanceData.instructorId,
        timestamp: attendanceData.timestamp,
        qrCodeData: qrCodeInput
      });

      if (response.data.success) {
        Alert.alert(
          "Success",
          "Attendance recorded successfully!",
          [
            {
              text: "OK",
              onPress: () => {
                setIsLoading(false);
                navigation.goBack();
              }
            }
          ]
        );
      } else {
        throw new Error(response.data.message || 'Failed to record attendance');
      }
    } catch (error) {
      Alert.alert(
        "Error",
        error.message || "Failed to process code. Please try again.",
        [
          {
            text: "OK",
            onPress: () => {
              setIsLoading(false);
            }
          }
        ]
      );
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={projectColors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manual Code Entry</Text>
        <View style={styles.backButton} />
      </View>

      {/* Form */}
      <View style={styles.formContainer}>
        <Text style={styles.label}>Enter Attendance Code:</Text>
        <TextInput
          style={styles.input}
          placeholder="Paste attendance code here"
          value={qrCodeInput}
          onChangeText={setQrCodeInput}
          multiline
          numberOfLines={4}
        />

        <TouchableOpacity 
          style={styles.submitButton}
          onPress={handleManualSubmit}
          disabled={isLoading}
        >
          <Text style={styles.submitButtonText}>
            {isLoading ? "Processing..." : "Submit"}
          </Text>
        </TouchableOpacity>

        <Text style={styles.instructionsText}>
          Enter the attendance code provided by your instructor
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: projectColors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: projectColors.navy,
    ...shadows.medium,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...typography.h2,
    color: projectColors.white,
  },
  formContainer: {
    padding: spacing.lg,
  },
  label: {
    ...typography.body1,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: projectColors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: spacing.lg,
  },
  submitButton: {
    backgroundColor: projectColors.primary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    ...shadows.small,
  },
  submitButtonText: {
    ...typography.button,
    color: projectColors.white,
  },
  instructionsText: {
    ...typography.caption,
    marginTop: spacing.lg,
    textAlign: 'center',
    color: projectColors.textSecondary,
  }
});

export default QRScanner; 