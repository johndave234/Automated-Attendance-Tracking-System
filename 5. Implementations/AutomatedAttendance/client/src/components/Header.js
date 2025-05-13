import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, shadows, spacing } from '../config/theme';

const Header = ({
  title = 'Welcome, Admin',
  subtitle = 'Manage accounts',
  onLogout,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.welcomeText}>{title}</Text>
          {subtitle && (
            <Text style={styles.subtitleText}>{subtitle}</Text>
          )}
        </View>
        {onLogout && (
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={onLogout}
          >
            <Ionicons name="log-out-outline" size={24} color={colors.text.inverse} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.primary,
  },
  header: {
    padding: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...shadows.medium,
  },
  headerContent: {
    flex: 1,
  },
  welcomeText: {
    ...typography.h2,
    color: colors.text.inverse,
    marginBottom: spacing.xs,
  },
  subtitleText: {
    ...typography.body2,
    color: colors.text.inverse,
    opacity: 0.9,
  },
  logoutButton: {
    padding: spacing.sm,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
});

export default Header; 