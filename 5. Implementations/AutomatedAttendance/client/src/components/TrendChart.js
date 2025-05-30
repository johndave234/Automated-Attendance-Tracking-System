import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

const TrendChart = ({ data, title, width: customWidth, height: customHeight }) => {
  // Ensure data values are numbers
  const chartData = {
    ...data,
    datasets: data.datasets.map(dataset => ({
      ...dataset,
      data: dataset.data.map(value => Number(value) || 0)
    }))
  };

  const chartWidth = customWidth || Dimensions.get('window').width - 32;
  const chartHeight = customHeight || 220;

  return (
    <View style={[styles.container, { width: chartWidth }]}>
      <Text style={styles.title}>{title}</Text>
      <LineChart
        data={chartData}
        width={chartWidth - 30}  // Account for container padding
        height={chartHeight}
        yAxisSuffix=""
        yAxisInterval={1}
        chartConfig={{
          backgroundColor: '#165973',
          backgroundGradientFrom: '#165973',
          backgroundGradientTo: '#1B6F8F',
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(184, 227, 255, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
          style: {
            borderRadius: 16,
          },
          propsForDots: {
            r: '6',
            strokeWidth: '2',
            stroke: '#7FB3D1',
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
    backgroundColor: '#165973',
    borderRadius: 12,
    padding: 15,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
});

export default TrendChart; 