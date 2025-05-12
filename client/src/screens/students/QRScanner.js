import React, { useState, useEffect } from 'react';
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { API_URL } from '../../config';
import { useAuth } from '../../context/AuthContext';
import { colors as projectColors, spacing, typography, shadows, borderRadius } from '../../config/theme';

const QRScanner = ({ route }) => {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation();
  const { user } = useAuth();
  const { studentData } = route.params || {};

  useEffect(() => {
    const getBarCodeScannerPermissions = async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    };

    getBarCodeScannerPermissions();
  }, []);

  const handleBarCodeScanned = async ({ type, data }) => {
    if (scanned) return;
    
    try {
      setIsLoading(true);
      setScanned(true);

      // Parse the QR code data
      const attendanceData = JSON.parse(data);
      
      // Validate the QR code data
      if (!attendanceData.courseId || !attendanceData.instructorId || !attendanceData.timestamp) {
        throw new Error('Invalid QR code format');
      }

      // Send attendance data to backend
      const response = await axios.post(`${API_URL}/api/attendance/record`, {
        studentId: studentData?.idNumber || user?.id,
        courseId: attendanceData.courseId,
        instructorId: attendanceData.instructorId,
        timestamp: attendanceData.timestamp,
        qrCodeData: data
      });

      if (response.data.success) {
        Alert.alert(
          "Success",
          "Attendance recorded successfully!",
          [
            {
              text: "OK",
              onPress: () => {
                setScanned(false);
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
        error.message || "Failed to process QR code. Please try again.",
        [
          {
            text: "OK",
            onPress: () => {
              setScanned(false);
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

  if (hasPermission === null) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={projectColors.primary} />
          <Text style={styles.loadingText}>Requesting camera permission...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-off" size={64} color={projectColors.error} />
          <Text style={styles.permissionText}>Camera access is required to scan QR codes</Text>
          <TouchableOpacity 
            style={styles.permissionButton}
            onPress={() => BarCodeScanner.requestPermissionsAsync()}
          >
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={projectColors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan QR Code</Text>
        <View style={styles.backButton} />
      </View>

      {/* Scanner View */}
      <View style={styles.scannerContainer}>
        <BarCodeScanner
          onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
          style={styles.scanner}
        />
        
        {/* Scanner Overlay */}
        <View style={styles.overlay}>
          <View style={styles.scanArea} />
        </View>

        {/* Loading Indicator */}
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={projectColors.white} />
            <Text style={styles.loadingText}>Processing...</Text>
          </View>
        )}

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsText}>
            Position the QR code within the frame to scan
          </Text>
        </View>
      </View>

      {/* Scan Again Button */}
      {scanned && !isLoading && (
        <TouchableOpacity 
          style={styles.scanAgainButton}
          onPress={() => setScanned(false)}
        >
          <Text style={styles.scanAgainText}>Tap to Scan Again</Text>
        </TouchableOpacity>
      )}
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
  scannerContainer: {
    flex: 1,
    position: 'relative',
  },
  scanner: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  scanArea: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: projectColors.white,
    backgroundColor: 'transparent',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body1,
    color: projectColors.white,
    marginTop: spacing.md,
  },
  instructionsContainer: {
    position: 'absolute',
    bottom: spacing.xl * 2,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  instructionsText: {
    ...typography.body1,
    color: projectColors.white,
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
  },
  scanAgainButton: {
    position: 'absolute',
    bottom: spacing.xl,
    left: spacing.xl,
    right: spacing.xl,
    backgroundColor: projectColors.orange,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    ...shadows.medium,
  },
  scanAgainText: {
    ...typography.body1,
    fontWeight: '600',
    color: projectColors.white,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  permissionText: {
    ...typography.body1,
    color: projectColors.navy,
    textAlign: 'center',
    marginVertical: spacing.lg,
  },
  permissionButton: {
    backgroundColor: projectColors.orange,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    ...shadows.small,
  },
  permissionButtonText: {
    ...typography.body1,
    fontWeight: '600',
    color: projectColors.white,
  },
});

export default QRScanner; 