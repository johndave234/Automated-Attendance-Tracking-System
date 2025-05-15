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

  // Determine maxY value - ensure it's at least 5 for better visualization when all values are 0
  const maxValue = Math.max(...chartData.datasets[0].data, 5);
  
  const screenWidth = Dimensions.get('window').width;
  const containerPadding = 16;
  const chartContainerWidth = customWidth || (screenWidth - 40); // Accounting for parent padding
  const chartWidth = chartContainerWidth - containerPadding;
  const chartHeight = customHeight || 220;

  return (
    <View style={[styles.container, { width: chartContainerWidth }]}>
      {title && <Text style={styles.title}>{title}</Text>}
      <View style={styles.chartWrapper}>
        <LineChart
          data={chartData}
          width={chartWidth}
          height={chartHeight}
          yAxisSuffix=""
          yAxisInterval={1}
          fromZero={true}
          withInnerLines={true}
          withOuterLines={true}
          yAxisLabel=""
          segments={5}
          withVerticalLabels={true}
          withHorizontalLabels={true}
          chartConfig={{
            backgroundColor: '#fff',
            backgroundGradientFrom: '#fff',
            backgroundGradientTo: '#fff',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            style: {
              borderRadius: 16,
            },
            propsForDots: {
              r: '5',
              strokeWidth: '2',
              stroke: '#4CAF50',
              fill: '#fff'
            },
            propsForBackgroundLines: {
              strokeWidth: 1,
              stroke: "#e0e0e0",
              strokeDasharray: "5, 5"
            },
            formatYLabel: (value) => Math.round(value).toString(),
          }}
          bezier
          style={styles.chart}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    alignSelf: 'flex-start',
    marginLeft: 8,
  },
  chartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
});

export default TrendChart; 