import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, shadows, spacing, borderRadius } from '../config/theme';

const StatisticsChart = ({ stats = [] }) => {
  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {stats.map((stat, index) => (
          <TouchableOpacity 
            key={index}
            style={[
              styles.statCard,
              { backgroundColor: stat.backgroundColor || colors.primary }
            ]}
            onPress={stat.onPress}
            disabled={!stat.onPress}
          >
            <View style={styles.iconContainer}>
              <Ionicons 
                name={stat.icon} 
                size={32} 
                color={colors.text.inverse} 
              />
            </View>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginHorizontal: -spacing.xs,
  },
  statCard: {
    width: (Dimensions.get('window').width - (spacing.lg * 3)) / 2,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginHorizontal: spacing.xs,
    marginBottom: spacing.sm,
    ...shadows.medium,
  },
  iconContainer: {
    marginBottom: spacing.sm,
  },
  statValue: {
    ...typography.h2,
    color: colors.text.inverse,
    marginBottom: spacing.xs,
  },
  statLabel: {
    ...typography.body2,
    color: colors.text.inverse,
    opacity: 0.9,
  },
});

export default StatisticsChart; 