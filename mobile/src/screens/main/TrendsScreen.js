import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, Dimensions, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import client from '../../api/client';
import { useTheme } from '../../context/ThemeContext';
import { globalStyles } from '../../styles/theme';

const screenWidth = Dimensions.get('window').width - 32; // 16 padding on each side

export default function TrendsScreen() {
  const { colors } = useTheme();
  const gStyles = useMemo(() => globalStyles(colors), [colors]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = async () => {
    try {
      const { data } = await client.get('/api/usage/history');
      setHistory(data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchHistory();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  if (loading && !refreshing) {
    return (
      <View style={[gStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text>Loading trends...</Text>
      </View>
    );
  }

  if (history.length === 0) {
    return (
      <View style={[gStyles.container, { justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
        <Text style={gStyles.title}>No Data Available</Text>
        <Text style={[gStyles.subtitle, { textAlign: 'center' }]}>Upload more bills to see your usage trends over time.</Text>
      </View>
    );
  }

  const labels = history.map(h => {
    if (!h.month) return '?';
    // e.g. "2026-05" -> "May"
    const parts = h.month.split('-');
    if (parts.length === 2) {
      const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1);
      return date.toLocaleString('default', { month: 'short' });
    }
    return h.month;
  });

  const unitsData = history.map(h => h.unitsConsumed || 0);
  const costData = history.map(h => h.totalAmount || 0);

  const chartConfig = {
    backgroundGradientFrom: colors.surface,
    backgroundGradientTo: colors.surface,
    color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    decimalPlaces: 0,
  };

  return (
    <ScrollView 
      style={gStyles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={{ padding: 16 }}>
        <Text style={[gStyles.title, { marginBottom: 16 }]}>Usage Trends</Text>
        
        <View style={gStyles.card}>
          <Text style={[gStyles.subtitle, { marginBottom: 16, color: colors.text, fontWeight: '600' }]}>Units Consumed</Text>
          <LineChart
            data={{
              labels: labels,
              datasets: [{ data: unitsData }]
            }}
            width={screenWidth - 32} // padding inside card
            height={220}
            chartConfig={chartConfig}
            bezier
            style={{ borderRadius: 8, marginLeft: -10 }}
          />
        </View>

        <View style={gStyles.card}>
          <Text style={[gStyles.subtitle, { marginBottom: 16, color: colors.text, fontWeight: '600' }]}>Total Cost (Rs.)</Text>
          <BarChart
            data={{
              labels: labels,
              datasets: [{ data: costData }]
            }}
            width={screenWidth - 32}
            height={220}
            yAxisLabel="Rs."
            chartConfig={{...chartConfig, color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`}}
            style={{ borderRadius: 8, marginLeft: -10 }}
          />
        </View>
      </View>
    </ScrollView>
  );
}
