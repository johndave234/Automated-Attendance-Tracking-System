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
import { colors, typography, shadows, spacing, borderRadius } from '../config/theme';

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
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    width: '95%',
    maxHeight: '90%',
    ...shadows.medium,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.primary,
  },
  closeButton: {
    padding: spacing.xs,
  },
  modalBody: {
    padding: spacing.lg,
    maxHeight: '70vh',
  },
  fieldContainer: {
    marginBottom: spacing.lg,
  },
  fieldLabel: {
    ...typography.body1,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  required: {
    color: colors.error,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...typography.body1,
    color: colors.text.primary,
    backgroundColor: colors.surface,
  },
  inputError: {
    borderColor: colors.error,
  },
  errorText: {
    color: colors.error,
    ...typography.caption,
    marginTop: spacing.xs,
  },
  selectContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  selectOption: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    minWidth: 100,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  selectOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '15',
  },
  selectOptionText: {
    ...typography.body2,
    color: colors.text.secondary,
  },
  selectOptionTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  button: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  saveButton: {
    backgroundColor: colors.primary,
  },
  buttonText: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.text.inverse,
  },
});

export default CustomModal; 