import React, { useMemo } from 'react';
import { View, StyleSheet, Image, Dimensions, ScrollView, Platform, Linking, TouchableOpacity, Text } from 'react-native';
// Assuming react-native-pdf is installed or WebView can be used
import { WebView } from 'react-native-webview';
import { useTheme } from '../../context/ThemeContext';
import { globalStyles } from '../../styles/theme';
import { FileDown, FileText } from 'lucide-react-native';

export default function BillViewerScreen({ route }) {
  const { colors } = useTheme();
  const gStyles = useMemo(() => globalStyles(colors), [colors]);
  const styles = useMemo(() => createStyles(colors), [colors]);

  const { billUrl, isPdf } = route.params;

  // Resolve URL using environment variable
  const baseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:5000';
  const fullUrl = billUrl.startsWith('http') ? billUrl : `${baseUrl}${billUrl.startsWith('/') ? '' : '/'}${billUrl}`;

  const isLocal = fullUrl.includes('localhost') || fullUrl.includes('10.0.2.2') || fullUrl.includes('192.168');
  const showAndroidLocalWarning = isPdf && Platform.OS === 'android' && isLocal;

  const handleDownload = () => {
    Linking.openURL(fullUrl).catch(() => alert('Could not open download link'));
  };

  return (
    <View style={styles.container}>
      {showAndroidLocalWarning ? (
        <View style={styles.fallbackContainer}>
          <FileText size={64} color={colors.primary} style={{ marginBottom: 24 }} />
          <Text style={[gStyles.title, { textAlign: 'center', marginBottom: 16 }]}>Local PDF Preview</Text>
          <Text style={{ textAlign: 'center', color: colors.textLight, marginBottom: 32, paddingHorizontal: 32 }}>
            Google Docs Viewer cannot preview PDFs from local development servers (e.g. localhost or 192.168.x.x). 
            Please download the PDF to view it on your device.
          </Text>
          <TouchableOpacity style={styles.downloadButton} onPress={handleDownload}>
            <FileDown color="#fff" size={20} style={{ marginRight: 8 }} />
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Download PDF</Text>
          </TouchableOpacity>
        </View>
      ) : isPdf ? (
        <WebView 
          source={{ uri: Platform.OS === 'android' ? `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(fullUrl)}` : fullUrl }} 
          style={{ flex: 1 }} 
          scalesPageToFit={true}
        />
      ) : (
        <ScrollView 
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}
          maximumZoomScale={3}
          minimumZoomScale={1}
          bouncesZoom={true}
        >
          <Image 
            source={{ uri: fullUrl }} 
            style={styles.image} 
            resizeMode="contain" 
          />
        </ScrollView>
      )}
    </View>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  image: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  downloadButton: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  }
});
