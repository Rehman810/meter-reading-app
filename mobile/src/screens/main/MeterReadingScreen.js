import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, Image, Alert, ActivityIndicator, ScrollView, TextInput } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import client from '../../api/client';
import { useTheme } from '../../context/ThemeContext';
import { globalStyles } from '../../styles/theme';
import { Camera, AlertTriangle, UploadCloud } from 'lucide-react-native';

export default function MeterReadingScreen({ route, navigation }) {
  const { colors } = useTheme();
  const gStyles = useMemo(() => globalStyles(colors), [colors]);
  const { accountId } = route.params || {};
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [editedReading, setEditedReading] = useState('');
  const [saving, setSaving] = useState(false);

  const pickImage = async (useCamera = true) => {
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

    let res = await (useCamera 
      ? ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
        })
      : ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
        })
    );

    if (!res.canceled) {
      const asset = res.assets[0];
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
      setResult(null);
    }
  };

  const uploadReading = async () => {
    if (!image) return;

    setLoading(true);
    const formData = new FormData();
    if (accountId) {
      formData.append('accountId', accountId);
    }
    formData.append('image', {
      uri: image.uri,
      name: 'reading.jpg',
      type: 'image/jpeg',
    });

    try {
      const response = await client.post('/api/meter-readings/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(response.data);
      setEditedReading(response.data.reading.toString());
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
            <Text style={[gStyles.title, { textAlign: 'center', marginBottom: 20 }]}>Take a Meter Reading</Text>
            <Text style={[gStyles.subtitle, { textAlign: 'center', marginBottom: 30 }]}>
              Capture a clear photo of your electricity meter to track your current usage.
            </Text>
            <TouchableOpacity 
              style={[gStyles.button, { paddingVertical: 20, marginBottom: 16 }]}
              onPress={() => pickImage(true)}
            >
              <Camera color="#fff" size={24} style={{ marginBottom: 8 }} />
              <Text style={gStyles.buttonText}>Open Camera</Text>
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
                <Text style={{ marginTop: 10, color: colors.textLight }}>Reading meter digits...</Text>
              </View>
            ) : result ? (
              <View style={[gStyles.card, { width: '100%' }]}>
                <Text style={[gStyles.title, { fontSize: 20, textAlign: 'center', marginBottom: 8 }]}>Extracted Reading</Text>
                <Text style={{ textAlign: 'center', color: colors.textLight, marginBottom: 12 }}>Tap the number below to edit if incorrect.</Text>
                
                <TextInput
                  style={[gStyles.largeNumber, { textAlign: 'center', marginVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 8 }]}
                  value={editedReading}
                  onChangeText={setEditedReading}
                  keyboardType="numeric"
                />

                {result.confidence === 'low' && (
                  <View style={{ flexDirection: 'row', backgroundColor: colors.dangerLight, padding: 12, borderRadius: 8, marginVertical: 12 }}>
                    <AlertTriangle color={colors.danger} size={20} style={{ marginRight: 8 }} />
                    <Text style={{ color: colors.danger, flex: 1, fontSize: 14 }}>
                      This reading might be inaccurate. Please retake the photo in better light.
                    </Text>
                  </View>
                )}

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }}>
                  <TouchableOpacity 
                    style={[gStyles.buttonSecondary, { flex: 1, marginRight: 8 }]}
                    onPress={() => setImage(null)}
                  >
                    <Text style={gStyles.buttonSecondaryText}>Retake</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[gStyles.button, { flex: 1, marginLeft: 8 }]}
                    onPress={async () => {
                      if (editedReading !== result.reading.toString()) {
                        setSaving(true);
                        try {
                          await client.put(`/api/meter-readings/${result._id}`, { reading: editedReading });
                        } catch (err) {
                          Alert.alert('Error', 'Failed to update reading');
                          setSaving(false);
                          return;
                        }
                      }
                      navigation.goBack();
                    }}
                    disabled={saving}
                  >
                    {saving ? <ActivityIndicator color="#fff" /> : <Text style={gStyles.buttonText}>Done</Text>}
                  </TouchableOpacity>
                </View>
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
                  onPress={uploadReading}
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
