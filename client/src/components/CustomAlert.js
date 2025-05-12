import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const CustomAlert = ({ 
  visible, 
  type = 'success', 
  message, 
  onClose,
  showConfirmButton = false,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm
}) => {
  const getTypeStyles = () => {
    switch(type) {
      case 'success':
        return {
          backgroundColor: '#4CAF50',
          icon: 'checkmark-circle',
          title: 'Success!'
        };
      case 'error':
        return {
          backgroundColor: '#f44336',
          icon: 'alert-circle',
          title: 'Error!'
        };
      case 'warning':
        return {
          backgroundColor: '#ff9800',
          icon: 'warning',
          title: 'Warning!'
        };
      default:
        return {
          backgroundColor: '#4CAF50',
          icon: 'checkmark-circle',
          title: 'Success!'
        };
    }
  };

  const typeStyles = getTypeStyles();
  
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.alertContainer}>
          <View style={[styles.iconContainer, { backgroundColor: typeStyles.backgroundColor }]}>
            <Ionicons 
              name={typeStyles.icon}
              size={50} 
              color="white" 
            />
          </View>
          
          <Text style={styles.title}>
            {typeStyles.title}
          </Text>
          
          <Text style={styles.message}>
            {message}
          </Text>
          
          <View style={styles.buttonContainer}>
            {showConfirmButton ? (
              <>
                <TouchableOpacity 
                  style={[styles.button, { backgroundColor: '#f44336' }]} 
                  onPress={onConfirm}
                >
                  <Text style={styles.buttonText}>{confirmText}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.button, { backgroundColor: '#9e9e9e', marginLeft: 10 }]} 
                  onPress={onClose}
                >
                  <Text style={styles.buttonText}>{cancelText}</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity 
                style={[styles.button, { backgroundColor: typeStyles.backgroundColor }]} 
                onPress={onClose}
              >
                <Text style={styles.buttonText}>OK</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertContainer: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    width: '80%',
    maxWidth: 300,
  },
  iconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    minWidth: 100,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default CustomAlert; 