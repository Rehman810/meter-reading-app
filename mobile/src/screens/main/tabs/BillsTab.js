import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Linking, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Plus, FileText } from 'lucide-react-native';
import client from '../../../api/client';
import { useTheme } from '../../../context/ThemeContext';
import { globalStyles } from '../../../styles/theme';
import Skeleton from '../../../components/Skeleton';

export default function BillsTab({ accountId, navigation }) {
  const { colors } = useTheme();
  const gStyles = useMemo(() => globalStyles(colors), [colors]);
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('ALL'); // 'ALL', 'UPLOADED', 'SYNCED'

  const fetchBills = async () => {
    try {
      const { data } = await client.get(`/api/bills?accountId=${accountId}`);
      setBills(data.bills || []);
    } catch (error) {
      console.log('Error fetching bills', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchBills();
    }, [accountId])
  );

  const syncBill = async () => {
    try {
      setRefreshing(true);
      await client.post(`/api/bills/${accountId}/sync`);
      await fetchBills();
    } catch (error) {
      alert('Error syncing bill');
    } finally {
      setRefreshing(false);
    }
  };

  const handleDownload = async (url) => {
    if (!url) {
      Alert.alert('Error', 'No file available for download');
      return;
    }
    const baseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:5000';
    const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
    try {
      await Linking.openURL(fullUrl);
    } catch (error) {
      Alert.alert('Error', 'Could not open download link');
    }
  };

  const handleDelete = (billId) => {
    Alert.alert('Delete Bill', 'Are you sure you want to delete this bill?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await client.delete(`/api/bills/${billId}`);
            fetchBills();
          } catch (error) {
            Alert.alert('Error', 'Could not delete bill');
          }
        }
      }
    ]);
  };

  const filteredBills = bills.filter(b => {
    if (filter === 'ALL') return true;
    if (filter === 'UPLOADED') return b.status !== 'FETCHED';
    if (filter === 'SYNCED') return b.status === 'FETCHED';
    return true;
  });

  const renderItem = ({ item }) => (
    <View style={[gStyles.card, styles.billCard]}>
      <View style={styles.billHeader}>
        <View style={styles.monthBadge}>
          <Text style={styles.monthText}>{item.billingMonth || 'Unknown Month'}</Text>
        </View>
        <View style={[styles.typeBadge, { backgroundColor: item.status === 'FETCHED' ? colors.primaryLight : colors.dangerLight }]}>
          <Text style={[styles.typeText, { color: item.status === 'FETCHED' ? colors.primary : colors.danger }]}>
            {item.status === 'FETCHED' ? 'Synced' : 'Uploaded'}
          </Text>
        </View>
      </View>
      
      <Text style={styles.amountText}>Rs. {item.billAmount?.toLocaleString() || item.totalAmount?.toLocaleString() || 0}</Text>
      
      <View style={styles.billDetails}>
        <View>
          <Text style={styles.detailLabel}>Units Consumed</Text>
          <Text style={styles.detailValue}>{item.unitsConsumed || 'N/A'}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.detailLabel}>Due Date</Text>
          <Text style={styles.detailValue}>{item.dueDate || 'N/A'}</Text>
        </View>
      </View>
      <View style={styles.actionRow}>
        {item.status !== 'FETCHED' && (
          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('BillViewer', { billUrl: item.pdfUrl || item.imageUrl, isPdf: !!item.pdfUrl })}>
            <Text style={styles.actionText}>View</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.actionButton} onPress={() => handleDownload(item.pdfUrl || item.imageUrl)}>
          <Text style={styles.actionText}>Download</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => handleDelete(item._id)}>
          <Text style={[styles.actionText, { color: colors.danger }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={[gStyles.buttonSecondary, { flex: 1, marginVertical: 0 }]} onPress={() => navigation.navigate('UploadBill', { accountId })}>
          <Text style={gStyles.buttonSecondaryText}>Upload Bill</Text>
        </TouchableOpacity>
        <View style={{ width: 12 }} />
        <TouchableOpacity style={[gStyles.button, { flex: 1, marginVertical: 0 }]} onPress={syncBill}>
          <Text style={gStyles.buttonText}>Sync KE Bill</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filterContainer}>
        {['ALL', 'UPLOADED', 'SYNCED'].map(f => (
          <TouchableOpacity 
            key={f} 
            style={[styles.filterTab, filter === f && styles.filterTabActive]} 
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f.charAt(0) + f.slice(1).toLowerCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading && !refreshing ? (
        <View style={{ padding: 16 }}>
          {[1, 2, 3].map(i => (
            <View key={i} style={[gStyles.card, styles.billCard]}>
              <View style={styles.billHeader}>
                <Skeleton width={80} height={28} borderRadius={16} />
                <Skeleton width={60} height={20} borderRadius={10} />
              </View>
              <Skeleton width={120} height={24} style={{ marginBottom: 16 }} />
              <View style={styles.billDetails}>
                <Skeleton width={80} height={14} />
                <Skeleton width={60} height={14} />
              </View>
            </View>
          ))}
        </View>
      ) : filteredBills.length === 0 ? (
        <View style={[gStyles.card, { paddingVertical: 40, alignItems: 'center', backgroundColor: colors.background }]}>
          <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
            <FileText size={32} color={colors.primary} />
          </View>
          <Text style={{ textAlign: 'center', color: colors.textLight, marginBottom: 12, fontSize: 16 }}>
            No bills found for this account.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredBills}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchBills(); }} />}
        />
      )}
    </View>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  billCard: {
    marginBottom: 12,
    padding: 16,
  },
  billHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  monthBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  monthText: {
    color: colors.primary,
    fontWeight: 'bold',
    fontSize: 12,
  },
  amountText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.danger,
  },
  billDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
  },
  detailLabel: {
    fontSize: 12,
    color: colors.textLight,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    paddingBottom: 0,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionButton: {
    marginLeft: 16,
  },
  actionText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  filterContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: colors.primaryLight,
    borderRadius: 12,
    padding: 4,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  filterTabActive: {
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textLight,
  },
  filterTextActive: {
    color: colors.primary,
  }
});
