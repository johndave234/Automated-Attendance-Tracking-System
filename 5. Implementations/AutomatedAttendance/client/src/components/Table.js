import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
    backgroundColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eee',
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  headerCell: {
    paddingHorizontal: 8,
    justifyContent: 'center',
  },
  headerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#444',
  },
  body: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  cell: {
    paddingHorizontal: 8,
    justifyContent: 'center',
    minHeight: 36,
  },
  cellText: {
    fontSize: 14,
    color: '#333',
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
    gap: 8,
  },
  actionButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
});

export default Table; 