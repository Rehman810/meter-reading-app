import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import client from '../../../api/client';
import { useTheme } from '../../../context/ThemeContext';
import { globalStyles } from '../../../styles/theme';
import { TrendingUp, BarChart2, Activity, Sparkles } from 'lucide-react-native';
import Skeleton from '../../../components/Skeleton';

export default function AnalyticsTab({ accountId }) {
  const { colors } = useTheme();
  const gStyles = useMemo(() => globalStyles(colors), [colors]);
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = async () => {
    try {
      const { data } = await client.get(`/api/analytics/${accountId}`);
      setAnalytics(data);
    } catch (error) {
      console.log('Error fetching analytics', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchAnalytics();
    }, [accountId])
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <Skeleton width={180} height={24} style={{ marginBottom: 16 }} />
        
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
          <View style={[gStyles.card, styles.statCard]}>
            <Skeleton width={32} height={32} borderRadius={16} style={{ marginBottom: 8 }} />
            <Skeleton width={80} height={14} style={{ marginBottom: 8 }} />
            <Skeleton width={100} height={20} />
          </View>
          <View style={[gStyles.card, styles.statCard]}>
            <Skeleton width={32} height={32} borderRadius={16} style={{ marginBottom: 8 }} />
            <Skeleton width={80} height={14} style={{ marginBottom: 8 }} />
            <Skeleton width={100} height={20} />
          </View>
        </View>

        {[1, 2].map(i => (
          <View key={i} style={[gStyles.card, { marginBottom: 16 }]}>
            <Skeleton width={180} height={16} style={{ marginBottom: 12 }} />
            <Skeleton width={100} height={24} style={{ marginBottom: 8 }} />
            <Skeleton width={60} height={14} />
          </View>
        ))}
      </View>
    );
  }

  if (!analytics || !analytics.hasData) {
    return (
      <ScrollView 
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAnalytics(); }} />}
      >
        <View style={[gStyles.card, { paddingVertical: 40, alignItems: 'center', backgroundColor: colors.background, margin: 16 }]}>
          <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
            <TrendingUp size={32} color={colors.primary} />
          </View>
          <Text style={[gStyles.title, { textAlign: 'center', fontSize: 20 }]}>Analytics & Trends</Text>
          <Text style={{ textAlign: 'center', color: colors.textLight, marginTop: 8, fontSize: 15, paddingHorizontal: 20 }}>
            Upload more bills to unlock analytics and consumption trends.
          </Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAnalytics(); }} />}
    >
      {/* Temporarily disabled AI Insights
      analytics.aiInsights && (
        <View style={[gStyles.card, { marginBottom: 24, backgroundColor: '#F5F3FF', borderColor: '#DDD6FE', borderWidth: 1 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#EDE9FE', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
              <Sparkles size={18} color="#8B5CF6" />
            </View>
            <Text style={[gStyles.title, { color: '#6D28D9', fontSize: 18 }]}>AI Insights</Text>
          </View>
          <Text style={{ color: '#4C1D95', fontSize: 15, lineHeight: 24 }}>
            {analytics.aiInsights}
          </Text>
        </View>
      )*/}

      <Text style={[gStyles.title, { marginBottom: 16, paddingHorizontal: 4 }]}>Consumption Insights</Text>
      
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
        <View style={[gStyles.card, styles.statCard]}>
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
            <Activity color={colors.primary} size={22} />
          </View>
          <Text style={styles.statValue}>{analytics.averageUnits} <Text style={{fontSize: 14, color: colors.textLight, fontWeight: 'normal'}}>units</Text></Text>
          <Text style={styles.statLabel}>Avg Consumption</Text>
        </View>
        <View style={[gStyles.card, styles.statCard]}>
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.warningLight, justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
            <BarChart2 color={colors.warning} size={22} />
          </View>
          <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>Rs. {analytics.averageBill}</Text>
          <Text style={styles.statLabel}>Avg Bill Amount</Text>
        </View>
      </View>

      <View style={[gStyles.card, { marginBottom: 16, borderLeftWidth: 4, borderLeftColor: colors.danger }]}>
        <Text style={[gStyles.subtitle, { color: colors.danger, marginBottom: 8, fontSize: 14, fontWeight: '600' }]}>Highest Consumption</Text>
        <Text style={styles.monthText}>{analytics.highestMonth?.month || 'N/A'}</Text>
        <Text style={styles.unitsText}>{analytics.highestMonth?.units || 0} units</Text>
      </View>

      <View style={[gStyles.card, { marginBottom: 100, borderLeftWidth: 4, borderLeftColor: colors.secondary }]}>
        <Text style={[gStyles.subtitle, { color: colors.secondary, marginBottom: 8, fontSize: 14, fontWeight: '600' }]}>Lowest Consumption</Text>
        <Text style={styles.monthText}>{analytics.lowestMonth?.month || 'N/A'}</Text>
        <Text style={styles.unitsText}>{analytics.lowestMonth?.units || 0} units</Text>
      </View>
    </ScrollView>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 64,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
    padding: 16,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textLight,
    marginBottom: 4,
    textAlign: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  monthText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  unitsText: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 4,
  }
});
