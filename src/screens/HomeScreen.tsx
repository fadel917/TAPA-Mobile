// src/screens/HomeScreen.tsx

import React from 'react';
import { View, Text, StyleSheet, Button, SafeAreaView } from 'react-native';
import auth from '@react-native-firebase/auth';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
// Impor tipe yang benar
import { HomeStackParamList } from '../../App';

// Definisikan tipe Props yang benar
type Props = NativeStackScreenProps<HomeStackParamList, 'Home'>;

const HomeScreen = ({ navigation }: Props) => {
  const handleLogout = () => {
    auth().signOut();
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>TAPA</Text>
      <Text style={styles.subtitle}>Tanah Padang</Text>

      <View style={styles.menuContainer}>
        <View style={styles.buttonWrapper}>
          <Button
            title="Lihat Iklan Tanah"
            onPress={() => navigation.navigate('Kecamatan')}
          />
        </View>
        <View style={styles.buttonWrapper}>
          <Button
            title="Ajukan Permintaan Survei"
            onPress={() => navigation.navigate('SurveyRequest' as any)} // Arahkan ke root stack
          />
        </View>
      </View>

      <View style={styles.logoutButton}>
        <Button title="Logout" onPress={handleLogout} color="#c44" />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#f5f5f5' },
  title: { fontSize: 48, fontWeight: 'bold', textAlign: 'center', color: '#333' },
  subtitle: { fontSize: 18, textAlign: 'center', marginBottom: 60, color: '#666' },
  menuContainer: { marginBottom: 40 },
  buttonWrapper: { marginVertical: 8 },
  logoutButton: { position: 'absolute', bottom: 30, left: 20, right: 20 }
});

export default HomeScreen;