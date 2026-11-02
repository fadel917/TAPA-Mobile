// src/screens/ProfileScreen.tsx

import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, 
  TouchableOpacity, ActivityIndicator, Image, Alert 
} from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

const ProfileScreen = ({ navigation }: any) => {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const currentUser = auth().currentUser;

  useEffect(() => {
    if (!currentUser) return;

    const subscriber = firestore()
      .collection('users')
      .doc(currentUser.uid)
      .onSnapshot(documentSnapshot => {
        const data = documentSnapshot?.data();
        if (data) {
          setUserData(data);
        }
        setLoading(false);
      }, error => {
        console.error("Firestore Error: ", error);
        setLoading(false);
      });

    return () => subscriber();
  }, [currentUser]);

  const handleLogout = () => {
    Alert.alert("Logout", "Apakah Anda yakin ingin keluar?", [
      { text: "Batal", style: "cancel" },
      { text: "Ya, Keluar", onPress: () => auth().signOut() }
    ]);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6F4E37" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Profil Saya</Text>
      </View>

      <View style={styles.profileCard}>
        <Image 
          source={{ uri: userData?.url_foto_profil || 'https://via.placeholder.com/150' }} 
          style={styles.avatar} 
        />
        <Text style={styles.userName}>{userData?.nama_pengguna || 'Pengguna Baru'}</Text>
        <Text style={styles.userEmail}>{currentUser?.email}</Text>
      </View>

      <View style={styles.menuContainer}>
        <TouchableOpacity 
          style={styles.menuItem} 
          onPress={() => navigation.navigate('Settings')}
        >
          <Text style={styles.menuText}>Pengaturan Akun</Text>
        </TouchableOpacity>

        {/* --- TOMBOL BARU DITAMBAHKAN DI SINI --- */}
        <TouchableOpacity 
          style={styles.menuItem} 
          onPress={() => navigation.navigate('SurveyHistory')}
        >
          <Text style={styles.menuText}>Riwayat Permintaan Survei</Text>
        </TouchableOpacity>
        {/* --------------------------------------- */}
        
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Keluar dari Akun</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFBF5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFBF5' },
  headerContainer: { padding: 20, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#EEE' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#3D405B' },
  profileCard: { alignItems: 'center', padding: 30, backgroundColor: 'white', margin: 20, borderRadius: 20, elevation: 3 },
  avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 15, borderWidth: 3, borderColor: '#6F4E37' },
  userName: { fontSize: 22, fontWeight: 'bold', color: '#3D405B' },
  userEmail: { fontSize: 14, color: 'gray', marginTop: 5 },
  menuContainer: { paddingHorizontal: 20, marginTop: 10 },
  menuItem: { backgroundColor: '#6F4E37', padding: 18, borderRadius: 15, alignItems: 'center', marginBottom: 15 },
  menuText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  logoutButton: { padding: 18, borderRadius: 15, alignItems: 'center', borderWidth: 1, borderColor: '#E74C3C' },
  logoutText: { color: '#E74C3C', fontSize: 16, fontWeight: 'bold' }
});

export default ProfileScreen;