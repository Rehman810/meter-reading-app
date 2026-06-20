import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import client from '../../api/client';
import { useTheme } from '../../context/ThemeContext';
import { globalStyles } from '../../styles/theme';
import { Building2, Save, ScanLine } from 'lucide-react-native';

export default function CreateAccountScreen({ navigation }) {
  const { colors } = useTheme();
  const gStyles = useMemo(() => globalStyles(colors), [colors]);
  const [form, setForm] = useState({
    consumerName: '',
    accountNumber: '',
    consumerNumber: '',
    address: '',
    meterNumber: '',
    connectionType: 'Residential',
  });
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);

  const handleExtract = async () => {
    let permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert('Permission required', 'Permission to access gallery is required!');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled) {
      setExtracting(true);
      const asset = result.assets[0];
      
      try {
        const manipResult = await ImageManipulator.manipulateAsync(
          asset.uri,
          [{ resize: { width: Math.min(asset.width, 1600) } }],
          { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
        );
        
        const formData = new FormData();
        formData.append('image', {
          uri: manipResult.uri,
          name: 'bill.jpg',
          type: 'image/jpeg',
        });

        const { data } = await client.post('/api/accounts/extract', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        setForm({
          ...form,
          consumerName: data.consumerName || form.consumerName,
          accountNumber: data.accountNumber || form.accountNumber,
        });

        Alert.alert('Success', 'Auto-filled fields from the bill. Please verify the details.');
      } catch (err) {
        Alert.alert('Error', err.response?.data?.error || 'Failed to extract data. Please enter manually.');
      } finally {
        setExtracting(false);
      }
    }
  };

  const handleSave = async () => {
    if (!form.consumerName || !form.accountNumber) {
      Alert.alert('Validation Error', 'Consumer Name and Account Number are required.');
      return;
    }
    
    setLoading(true);
    try {
      const { data } = await client.post('/api/accounts', form);
      Alert.alert('Success', 'Account created successfully!');
      navigation.replace('AccountDashboard', { accountId: data._id, consumerName: data.consumerName, accountNumber: data.accountNumber });
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to create account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={[gStyles.container, { padding: 16 }]}>
      <View style={[gStyles.card, { marginBottom: 24 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Building2 color={colors.primary} size={24} style={{ marginRight: 8 }} />
            <Text style={gStyles.title}>New Account</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={[gStyles.buttonSecondary, { marginBottom: 24 }]}
          onPress={handleExtract}
          disabled={extracting}
        >
          {extracting ? (
            <ActivityIndicator color={colors.primary} size="small" style={{ marginRight: 8 }} />
          ) : (
            <ScanLine color={colors.primary} size={20} style={{ marginRight: 8 }} />
          )}
          <Text style={gStyles.buttonSecondaryText}>
            {extracting ? 'Extracting Data...' : 'Auto-fill from Bill Photo'}
          </Text>
        </TouchableOpacity>

        <Text style={gStyles.label}>Consumer Name *</Text>
        <TextInput
          style={gStyles.input}
          placeholder="e.g. John Doe"
          value={form.consumerName}
          onChangeText={(val) => setForm({ ...form, consumerName: val })}
        />

        <Text style={gStyles.label}>Account / Reference Number *</Text>
        <TextInput
          style={gStyles.input}
          placeholder="e.g. 04123456789"
          value={form.accountNumber}
          onChangeText={(val) => setForm({ ...form, accountNumber: val })}
        />

        <Text style={gStyles.label}>Consumer Number (Optional)</Text>
        <TextInput
          style={gStyles.input}
          placeholder="e.g. 123456"
          value={form.consumerNumber}
          onChangeText={(val) => setForm({ ...form, consumerNumber: val })}
        />

        <Text style={gStyles.label}>Meter Number (Optional)</Text>
        <TextInput
          style={gStyles.input}
          placeholder="e.g. MTR-9901"
          value={form.meterNumber}
          onChangeText={(val) => setForm({ ...form, meterNumber: val })}
        />

        <Text style={gStyles.label}>Address (Optional)</Text>
        <TextInput
          style={[gStyles.input, { height: 80 }]}
          placeholder="123 Main St"
          multiline
          value={form.address}
          onChangeText={(val) => setForm({ ...form, address: val })}
        />

        <TouchableOpacity 
          style={[gStyles.button, { marginTop: 16, opacity: loading ? 0.7 : 1 }]}
          onPress={handleSave}
          disabled={loading}
        >
          <Save color="#fff" size={20} style={{ marginRight: 8 }} />
          <Text style={gStyles.buttonText}>{loading ? 'Saving...' : 'Save Account'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
