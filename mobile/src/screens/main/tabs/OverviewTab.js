import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, RefreshControl, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import client from '../../../api/client';
import { useTheme } from '../../../context/ThemeContext';
import { globalStyles } from '../../../styles/theme';
import { Building2, Zap, DollarSign } from 'lucide-react-native';
import Skeleton from '../../../components/Skeleton';

export default function OverviewTab({ accountId, navigation }) {
  const { colors } = useTheme();
  const gStyles = useMemo(() => globalStyles(colors), [colors]);
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [data, setData] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOverview = async () => {
    try {
      const [accRes, sumRes] = await Promise.all([
        client.get(`/api/accounts/${accountId}`),
        client.get(`/api/usage/summary?accountId=${accountId}`)
      ]);
      setData(accRes.data);
      setSummary(sumRes.data);
    } catch (error) {
      console.log('Error fetching overview', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to permanently delete this account? All associated bills and readings will be lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await client.delete(`/api/accounts/${accountId}`);
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete account.');
            }
          }
        }
      ]
    );
  };

  useFocusEffect(
    useCallback(() => {
      fetchOverview();
    }, [accountId])
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={gStyles.card}>
          <View style={styles.headerRow}>
            <Skeleton width={24} height={24} borderRadius={12} style={{ marginRight: 12 }} />
            <View>
              <Skeleton width={150} height={20} style={{ marginBottom: 8 }} />
              <Skeleton width={100} height={14} />
            </View>
          </View>

        </View>

        <Skeleton width={180} height={24} style={{ marginTop: 24, marginBottom: 12 }} />
        
        <View style={gStyles.card}>
          <Skeleton width={120} height={40} style={{ marginBottom: 12 }} />
          <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 12 }} />
          {[1, 2, 3].map(i => (
            <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Skeleton width={100} height={16} />
              <Skeleton width={80} height={16} />
            </View>
          ))}
        </View>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOverview(); }} />}
    >
      <View style={gStyles.card}>
        <View style={styles.headerRow}>
          <Building2 color={colors.primary} size={24} style={{ marginRight: 12 }} />
          <View>
            <Text style={gStyles.title}>{data?.consumerName || 'Loading...'}</Text>
            <Text style={gStyles.subtitle}>Ref: {data?.accountNumber}</Text>
          </View>
        </View>

      </View>

      <Text style={[gStyles.title, { marginTop: 24, marginBottom: 12, paddingHorizontal: 20 }]}>Current Usage Summary</Text>
      
      {!summary?.hasData ? (
        <View style={[gStyles.card, { paddingVertical: 40, alignItems: 'center', backgroundColor: colors.background }]}>
          <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
            <Zap size={32} color={colors.primary} />
          </View>
          <Text style={{ textAlign: 'center', color: colors.textLight, marginBottom: 12, fontSize: 16 }}>
            No bills uploaded yet. Upload your first bill to see your usage.
          </Text>
        </View>
      ) : (
        <View style={gStyles.card}>
          {summary.hasReading ? (
            <>
              <View style={{ alignItems: 'center', marginVertical: 12 }}>
                <Text style={{ fontSize: 13, color: colors.textLight, textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: 1, marginBottom: 8, textAlign: 'center' }}>
                  Units Used Since {summary.billIssueDate ? summary.billIssueDate : summary.billMonth}
                </Text>
                <Text style={[gStyles.largeNumber, { fontSize: 48 }]}>{summary.unitsUsedSinceBill}</Text>
              </View>
              
              <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 16 }} />
              
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                <Text style={gStyles.textLight}>Estimated cost so far</Text>
                <Text style={{ fontWeight: '800', color: colors.danger, fontSize: 16 }}>
                  Rs. {summary.estimatedCost != null ? Math.round(summary.estimatedCost).toLocaleString() : 'N/A'}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                <Text style={gStyles.textLight}>Daily average</Text>
                <Text style={{ fontWeight: '600', color: colors.text }}>{summary.dailyAverage?.toFixed(1)} units/day</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={gStyles.textLight}>Projected month-end</Text>
                <Text style={{ fontWeight: '600', color: colors.text }}>{Math.round(summary.projectedMonthlyUnits || 0)} units</Text>
              </View>
            </>
          ) : (
            <View style={{ paddingVertical: 20, alignItems: 'center' }}>
              <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.dangerLight, justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
                <DollarSign size={28} color={colors.danger} />
              </View>
              <Text style={[gStyles.title, { fontSize: 32, marginBottom: 8, color: colors.text }]}>
                Rs. {summary.billAmount?.toLocaleString() || '---'}
              </Text>
              <Text style={{ color: colors.textLight, marginBottom: 20, fontSize: 16, fontWeight: '500' }}>
                Billed for {summary.billUnits || '---'} units in {summary.billMonth || '---'}
              </Text>
              <View style={{ height: 1, width: '100%', backgroundColor: colors.border, marginBottom: 20 }} />
              <Text style={{ textAlign: 'center', color: colors.textLight, fontSize: 15, lineHeight: 22 }}>
                No meter readings taken yet since this bill. Record a reading to track your live usage.
              </Text>
            </View>
          )}
        </View>
      )}

      <TouchableOpacity 
        style={[gStyles.card, { marginTop: 24, marginBottom: 40, alignItems: 'center', backgroundColor: colors.dangerLight, borderColor: colors.danger, borderWidth: 1 }]}
        onPress={handleDeleteAccount}
      >
        <Text style={{ color: colors.danger, fontWeight: 'bold' }}>Delete Account</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: colors.background,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    color: colors.textLight,
  },
  infoValue: {
    fontWeight: '500',
    color: colors.text,
  }
});
