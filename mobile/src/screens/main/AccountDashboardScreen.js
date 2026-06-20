import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { globalStyles } from '../../styles/theme';
import OverviewTab from './tabs/OverviewTab';
import BillsTab from './tabs/BillsTab';
import ReadingsTab from './tabs/ReadingsTab';
import AnalyticsTab from './tabs/AnalyticsTab';

export default function AccountDashboardScreen({ route, navigation }) {
  const { accountId, consumerName, accountNumber } = route.params;
  const [activeTab, setActiveTab] = useState('Overview');

  const { colors } = useTheme();
  const gStyles = useMemo(() => globalStyles(colors), [colors]);
  const styles = useMemo(() => createStyles(colors), [colors]);

  const tabs = ['Overview', 'Bills', 'Readings', 'Stats'];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Overview':
        return <OverviewTab accountId={accountId} navigation={navigation} />;
      case 'Bills':
        return <BillsTab accountId={accountId} navigation={navigation} />;
      case 'Readings':
        return <ReadingsTab accountId={accountId} navigation={navigation} />;
      case 'Stats':
        return <AnalyticsTab accountId={accountId} navigation={navigation} />;
      default:
        return <OverviewTab accountId={accountId} navigation={navigation} />;
    }
  };

  return (
    <View style={gStyles.container}>
      <View style={styles.tabContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.contentContainer}>
        {renderTabContent()}
      </View>
    </View>
  );
}

const createStyles = (colors) => StyleSheet.create({
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    zIndex: 10,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 20,
    marginHorizontal: 2,
    backgroundColor: 'transparent',
  },
  activeTabButton: {
    backgroundColor: colors.primaryLight,
  },
  tabText: {
    fontSize: 13,
    color: colors.textLight,
    fontWeight: '600',
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: '700',
  },
  contentContainer: {
    flex: 1,
  },
});
