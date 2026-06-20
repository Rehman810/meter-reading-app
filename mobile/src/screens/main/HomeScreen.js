import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, Alert, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import client from '../../api/client';
import { useTheme } from '../../context/ThemeContext';
import { globalStyles } from '../../styles/theme';
import { Home, Receipt, ChevronRight } from 'lucide-react-native';

export default function HomeScreen({ navigation }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const gStyles = useMemo(() => globalStyles(colors), [colors]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const pulseAnim = new Animated.Value(0.5);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.5, duration: 800, useNativeDriver: true })
      ])
    ).start();
  }, []);

  const fetchAccounts = async () => {
    try {
      const { data } = await client.get('/api/accounts');
      setAccounts(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch accounts. Please check your connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchAccounts();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchAccounts();
  };

  if (loading && !refreshing) {
    return (
      <View style={[gStyles.container, { paddingTop: insets.top, paddingHorizontal: 16, paddingBottom: 16 }]}>
        <Animated.View style={{ opacity: pulseAnim }}>
          <View style={{ width: 150, height: 28, backgroundColor: '#E5E7EB', borderRadius: 4, marginBottom: 16 }} />
          <View style={[gStyles.card, { padding: 24, height: 100, marginBottom: 16 }]} />
          <View style={[gStyles.card, { padding: 24, height: 100 }]} />
        </Animated.View>
      </View>
    );
  }

  return (
    <ScrollView 
      style={gStyles.container}
      contentContainerStyle={{ paddingTop: insets.top }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={{ padding: 20 }}>
        <View style={{ marginBottom: 24, paddingHorizontal: 4, marginTop: 10 }}>
          <Text style={[gStyles.title, { marginBottom: 4, fontSize: 28 }]}>Dashboard</Text>
          <Text style={gStyles.subtitle}>Manage your utility accounts</Text>
        </View>

        {accounts.length === 0 ? (
          <View style={[gStyles.card, { alignItems: 'center', padding: 32 }]}>
            <Receipt size={48} color={colors.textLight} style={{ marginBottom: 16 }} />
            <Text style={[gStyles.title, { textAlign: 'center' }]}>No accounts found</Text>
            <Text style={[gStyles.subtitle, { textAlign: 'center', marginBottom: 24 }]}>
              Create your first utility account to start tracking your usage.
            </Text>
            <TouchableOpacity 
              style={[gStyles.button, { width: '100%' }]}
              onPress={() => navigation.navigate('CreateAccount')}
            >
              <Text style={gStyles.buttonText}>Create Account</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {accounts.map((acc, index) => (
              <TouchableOpacity 
                key={index}
                style={[gStyles.card, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingVertical: 20 }]}
                onPress={() => navigation.navigate('AccountDashboard', { accountId: acc._id, accountNumber: acc.accountNumber, consumerName: acc.consumerName })}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center', marginRight: 16 }}>
                    <Home size={24} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '700', fontSize: 18, color: colors.text, marginBottom: 2 }} numberOfLines={1}>
                      {acc.consumerName}
                    </Text>
                    <Text style={{ color: colors.textLight, fontSize: 13, fontWeight: '500' }}>
                      Ref: {acc.accountNumber}
                    </Text>
                  </View>
                </View>
                <ChevronRight size={20} color={colors.textLight} />
              </TouchableOpacity>
            ))}

            <TouchableOpacity 
              style={[gStyles.buttonSecondary, { marginTop: 16 }]}
              onPress={() => navigation.navigate('CreateAccount')}
            >
              <Text style={gStyles.buttonSecondaryText}>+ Create New Account</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </ScrollView>
  );
}
