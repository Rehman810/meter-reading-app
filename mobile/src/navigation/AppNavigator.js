import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, History, TrendingUp, User } from 'lucide-react-native';

import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

// Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import HomeScreen from '../screens/main/HomeScreen';
import CreateAccountScreen from '../screens/main/CreateAccountScreen';
import AccountDashboardScreen from '../screens/main/AccountDashboardScreen';
import UploadBillScreen from '../screens/main/UploadBillScreen';
import MeterReadingScreen from '../screens/main/MeterReadingScreen';
import HistoryScreen from '../screens/main/HistoryScreen';
// import TrendsScreen from '../screens/main/TrendsScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import BillViewerScreen from '../screens/main/BillViewerScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function AuthNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        statusBarTranslucent: false,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

function MainTabs() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size, focused }) => {
          size = focused ? 26 : 24;
          if (route.name === 'Dashboard') return <Home color={color} size={size} strokeWidth={focused ? 2.5 : 2} />;
          if (route.name === 'History') return <History color={color} size={size} strokeWidth={focused ? 2.5 : 2} />;
          // if (route.name === 'Trends') return <TrendingUp color={color} size={size} strokeWidth={focused ? 2.5 : 2} />;
          if (route.name === 'Profile') return <User color={color} size={size} strokeWidth={focused ? 2.5 : 2} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textLight,
        headerShown: false,
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.background },
        headerTitleStyle: { fontWeight: '700', color: colors.text },
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopWidth: 0,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.05,
          shadowRadius: 10,
          height: 50 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontWeight: '600',
          fontSize: 12,
        }
      })}
    >
      <Tab.Screen name="Dashboard" component={HomeScreen} />
      <Tab.Screen name="History" component={HistoryScreen} />
      {/* <Tab.Screen name="Trends" component={TrendsScreen} /> */}
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { user, loading } = useContext(AuthContext);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background, paddingTop: insets.top }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? (
        <Stack.Navigator 
          screenOptions={{ 
            headerShadowVisible: false,
            headerStyle: { backgroundColor: colors.background },
            headerTitleStyle: { fontWeight: '700', color: colors.text },
            headerTintColor: colors.primary,
            contentStyle: { backgroundColor: colors.background },
            statusBarTranslucent: false,
          }}
        >
          <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
          <Stack.Screen name="CreateAccount" component={CreateAccountScreen} options={{ title: 'Add Account' }} />
          <Stack.Screen name="AccountDashboard" component={AccountDashboardScreen} options={({ route }) => ({ title: route.params?.consumerName || 'Dashboard' })} />
          <Stack.Screen name="UploadBill" component={UploadBillScreen} options={{ title: 'Upload Bill' }} />
          <Stack.Screen name="MeterReading" component={MeterReadingScreen} options={{ title: 'Scan Meter' }} />
          <Stack.Screen name="BillViewer" component={BillViewerScreen} options={{ title: 'View Document' }} />
        </Stack.Navigator>
      ) : (
        <AuthNavigator />
      )}
    </NavigationContainer>
  );
}

export default AppNavigator;
