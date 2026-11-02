// src/screens/Model3DScreen.tsx

import React from 'react';
import { SafeAreaView, StyleSheet, ActivityIndicator, View, Text } from 'react-native';
import { WebView } from 'react-native-webview';

// Menggunakan 'any' agar tidak perlu repot setting tipe navigasi di App.tsx
const Model3DScreen = ({ route }: any) => {
  // Menangkap URL dinamis yang dikirimkan dari AdDetailScreen
  const { url3d } = route.params || {};

  // Jika entah bagaimana layarnya terbuka tanpa URL, tampilkan pesan aman
  if (!url3d) {
    return (
      <SafeAreaView style={styles.centeredContainer}>
        <Text style={styles.errorText}>Data 3D tidak ditemukan.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <WebView
        source={{ uri: url3d }}
        style={styles.webview}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loaderContainer}>
            <ActivityIndicator color="#6F4E37" size="large" />
          </View>
        )}
        javaScriptEnabled={true}
        domStorageEnabled={true}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  centeredContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFBF5' },
  webview: { flex: 1, backgroundColor: 'transparent' },
  errorText: { color: '#3D405B', fontSize: 16, fontWeight: 'bold' },
  loaderContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFBF5'
  }
});

export default Model3DScreen;