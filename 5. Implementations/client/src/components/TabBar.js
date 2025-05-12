import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, shadows, spacing, borderRadius } from '../config/theme';

const TabBar = ({
  activeTab = 'dashboard',
  onTabPress,
}) => {
  const tabs = [
    {
      key: 'dashboard',
      label: 'Dashboard',
      icon: 'home-outline',
      activeIcon: 'home',
    },
    {
      key: 'users',
      label: 'Users',
      icon: 'people-outline',
      activeIcon: 'people',
    },
    {
      key: 'courses',
      label: 'Courses',
      icon: 'book-outline',
      activeIcon: 'book',
    }
  ];

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, isActive && styles.activeTab]}
            onPress={() => onTabPress(tab.key)}
          >
            <View style={[styles.iconContainer, isActive && styles.activeIconContainer]}>
              <Ionicons
                name={isActive ? tab.activeIcon : tab.icon}
                size={22}
                color={isActive ? colors.primary : colors.text.secondary}
              />
            </View>
            <Text style={[
              styles.tabLabel,
              isActive && styles.activeTabLabel
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    height: 65,
    paddingBottom: spacing.xs,
    paddingTop: spacing.xs,
    ...shadows.small,
  },
  tab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    padding: spacing.xs,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
  },
  activeIconContainer: {
    backgroundColor: colors.primary + '15', // 15% opacity
  },
  tabLabel: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  activeTabLabel: {
    color: colors.primary,
    fontWeight: '600',
  },
  activeTab: {
    borderRadius: borderRadius.sm,
  },
});

export default TabBar; 