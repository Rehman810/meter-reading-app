import React, { useContext, useState, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView, Alert, Platform, Modal, TextInput, ActivityIndicator, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { globalStyles } from '../../styles/theme';
import { User, LogOut, Edit3, Settings, Shield, Bell, ChevronRight, Camera, Key, X, Moon, Sun } from 'lucide-react-native';
import client from '../../api/client';
import Skeleton from '../../components/Skeleton';
import * as SecureStore from 'expo-secure-store';

export default function ProfileScreen({ navigation }) {
  const { user, login, logout } = useContext(AuthContext);
  const { colors, isDark, toggleTheme } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Edit Profile form
  const [editName, setEditName] = useState(user?.name || '');

  // Change Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await client.get('/api/accounts');
        setStats({ accounts: data.length || 0 });
      } catch (err) {
        console.log('Error fetching profile stats', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
    if (user) {
      setEditName(user.name);
    }
  }, [user]);

  const handleUpdateProfile = async () => {
    if (!editName.trim()) return Alert.alert('Error', 'Name cannot be empty');
    setIsUpdating(true);
    try {
      const { data } = await client.put('/api/users/profile', { name: editName });
      await SecureStore.setItemAsync('userInfo', JSON.stringify(data));
      // Hack to update context state by triggering login again with new data
      login(data);
      Alert.alert('Success', 'Profile updated successfully!');
      setShowEditProfile(false);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      return Alert.alert('Error', 'Please fill all fields');
    }
    if (newPassword !== confirmPassword) {
      return Alert.alert('Error', 'New passwords do not match');
    }
    if (newPassword.length < 6) {
      return Alert.alert('Error', 'Password must be at least 6 characters');
    }

    setIsUpdating(true);
    try {
      await client.put('/api/users/password', { currentPassword, newPassword });
      Alert.alert('Success', 'Password updated successfully!');
      setShowChangePassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update password');
    } finally {
      setIsUpdating(false);
    }
  };

  const SettingsItem = ({ icon: Icon, title, subtitle, onPress, destructive }) => (
    <TouchableOpacity style={styles.settingsItem} onPress={onPress}>
      <View style={[styles.iconContainer, destructive && { backgroundColor: '#FEE2E2' }]}>
        <Icon color={destructive ? colors.danger : colors.primary} size={20} />
      </View>
      <View style={styles.settingsTextContainer}>
        <Text style={[styles.settingsTitle, destructive && { color: colors.danger }]}>{title}</Text>
        {subtitle && <Text style={styles.settingsSubtitle}>{subtitle}</Text>}
      </View>
      <ChevronRight color={colors.border} size={20} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        
        <View style={styles.header}>
          <View style={styles.avatarWrapper}>
            <Image 
              source={{ uri: user?.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=E0E7FF&color=4F46E5&size=200&font-size=0.4` }} 
              style={styles.avatar} 
            />
            <TouchableOpacity style={styles.editAvatarBtn} onPress={() => Alert.alert('Update Photo', 'Photo upload feature coming soon!')}>
              <Camera color="#fff" size={16} />
            </TouchableOpacity>
          </View>
          <Text style={styles.nameText}>{user?.name || 'User Name'}</Text>
          <Text style={styles.emailText}>{user?.email || 'user@example.com'}</Text>

          <TouchableOpacity style={styles.editProfileBtn} onPress={() => setShowEditProfile(true)}>
            <Edit3 color="#fff" size={16} style={{ marginRight: 6 }} />
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            {loading ? (
              <Skeleton width={32} height={24} style={{ marginBottom: 4 }} />
            ) : (
              <Text style={styles.statNumber}>{stats?.accounts || 0}</Text>
            )}
            <Text style={styles.statLabel}>Linked Accounts</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>Active</Text>
            <Text style={styles.statLabel}>Status</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Settings</Text>
          <View style={styles.card}>
            <SettingsItem 
              icon={User} 
              title="Personal Information" 
              subtitle="Update your name and avatar"
              onPress={() => setShowEditProfile(true)}
            />
            <View style={styles.divider} />
            <SettingsItem 
              icon={Key} 
              title="Security & Password" 
              subtitle="Update your password"
              onPress={() => setShowChangePassword(true)}
            />
            <View style={styles.divider} />
            <View style={styles.settingsItem}>
              <View style={[styles.iconContainer, { backgroundColor: isDark ? '#312E81' : '#EEF2FF' }]}>
                {isDark ? <Moon color={colors.primary} size={20} /> : <Sun color={colors.primary} size={20} />}
              </View>
              <View style={styles.settingsTextContainer}>
                <Text style={styles.settingsTitle}>App Appearance</Text>
                <Text style={styles.settingsSubtitle}>{isDark ? 'Dark Mode' : 'Light Mode'}</Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: '#D1D5DB', true: '#4F46E5' }}
                thumbColor={isDark ? '#fff' : '#fff'}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support & More</Text>
          <View style={styles.card}>
            <SettingsItem 
              icon={Shield} 
              title="Privacy Policy" 
              onPress={() => Alert.alert('Privacy', 'Your data is strictly encrypted and stored securely.')}
            />
            <View style={styles.divider} />
            <SettingsItem 
              icon={Bell} 
              title="Notifications" 
              onPress={() => Alert.alert('Notifications', 'Push notifications enabled.')}
            />
          </View>
        </View>

        <View style={[styles.section, { marginTop: 10 }]}>
          <View style={styles.card}>
            <SettingsItem 
              icon={LogOut} 
              title="Log Out" 
              destructive={true}
              onPress={logout}
            />
          </View>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={showEditProfile} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setShowEditProfile(false)}>
                <X color={colors.text} size={24} />
              </TouchableOpacity>
            </View>
            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={editName}
              onChangeText={setEditName}
              placeholder="Enter your full name"
            />
            <TouchableOpacity style={styles.submitBtn} onPress={handleUpdateProfile} disabled={isUpdating}>
              {isUpdating ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Save Changes</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Change Password Modal */}
      <Modal visible={showChangePassword} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Password</Text>
              <TouchableOpacity onPress={() => setShowChangePassword(false)}>
                <X color={colors.text} size={24} />
              </TouchableOpacity>
            </View>
            <Text style={styles.inputLabel}>Current Password</Text>
            <TextInput
              style={styles.input}
              secureTextEntry
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Enter current password"
            />
            <Text style={styles.inputLabel}>New Password</Text>
            <TextInput
              style={styles.input}
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Enter new password"
            />
            <Text style={styles.inputLabel}>Confirm New Password</Text>
            <TextInput
              style={styles.input}
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm new password"
            />
            <TouchableOpacity style={styles.submitBtn} onPress={handleUpdatePassword} disabled={isUpdating}>
              {isUpdating ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Update Password</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.surface,
    paddingTop: Platform.OS === 'ios' ? 20 : 40,
    paddingBottom: 30,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: 20,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 4,
    borderColor: colors.primaryLight,
  },
  editAvatarBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary,
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.surface,
  },
  nameText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  emailText: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 16,
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 20,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  editProfileText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
    height: '100%',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textLight,
    fontWeight: '500',
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textLight,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingsTextContainer: {
    flex: 1,
  },
  settingsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  settingsSubtitle: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 72,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textLight,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.inputBg,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    marginBottom: 16,
  },
  submitBtn: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  }
});
