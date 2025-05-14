import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions 
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL, endpoints } from '../../config/api';

const { width } = Dimensions.get('window');

export default function QRScanner() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const navigation = useNavigation();
  const route = useRoute();
  const { courseCode, courseId } = route.params || {};

  // Function to record attendance in the backend
  const recordAttendance = async (studentId, courseCode, sessionId = null, expiresAt = null, isManualCode = false) => {
    try {
      setLoading(true);
      
      const requestBody = {
        studentId,
        courseCode,
        status: 'Present',
        isManualCode
      };
      
      // Add sessionId to request if available
      if (sessionId) {
        requestBody.sessionId = sessionId;
      }
      
      // Add uniqueCode if available in the scanned data
      if (sessionId?.uniqueCode) {
        requestBody.uniqueCode = sessionId.uniqueCode;
      }
      
      // Add expiration time if available
      if (expiresAt) {
        requestBody.expiresAt = expiresAt;
      }
      
      console.log("Sending attendance data:", requestBody);
      
      // Always use the new session-based endpoint
      const response = await fetch(`${API_URL}${endpoints.sessionRecord}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      let data = await response.json();
      console.log("Session attendance response:", data);
      
      if (response.ok && (data.success || !data.hasOwnProperty('success'))) {
        return {
          success: true,
          message: data.message || 'Attendance recorded successfully!',
          timeRecorded: data.student?.timeRecorded || null
        };
      } else {
        // Only if the session endpoint completely fails, try the legacy endpoint as fallback
        console.log("Falling back to legacy attendance system");
        
        const legacyResponse = await fetch(`${API_URL}${endpoints.attendanceRecord}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            studentId,
            courseCode,
            status: 'Present'
          })
        });
        
        const legacyData = await legacyResponse.json();
        console.log("Legacy attendance response:", legacyData);
        
        if (legacyResponse.ok) {
          return {
            success: true,
            message: legacyData.message || 'Attendance recorded successfully (legacy)!'
          };
        }
        
        return {
          success: false,
          message: data.message || 'Failed to record attendance'
        };
      }
    } catch (error) {
      console.error('Error recording attendance:', error);
      return {
        success: false,
        message: 'Network error. Please try again.'
      };
    } finally {
      setLoading(false);
    }
  };

  const handleBarCodeScanned = async (scanningResult) => {
    if (scanned || loading) return;
    
    try {
      const { data } = scanningResult;
      setScanned(true);
      
      // Get student ID from storage
      const studentId = await AsyncStorage.getItem('studentId');
      
      if (!studentId) {
        Alert.alert(
          'Error',
          'You need to be logged in to record attendance.',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
              style: 'default',
            }
          ]
        );
        return;
      }
      
      // Attempt to parse QR data
      try {
        const parsedData = JSON.parse(data);
        
        // Check for QR code expiration
        if (parsedData.expiresAt) {
          const expirationTime = new Date(parsedData.expiresAt);
          const now = new Date();
          
          if (now > expirationTime) {
            Alert.alert(
              'Expired QR Code',
              'This QR code has expired. You can use a manual attendance code instead.',
              [
                {
                  text: 'Use Manual Code',
                  onPress: () => {
                    // Ask for manual attendance code
                    Alert.prompt(
                      'Enter Attendance Code',
                      'Please enter the manual attendance code provided by your instructor.',
                      [
                        {
                          text: 'Cancel',
                          onPress: () => setScanned(false),
                          style: 'cancel',
                        },
                        {
                          text: 'Submit',
                          onPress: async (code) => {
                            if (!code || code.trim().length === 0) {
                              Alert.alert('Error', 'Please enter a valid code');
                              setScanned(false);
                              return;
                            }
                            
                            // Record attendance with manual code
                            const attendanceResult = await recordAttendance(
                              studentId,
                              parsedData.courseCode || courseCode,
                              parsedData.sessionId,
                              parsedData.expiresAt,
                              true // Flag as manual code
                            );
                            
                            if (attendanceResult.success) {
                              Alert.alert(
                                'Success',
                                `Attendance recorded manually. You are marked as Late.\n\nTime: ${attendanceResult.timeRecorded || new Date().toLocaleTimeString('en-PH')}`,
                                [{ text: 'OK', onPress: () => navigation.goBack() }]
                              );
                            } else {
                              Alert.alert(
                                'Error',
                                attendanceResult.message,
                                [{ text: 'Try Again', onPress: () => setScanned(false) }]
                              );
                            }
                          }
                        }
                      ],
                      'plain-text'
                    );
                  }
                },
                {
                  text: 'Scan Again',
                  onPress: () => setScanned(false),
                  style: 'default',
                },
                {
                  text: 'Go Back',
                  onPress: () => navigation.goBack(),
                  style: 'cancel',
                }
              ]
            );
            return;
          }
        }
        
        // Check if the scanned QR code matches the expected course
        if (parsedData.courseId === courseId || parsedData.courseCode === courseCode) {
          // QR code matches the course - record attendance
          
          // Support both old and new QR format
          let attendanceResult;
          
          if (parsedData.sessionId) {
            // New session-based format
            attendanceResult = await recordAttendance(
              studentId, 
              parsedData.courseCode || courseCode,
              parsedData.sessionId,
              parsedData.expiresAt
            );
          } else {
            // Legacy format or format without sessionId
            attendanceResult = await recordAttendance(
              studentId, 
              parsedData.courseCode || courseCode,
              null,
              parsedData.expiresAt
            );
          }
          
          if (attendanceResult.success) {
            // Format the success message to include Philippine time if available
            let successMessage = attendanceResult.message;
            
            if (attendanceResult.timeRecorded) {
              successMessage = `${successMessage}\n\nTime recorded: ${attendanceResult.timeRecorded}`;
            } else {
              // Get current Philippine time
              const options = { 
                timeZone: 'Asia/Manila',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true
              };
              
              const phTime = new Date().toLocaleTimeString('en-PH', options);
              successMessage = `${successMessage}\n\nTime recorded: ${phTime}`;
            }
            
            Alert.alert(
              'Success',
              successMessage,
              [
                {
                  text: 'Go Back',
                  onPress: () => navigation.goBack(),
                  style: 'default',
                }
              ]
            );
          } else {
            Alert.alert(
              'Error',
              attendanceResult.message,
              [
                {
                  text: 'Try Again',
                  onPress: () => setScanned(false),
                  style: 'default',
                },
                {
                  text: 'Go Back',
                  onPress: () => navigation.goBack(),
                  style: 'cancel',
                }
              ]
            );
          }
        } else {
          // QR code is valid but doesn't match the expected course
          Alert.alert(
            'Error',
            'Wrong QR code. This code is for a different course.',
            [
              {
                text: 'Scan Again',
                onPress: () => setScanned(false),
                style: 'default',
              },
              {
                text: 'Go Back',
                onPress: () => navigation.goBack(),
                style: 'cancel',
              }
            ]
          );
        }
      } catch (e) {
        // QR code is not in valid JSON format
        Alert.alert(
          'Error',
          'Invalid QR code. The code has not been generated correctly.',
          [
            {
              text: 'Scan Again',
              onPress: () => setScanned(false),
              style: 'default',
            },
            {
              text: 'Go Back',
              onPress: () => navigation.goBack(),
              style: 'cancel',
            }
          ]
        );
      }
    } catch (error) {
      console.log('Error processing scan:', error);
      setScanned(false);
      Alert.alert('Error', 'Could not process QR code. Please try again.');
    }
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  // Show loading indicator while checking permissions
  if (!permission) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerText}>QR Scanner</Text>
        </View>
        <View style={styles.contentContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.messageText}>Loading camera...</Text>
        </View>
      </View>
    );
  }

  // If permission is not granted, show permission request
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerText}>Camera Permission Required</Text>
        </View>
        <View style={styles.contentContainer}>
          <Ionicons name="camera-off" size={80} color="#FF6B6B" />
          <Text style={styles.messageText}>
            Camera permission is required to scan QR codes
          </Text>
          <TouchableOpacity 
            style={styles.permissionButton} 
            onPress={requestPermission}
          >
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Camera view for scanning QR codes
  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      >
        <View style={styles.overlay}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerText}>
              Scan QR Code for {courseCode || 'Course'}
            </Text>
          </View>
          
          <View style={styles.scanFrameContainer}>
            <View style={styles.scanFrame}>
              <View style={styles.cornerTL} />
              <View style={styles.cornerTR} />
              <View style={styles.cornerBL} />
              <View style={styles.cornerBR} />
            </View>
            
            {scanned && (
              <TouchableOpacity
                style={styles.scanAgainButton}
                onPress={() => setScanned(false)}
              >
                <Text style={styles.scanAgainButtonText}>Tap to Scan Again</Text>
              </TouchableOpacity>
            )}
          </View>
          
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Position QR code within the frame
            </Text>
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
    flexDirection: 'column',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  headerText: {
    color: 'white',
    fontSize: 18,
    marginLeft: 10,
    fontWeight: 'bold',
  },
  backButton: {
    padding: 5,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
  },
  messageText: {
    color: 'white',
    fontSize: 18,
    marginTop: 20,
    textAlign: 'center',
    paddingHorizontal: 30,
  },
  permissionButton: {
    backgroundColor: '#165973',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 20,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  scanFrameContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: width * 0.7,
    height: width * 0.7,
    position: 'relative',
    borderRadius: 10,
  },
  cornerTL: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 30,
    height: 30,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: 'white',
    borderTopLeftRadius: 10,
  },
  cornerTR: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 30,
    height: 30,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: 'white',
    borderTopRightRadius: 10,
  },
  cornerBL: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 30,
    height: 30,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: 'white',
    borderBottomLeftRadius: 10,
  },
  cornerBR: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: 'white',
    borderBottomRightRadius: 10,
  },
  scanAgainButton: {
    backgroundColor: '#165973',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 30,
  },
  scanAgainButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  footer: {
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
  },
  footerText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
}); 