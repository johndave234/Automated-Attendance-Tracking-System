import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const CustomModal = ({ visible, onClose, title, fields, onSave, renderField }) => {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});

  useEffect(() => {
    // Initialize form data from fields
    const initialData = {};
    fields?.forEach(field => {
      initialData[field.key] = field.value || '';
    });
    setFormData(initialData);
    setErrors({});
  }, [fields]);

  const handleSave = () => {
    // Validate required fields
    const newErrors = {};
    const missingFields = fields
      ?.filter(field => field.required && !formData[field.key])
      .map(field => {
        newErrors[field.key] = 'This field is required';
        return field.label;
      });

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      alert(`Please fill in all required fields`);
      return;
    }

    onSave(formData);
  };

  const renderFieldInput = (field) => {
    if (field.type === 'select') {
      return (
        <View style={styles.selectContainer}>
          {field.options?.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.selectOption,
                formData[field.key] === option.value && styles.selectOptionSelected
              ]}
              onPress={() => setFormData(prev => ({ ...prev, [field.key]: option.value }))}
            >
              <Text style={[
                styles.selectOptionText,
                formData[field.key] === option.value && styles.selectOptionTextSelected
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      );
    }

    if (renderField) {
      return renderField(
        field,
        formData[field.key],
        (value) => setFormData(prev => ({ ...prev, [field.key]: value })),
        errors[field.key]
      );
    }

    return (
      <TextInput
        style={[styles.input, errors[field.key] && styles.inputError]}
        value={formData[field.key]}
        onChangeText={(text) => setFormData(prev => ({ ...prev, [field.key]: text }))}
        placeholder={`Enter ${field.label.toLowerCase()}`}
      />
    );
  };

  if (!visible) return null;

  // Reorder fields to put search fields first
  const orderedFields = fields?.sort((a, b) => {
    if (a.type === 'instructor-search') return -1;
    if (b.type === 'instructor-search') return 1;
    return 0;
  });

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            {orderedFields?.map((field) => (
              <View key={field.key} style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>
                  {field.label}
                  {field.required && <Text style={styles.required}> *</Text>}
                </Text>
                {renderFieldInput(field)}
                {errors[field.key] && (
                  <Text style={styles.errorText}>{errors[field.key]}</Text>
                )}
              </View>
            ))}
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={[styles.button, styles.cancelBtn]} 
              onPress={onClose}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.button, styles.saveButton]} 
              onPress={handleSave}
            >
              <Text style={styles.buttonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    width: '95%',
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#f8f9fa',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#165973',
  },
  closeButton: {
    padding: 5,
  },
  modalBody: {
    padding: 20,
    maxHeight: '70vh',
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  required: {
    color: '#dc3545',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#dc3545',
  },
  errorText: {
    color: '#dc3545',
    fontSize: 14,
    marginTop: 6,
  },
  selectContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 5,
  },
  selectOption: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    minWidth: 100,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  selectOptionSelected: {
    borderColor: '#165973',
    backgroundColor: '#e8f4f8',
  },
  selectOptionText: {
    fontSize: 16,
    color: '#666',
  },
  selectOptionTextSelected: {
    color: '#165973',
    fontWeight: '500',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#f8f9fa',
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginLeft: 12,
    minWidth: 100,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  cancelBtn: {
    backgroundColor: '#6c757d',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  }
});

export default CustomModal; 