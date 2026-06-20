import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import client from '../../api/client';
import { useTheme } from '../../context/ThemeContext';
import { globalStyles } from '../../styles/theme';

export default function HistoryScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const gStyles = useMemo(() => globalStyles(colors), [colors]);
  const [activeTab, setActiveTab] = useState('bills'); // 'bills' | 'readings'
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const endpoint = activeTab === 'bills' ? '/api/bills' : '/api/meter-readings';
      const response = await client.get(endpoint);
      setData(activeTab === 'bills' ? response.data.bills : response.data.readings);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchData();
    }, [activeTab])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const renderItem = ({ item }) => {
    const isBill = activeTab === 'bills';
    const date = new Date(item.createdAt).toLocaleDateString();

    return (
      <View style={[gStyles.card, { flexDirection: 'row', alignItems: 'center' }]}>
        <Image 
          source={{ uri: item.imageUrl }} 
          style={{ width: 60, height: 60, borderRadius: 8, marginRight: 16 }} 
        />
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 4 }}>
            {isBill ? `Bill: ${item.billingMonth || 'Unknown'}` : `Reading: ${item.reading}`}
          </Text>
          <Text style={gStyles.textLight}>{date}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          {isBill ? (
            <>
              <Text style={{ fontWeight: '600', color: colors.danger }}>Rs. {item.totalAmount || 0}</Text>
              <Text style={{ fontSize: 12, color: colors.textLight }}>{item.unitsConsumed || 0} units</Text>
            </>
          ) : (
            <Text style={{ fontSize: 12, color: item.confidence === 'low' ? colors.danger : colors.secondary }}>
              {item.confidence} conf.
            </Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={[gStyles.container, { paddingTop: insets.top }]}>
      <View style={{ flexDirection: 'row', padding: 16, backgroundColor: colors.tabBar }}>
        <TouchableOpacity 
          style={{ flex: 1, paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: activeTab === 'bills' ? colors.primary : 'transparent', alignItems: 'center' }}
          onPress={() => setActiveTab('bills')}
        >
          <Text style={{ fontWeight: '600', color: activeTab === 'bills' ? colors.primary : colors.textLight }}>Bills</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={{ flex: 1, paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: activeTab === 'readings' ? colors.primary : 'transparent', alignItems: 'center' }}
          onPress={() => setActiveTab('readings')}
        >
          <Text style={{ fontWeight: '600', color: activeTab === 'readings' ? colors.primary : colors.textLight }}>Readings</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={data}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          !loading ? (
            <Text style={{ textAlign: 'center', marginTop: 40, color: colors.textLight }}>
              No {activeTab} found.
            </Text>
          ) : null
        }
      />
    </View>
  );
}
