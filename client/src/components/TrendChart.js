import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { colors, typography, shadows, spacing, borderRadius } from '../config/theme';

const TrendChart = ({ data, title, width: customWidth, height: customHeight }) => {
  // Ensure data values are numbers
  const chartData = {
    ...data,
    datasets: data.datasets.map(dataset => ({
      ...dataset,
      data: dataset.data.map(value => Number(value) || 0)
    }))
  };

  const chartWidth = customWidth || Dimensions.get('window').width - (spacing.lg * 2);
  const chartHeight = customHeight || 220;

  return (
    <View style={[styles.container, { width: chartWidth }]}>
      <Text style={styles.title}>{title}</Text>
      <LineChart
        data={chartData}
        width={chartWidth - (spacing.lg * 2)}  // Account for container padding
        height={chartHeight}
        yAxisSuffix=""
        yAxisInterval={1}
        chartConfig={{
          backgroundColor: colors.primary,
          backgroundGradientFrom: colors.gradients.primary[0],
          backgroundGradientTo: colors.gradients.primary[1],
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
          style: {
            borderRadius: borderRadius.lg,
          },
          propsForDots: {
            r: '6',
            strokeWidth: '2',
            stroke: colors.secondary,
          },
        }}
        bezier
        style={styles.chart}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    ...shadows.medium,
  },
  title: {
    ...typography.h3,
    color: colors.text.inverse,
    marginBottom: spacing.sm,
  },
  chart: {
    marginVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
});

export default TrendChart; 