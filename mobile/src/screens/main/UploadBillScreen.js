import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, Image, Alert, ActivityIndicator, ScrollView, TextInput } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import client from '../../api/client';
import { useTheme } from '../../context/ThemeContext';
import { globalStyles } from '../../styles/theme';
import { Camera, UploadCloud } from 'lucide-react-native';

export default function UploadBillScreen({ route, navigation }) {
  const { colors } = useTheme();
  const gStyles = useMemo(() => globalStyles(colors), [colors]);
  const { accountId } = route.params || {};
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const pickImage = async (useCamera = false) => {
    let permissionResult;
    if (useCamera) {
      permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    } else {
      permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    }

    if (permissionResult.granted === false) {
      Alert.alert('Permission required', 'Permission to access camera/gallery is required!');
      return;
    }

    let result = await (useCamera 
      ? ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
        })
      : ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
        })
    );

    if (!result.canceled) {
      const asset = result.assets[0];
      try {
        const manipResult = await ImageManipulator.manipulateAsync(
          asset.uri,
          [{ resize: { width: Math.min(asset.width, 1600) } }],
          { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
        );
        setImage(manipResult);
      } catch (err) {
        setImage(asset); // Fallback
      }
      setResult(null); // Reset previous result
    }
  };

  const uploadBill = async () => {
    if (!image) return;

    setLoading(true);
    const formData = new FormData();
    if (accountId) {
      formData.append('accountId', accountId);
    }
    formData.append('image', {
      uri: image.uri,
      name: 'bill.jpg',
      type: 'image/jpeg',
    });

    try {
      const response = await client.post('/api/bills/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(response.data);
      Alert.alert('Success', 'Bill processed! Please review the extracted data and save.');
    } catch (error) {
      const msg = error.response?.data?.error || 'Failed to upload image. Please try again.';
      Alert.alert('Upload Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={gStyles.container}>
      <View style={{ padding: 16 }}>
        {!image ? (
          <View style={{ marginTop: 20 }}>
            <Text style={[gStyles.title, { textAlign: 'center', marginBottom: 20 }]}>Upload your Monthly Bill</Text>
            <TouchableOpacity 
              style={[gStyles.button, { paddingVertical: 20 }]}
              onPress={() => pickImage(true)}
            >
              <Camera color="#fff" size={24} style={{ marginBottom: 8 }} />
              <Text style={gStyles.buttonText}>Take Photo</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[gStyles.buttonSecondary, { paddingVertical: 20 }]}
              onPress={() => pickImage(false)}
            >
              <UploadCloud color={colors.primary} size={24} style={{ marginBottom: 8 }} />
              <Text style={gStyles.buttonSecondaryText}>Choose from Gallery</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ alignItems: 'center' }}>
            <Image source={{ uri: image.uri }} style={{ width: '100%', height: 300, borderRadius: 12, marginBottom: 20 }} resizeMode="contain" />
            
            {loading ? (
              <View style={{ alignItems: 'center', padding: 20 }}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={{ marginTop: 10, color: colors.textLight }}>Reading your bill...</Text>
              </View>
            ) : result ? (
              <View style={[gStyles.card, { width: '100%' }]}>
                <Text style={[gStyles.title, { fontSize: 20, marginBottom: 16 }]}>Review & Edit Data</Text>
                
                <Text style={gStyles.label}>Consumer Name</Text>
                <TextInput 
                  style={gStyles.input} 
                  value={result.consumerName || ''} 
                  onChangeText={(text) => setResult({...result, consumerName: text})}
                  placeholder="e.g. John Doe"
                />

                <Text style={gStyles.label}>Account / Ref Number</Text>
                <TextInput 
                  style={gStyles.input} 
                  value={result.accountNumber || ''} 
                  onChangeText={(text) => setResult({...result, accountNumber: text})}
                  placeholder="e.g. 04123456789"
                />

                <Text style={gStyles.label}>Billing Month</Text>
                <TextInput 
                  style={gStyles.input} 
                  value={result.billingMonth || ''} 
                  onChangeText={(text) => setResult({...result, billingMonth: text})}
                  placeholder="e.g. 2026-05"
                />

                <Text style={gStyles.label}>Issue Date</Text>
                <TextInput 
                  style={gStyles.input} 
                  value={result.issueDate || ''} 
                  onChangeText={(text) => setResult({...result, issueDate: text})}
                  placeholder="YYYY-MM-DD"
                />

                <Text style={gStyles.label}>Units Consumed</Text>
                <TextInput 
                  style={gStyles.input} 
                  value={result.unitsConsumed?.toString() || ''} 
                  onChangeText={(text) => setResult({...result, unitsConsumed: parseFloat(text) || 0})}
                  keyboardType="numeric"
                />

                <Text style={gStyles.label}>Total Amount (Rs.)</Text>
                <TextInput 
                  style={gStyles.input} 
                  value={result.totalAmount?.toString() || ''} 
                  onChangeText={(text) => setResult({...result, totalAmount: parseFloat(text) || 0})}
                  keyboardType="numeric"
                />

                <Text style={gStyles.label}>Previous Reading</Text>
                <TextInput 
                  style={gStyles.input} 
                  value={result.previousReading?.toString() || ''} 
                  onChangeText={(text) => setResult({...result, previousReading: parseFloat(text) || 0})}
                  keyboardType="numeric"
                />

                <Text style={gStyles.label}>Current Reading</Text>
                <TextInput 
                  style={gStyles.input} 
                  value={result.currentReading?.toString() || ''} 
                  onChangeText={(text) => setResult({...result, currentReading: parseFloat(text) || 0})}
                  keyboardType="numeric"
                />

                <TouchableOpacity 
                  style={[gStyles.button, { marginTop: 20 }]}
                  onPress={async () => {
                    try {
                      await client.patch(`/api/bills/${result._id}`, {
                        billingMonth: result.billingMonth,
                        accountId: accountId || result.accountId,
                        consumerName: result.consumerName,
                        accountNumber: result.accountNumber,
                        issueDate: result.issueDate,
                        unitsConsumed: result.unitsConsumed,
                        totalAmount: result.totalAmount,
                        previousReading: result.previousReading,
                        currentReading: result.currentReading,
                      });
                      Alert.alert('Saved', 'Bill data confirmed and saved!');
                      navigation.goBack();
                    } catch (err) {
                      Alert.alert('Error', 'Failed to update bill');
                    }
                  }}
                >
                  <Text style={gStyles.buttonText}>Confirm & Save</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'space-between' }}>
                <TouchableOpacity 
                  style={[gStyles.buttonSecondary, { flex: 1, marginRight: 8 }]}
                  onPress={() => setImage(null)}
                >
                  <Text style={gStyles.buttonSecondaryText}>Retake</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[gStyles.button, { flex: 2, marginLeft: 8 }]}
                  onPress={uploadBill}
                >
                  <Text style={gStyles.buttonText}>Confirm & Upload</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
