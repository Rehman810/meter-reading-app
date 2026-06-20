import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Camera, Activity, Trash2 } from 'lucide-react-native';
import client from '../../../api/client';
import { useTheme } from '../../../context/ThemeContext';
import { globalStyles } from '../../../styles/theme';
import Skeleton from '../../../components/Skeleton';

export default function ReadingsTab({ accountId, navigation }) {
  const { colors } = useTheme();
  const gStyles = useMemo(() => globalStyles(colors), [colors]);
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReadings = async () => {
    try {
      const { data } = await client.get(`/api/meter-readings?accountId=${accountId}`);
      setReadings(data.readings || []);
    } catch (error) {
      console.log('Error fetching readings', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchReadings();
    }, [accountId])
  );

  const handleDeleteReading = (id) => {
    Alert.alert(
      'Delete Reading',
      'Are you sure you want to delete this meter reading? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await client.delete(`/api/meter-readings/${id}`);
              setReadings(prev => prev.filter(r => r._id !== id));
            } catch (error) {
              Alert.alert('Error', 'Failed to delete reading');
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item }) => (
    <View style={[gStyles.card, styles.readingCard]}>
      <View style={styles.readingHeader}>
        <View style={styles.valueContainer}>
          <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
            <Activity color={colors.primary} size={18} />
          </View>
          <Text style={styles.readingValue}>{item.reading}</Text>
        </View>
        <Text style={styles.dateText}>{new Date(item.createdAt).toLocaleDateString()}</Text>
      </View>
      <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 12 }} />
      <View style={styles.readingDetails}>
        <TouchableOpacity 
          style={{ paddingVertical: 4 }}
          onPress={() => navigation.navigate('BillViewer', { billUrl: item.imageUrl, isPdf: false })}
        >
          <Text style={{ color: colors.primary, fontWeight: 'bold' }}>View Image</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={{ paddingVertical: 4, flexDirection: 'row', alignItems: 'center' }}
          onPress={() => handleDeleteReading(item._id)}
        >
          <Trash2 color={colors.danger} size={16} style={{ marginRight: 4 }} />
          <Text style={{ color: colors.danger, fontWeight: 'bold' }}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {loading && !refreshing ? (
        <View style={{ padding: 16 }}>
          {[1, 2, 3].map(i => (
            <View key={i} style={[gStyles.card, styles.readingCard]}>
              <View style={styles.readingHeader}>
                <Skeleton width={100} height={24} />
                <Skeleton width={80} height={14} />
              </View>
              <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 8 }} />
              <View style={styles.readingDetails}>
                <Skeleton width={80} height={20} />
              </View>
            </View>
          ))}
        </View>
      ) : readings.length === 0 && !loading ? (
        <View style={[gStyles.card, { paddingVertical: 40, alignItems: 'center', backgroundColor: colors.background, margin: 16 }]}>
          <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
            <Camera size={32} color={colors.primary} />
          </View>
          <Text style={{ textAlign: 'center', color: colors.textLight, marginBottom: 12, fontSize: 16 }}>
            No readings recorded yet.
          </Text>
        </View>
      ) : (
        <FlatList
          data={readings}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchReadings(); }} />}
        />
      )}

      <TouchableOpacity 
        style={styles.fab}
        onPress={() => navigation.navigate('MeterReading', { accountId })}
      >
        <Camera color="#fff" size={24} />
      </TouchableOpacity>
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
  readingCard: {
    marginBottom: 12,
    padding: 12,
  },
  readingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  readingValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  dateText: {
    fontSize: 12,
    color: colors.textLight,
  },
  readingDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  diffLabel: {
    fontSize: 12,
    color: colors.textLight,
  },
  diffValue: {
    fontSize: 12,
    fontWeight: 'bold',
  }
});
