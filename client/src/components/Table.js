import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, shadows, spacing, borderRadius } from '../config/theme';

const Table = ({ 
  headers, 
  data, 
  onRowPress,
  actionButtons,
  emptyMessage = 'No data available',
  searchValue = '',
  searchFields = []
}) => {
  const filteredData = searchValue && searchFields.length > 0
    ? data.filter(item => 
        searchFields.some(field => 
          item[field] && 
          item[field].toString().toLowerCase().includes(searchValue.toLowerCase())
        )
      )
    : data;

  if (!data || data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="information-circle-outline" size={48} color="#999" />
        <Text style={styles.emptyText}>{emptyMessage}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Table Header */}
      <View style={styles.headerRow}>
        {headers.map((header, index) => (
          <View 
            key={index} 
            style={[
              styles.headerCell, 
              header.width && { width: header.width },
              header.flex && { flex: header.flex }
            ]}
          >
            <Text style={[
              styles.headerText,
              header.align === 'center' && styles.centerText,
              header.align === 'right' && styles.rightText
            ]}>
              {header.label}
            </Text>
          </View>
        ))}
      </View>

      {/* Table Body */}
      <ScrollView style={styles.body}>
        {filteredData.map((row, rowIndex) => (
          <TouchableOpacity
            key={rowIndex}
            style={styles.row}
            onPress={() => onRowPress && onRowPress(row)}
            disabled={!onRowPress}
          >
            {headers.map((header, cellIndex) => {
              if (header.key === 'actions') {
                return (
                  <View key={cellIndex} style={[styles.cell, { width: header.width }]}>
                    <View style={styles.actionContainer}>
                      {actionButtons.map((button, buttonIndex) => (
                        <TouchableOpacity
                          key={buttonIndex}
                          style={[styles.actionButton, { backgroundColor: button.color }]}
                          onPress={() => button.onPress(row)}
                        >
                          <Ionicons name={button.icon} size={16} color="#fff" />
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                );
              }
              return (
                <View 
                  key={cellIndex}
                  style={[
                    styles.cell,
                    header.width && { width: header.width },
                    header.flex && { flex: header.flex }
                  ]}
                >
                  <Text 
                    style={[
                      styles.cellText,
                      header.align === 'center' && styles.centerText,
                      header.align === 'right' && styles.rightText
                    ]}
                    numberOfLines={1}
                  >
                    {header.format ? header.format(row[header.key]) : row[header.key]}
                  </Text>
                </View>
              );
            })}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.small,
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  headerCell: {
    paddingHorizontal: spacing.sm,
    justifyContent: 'center',
  },
  headerText: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.text.primary,
  },
  body: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  cell: {
    paddingHorizontal: spacing.sm,
    justifyContent: 'center',
    minHeight: 40,
  },
  cellText: {
    ...typography.body2,
    color: colors.text.secondary,
  },
  centerText: {
    textAlign: 'center',
  },
  rightText: {
    textAlign: 'right',
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: spacing.sm,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.small,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.small,
  },
  emptyText: {
    marginTop: spacing.md,
    ...typography.body1,
    color: colors.text.disabled,
    textAlign: 'center',
  },
});

export default Table; 