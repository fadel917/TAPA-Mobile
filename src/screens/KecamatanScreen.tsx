// src/screens/KecamatanScreen.tsx

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, SafeAreaView, Button } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';

const kecamatanList = [
  "Bungus Teluk Kabung", "Koto Tangah", "Kuranji", "Lubuk Begalung",
  "Lubuk Kilangan", "Nanggalo", "Padang Barat", "Padang Selatan",
  "Padang Timur", "Padang Utara", "Pauh"
];

const KecamatanScreen = () => {
  // Gunakan useNavigation untuk mendapatkan akses ke navigator utama/induk
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Button
          onPress={() => navigation.navigate('Favorites')}
          title="Favorit"
          color="#6F4E37" 
        />
      ),
    });
  }, [navigation]);

  const handleSelectKecamatan = (kecamatan: string) => {
    // Navigasi ke AdListScreen dari navigator induk (HomeStack)
    // Kita beritahu TypeScript untuk percaya pada kita dengan 'as any' karena kompleksitas tipe
    navigation.navigate('AdListScreen' as any, { kecamatan: kecamatan });
  };

  return (
    <SafeAreaView style={styles.container}> 
      <Image
        source={require('../assets/images/map_padang.png')}
        style={styles.mapImage}
        resizeMode="contain"
      />
      <Text style={styles.title}>Pilih Kecamatan</Text>
      <FlatList
        data={kecamatanList}
        keyExtractor={(item) => item}
        numColumns={2}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.button}
            onPress={() => handleSelectKecamatan(item)}
          >
            <Text style={styles.buttonText}>{item}</Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContainer}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFBF5' },
  mapImage: { width: '80%', height: 300, alignSelf: 'center', marginTop: 20, marginBottom: 25 },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20, color: '#3D405B' },
  listContainer: { paddingHorizontal: 10 },
  button: { flex: 1, backgroundColor: '#3D405B', borderRadius: 20, paddingVertical: 15, paddingHorizontal: 10, margin: 8, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: 'white', fontSize: 14, fontWeight: '600', textAlign: 'center' },
});

export default KecamatanScreen;