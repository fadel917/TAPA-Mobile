// src/screens/ChangeUsernameScreen.tsx

import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  Alert, ActivityIndicator, SafeAreaView 
} from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

const ChangeUsernameScreen = ({ navigation }: any) => {
  const [newName, setNewName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveChanges = async () => {
    if (!newName.trim()) {
      Alert.alert('Error', 'Nama pengguna tidak boleh kosong.');
      return;
    }

    const currentUser = auth().currentUser;
    if (!currentUser) return;

    setIsSaving(true);
    try {
      // =========================================================
      // JURUS PAMUNGKAS: Gunakan set() dengan { merge: true }
      // =========================================================
      await firestore()
        .collection('users')
        .doc(currentUser.uid)
        .set({ nama_pengguna: newName }, { merge: true });

      Alert.alert('Sukses', 'Nama pengguna berhasil diperbarui!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error("Error updating username: ", error);
      Alert.alert('Error', 'Gagal menyimpan perubahan.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.label}>Ubah Nama Pengguna</Text>
      <TextInput
        style={styles.input}
        value={newName}
        onChangeText={setNewName}
        placeholder="Masukkan nama baru..."
        placeholderTextColor="#999"
      />
      <TouchableOpacity
        style={styles.button}
        onPress={handleSaveChanges}
        disabled={isSaving}
      >
        {isSaving ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.buttonText}>SIMPAN PERUBAHAN</Text>
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFBF5', padding: 20 },
  label: { fontSize: 16, fontWeight: 'bold', color: '#3D405B', marginBottom: 10, marginTop: 20 },
  input: { 
    backgroundColor: 'white', 
    borderWidth: 1, 
    borderColor: '#EAE0D5', 
    borderRadius: 8, 
    padding: 15, 
    fontSize: 16, 
    marginBottom: 20,
    color: '#000'
  },
  button: { backgroundColor: '#6F4E37', padding: 15, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' }
});

export default ChangeUsernameScreen;