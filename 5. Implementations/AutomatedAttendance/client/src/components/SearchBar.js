import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, shadows, spacing, borderRadius } from '../config/theme';

const SearchBar = ({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search...',
  showCreateButton = true,
  createButtonText = 'Create',
  onCreatePress,
  createButtonIcon = 'add',
}) => {
  return (
    <View style={styles.searchContainer}>
      <View style={styles.searchInputContainer}>
        <Ionicons 
          name="search" 
          size={20} 
          color={colors.text.secondary} 
          style={styles.searchIcon} 
        />
        <TextInput
          style={styles.searchInput}
          placeholder={searchPlaceholder}
          value={searchValue}
          onChangeText={onSearchChange}
          placeholderTextColor={colors.text.disabled}
        />
      </View>
      {showCreateButton && (
        <TouchableOpacity
          style={styles.createButton}
          onPress={onCreatePress}
        >
          <Ionicons name={createButtonIcon} size={20} color={colors.text.inverse} />
          <Text style={styles.createButtonText}>{createButtonText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    height: 44,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.small,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...typography.body2,
    color: colors.text.primary,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    height: 44,
    ...shadows.small,
  },
  createButtonText: {
    color: colors.text.inverse,
    ...typography.body2,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
});

export default SearchBar; 