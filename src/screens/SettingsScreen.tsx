// src/screens/SettingsScreen.tsx

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView,
  TouchableOpacity, Switch, Alert, ActivityIndicator
} from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { launchImageLibrary } from 'react-native-image-picker';

const SettingsScreen = ({ navigation }: any) => {
  const currentUser = auth().currentUser;
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  
  // SEMUA STATE TOGGLE DIBERSIHKAN
  const [notifikasi, setNotifikasi] = useState(false);
  const [visibilitasKontak, setVisibilitasKontak] = useState(false);
  const [dataLokasi, setDataLokasi] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    const userRef = firestore().collection('users').doc(currentUser.uid);
    const unsubscribe = userRef.onSnapshot(doc => {
      const data = doc?.data();
      if (data) {
        setUserData(data);
        setNotifikasi(data.pengaturan_notifikasi || false);
        setVisibilitasKontak(data.pengaturan_visibilitas_kontak || false);
        setDataLokasi(data.pengaturan_data_lokasi || false);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [currentUser]);

  const handlePickImage = async () => {
    if (!currentUser) return;
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.6,
      includeBase64: true, 
    });

    if (result.didCancel || !result.assets || result.assets.length === 0) return;
    const base64Image = result.assets[0].base64;
    setIsUploading(true);

    try {
      const IMGBB_API_KEY = '7cb45a2826e8d20b2cb1183b9831aae4'; 
      const formData = new FormData();
      formData.append('image', base64Image);

      const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
        method: 'POST',
        body: formData,
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const jsonResponse = await response.json();
      if (jsonResponse.success) {
        const downloadURL = jsonResponse.data.url;
        await firestore().collection('users').doc(currentUser.uid).set({ url_foto_profil: downloadURL }, { merge: true });
        Alert.alert('Sukses', 'Foto profil Anda berhasil diperbarui!');
      } else {
        throw new Error('Gagal upload');
      }
    } catch (error) {
      Alert.alert('Error', 'Gagal memperbarui foto.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleToggleChange = async (type: string, value: boolean) => {
    if (!currentUser) return;
    let fieldToUpdate = {};
    
    if (type === 'notifikasi') { setNotifikasi(value); fieldToUpdate = { pengaturan_notifikasi: value }; }
    else if (type === 'visibilitas') { setVisibilitasKontak(value); fieldToUpdate = { pengaturan_visibilitas_kontak: value }; }
    else if (type === 'lokasi') { setDataLokasi(value); fieldToUpdate = { pengaturan_data_lokasi: value }; }

    try {
        await firestore().collection('users').doc(currentUser.uid).set(fieldToUpdate, { merge: true });
    } catch (error) {
        Alert.alert('Error', 'Gagal menyimpan pengaturan.');
    }
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Apakah Anda yakin ingin keluar?", [
      { text: "Batal", style: "cancel" },
      { text: "Ya, Keluar", onPress: () => auth().signOut() }
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Hapus Akun",
      "Apakah Anda yakin? Data profil Anda akan dihapus permanen.",
      [
        { text: "Batal", style: "cancel" },
        { 
          text: "Ya, Hapus", 
          style: "destructive", 
          onPress: async () => {
            setIsUploading(true);
            try {
              const uid = currentUser?.uid;
              await firestore().collection('users').doc(uid).delete();
              await auth().currentUser?.delete();
              Alert.alert("Berhasil", "Akun Anda telah dihapus.");
            } catch (error: any) {
              if (error.code === 'auth/requires-recent-login') {
                Alert.alert("Keamanan", "Silakan logout dan login kembali untuk menghapus akun.");
              } else {
                Alert.alert("Error", "Gagal menghapus akun.");
              }
            } finally { setIsUploading(false); }
          } 
        }
      ]
    );
  };
  
  if (loading) return <ActivityIndicator size="large" color="#6F4E37" style={{flex: 1, backgroundColor: '#FFFBF5'}} />;

  return (
    <SafeAreaView style={styles.container}>
      {isUploading && (
        <View style={styles.uploadOverlay}>
          <ActivityIndicator size="large" color="#6F4E37" />
          <Text style={styles.uploadText}>Memproses...</Text>
        </View>
      )}

      <View style={styles.header}>
        <Text style={styles.headerTitle}>{userData?.nama_pengguna || 'Pengguna TAPA'}</Text>
        <Text style={styles.headerSubtitle}>{currentUser?.email}</Text>
      </View>

      <View style={styles.menuContainer}>
        <TouchableOpacity style={styles.menuButton} onPress={() => navigation.navigate('ChangeUsername')}>
          <Text style={styles.buttonText}>Ubah Nama Pengguna</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuButton} onPress={handlePickImage} disabled={isUploading}>
          <Text style={styles.buttonText}>Ubah Foto Profil</Text>
        </TouchableOpacity>
        
        {/* SEMUA TOGGLE DIBALIKKAN LAGI BOSKU */}
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Notifikasi</Text>
          <Switch trackColor={{ false: "#767577", true: "#6F4E37" }} thumbColor={"#f4f3f4"} onValueChange={(value) => handleToggleChange('notifikasi', value)} value={notifikasi} />
        </View>

        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Visibilitas kontak</Text>
          <Switch trackColor={{ false: "#767577", true: "#6F4E37" }} thumbColor={"#f4f3f4"} onValueChange={(value) => handleToggleChange('visibilitas', value)} value={visibilitasKontak} />
        </View>

        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Data Lokasi</Text>
          <Switch trackColor={{ false: "#767577", true: "#6F4E37" }} thumbColor={"#f4f3f4"} onValueChange={(value) => handleToggleChange('lokasi', value)} value={dataLokasi} />
        </View>

        <TouchableOpacity style={[styles.menuButton, { marginTop: 20 }]} onPress={handleLogout}>
          <Text style={styles.buttonText}>Keluar dari Akun</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuButtonDanger} onPress={handleDeleteAccount} disabled={isUploading}>
          <Text style={styles.buttonTextDanger}>Hapus Akun Permanen</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFBF5', paddingTop: 10 },
  header: { alignItems: 'center', marginBottom: 30, marginTop: 20 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#3D405B' },
  headerSubtitle: { fontSize: 16, color: 'gray', marginTop: 5 },
  menuContainer: { paddingHorizontal: 20, width: '100%' },
  menuButton: { backgroundColor: '#6F4E37', padding: 15, borderRadius: 15, alignItems: 'center', marginBottom: 15 },
  buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 15, marginBottom: 15, elevation: 2 },
  toggleLabel: { fontSize: 16, color: '#3D405B', fontWeight: '500' },
  menuButtonDanger: { padding: 15, borderRadius: 15, alignItems: 'center', marginTop: 10, borderWidth: 1, borderColor: '#E74C3C' },
  buttonTextDanger: { color: '#E74C3C', fontSize: 16, fontWeight: 'bold' },
  uploadOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255, 255, 255, 0.8)', zIndex: 10, justifyContent: 'center', alignItems: 'center' },
  uploadText: { marginTop: 10, color: '#6F4E37', fontWeight: 'bold' }
});

export default SettingsScreen;