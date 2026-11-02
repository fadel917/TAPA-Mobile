// src/screens/LoginScreen.tsx

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Button, TextInput, Alert, SafeAreaView, TouchableOpacity, ActivityIndicator } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import Icon from 'react-native-vector-icons/Ionicons';

type LoginScreenProps = NativeStackScreenProps<RootStackParamList, 'Login'>;

const LoginScreen = ({ navigation }: LoginScreenProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: '818067258779-b5or24sdpcf3eo98b1jj6coi74ie5fn8.apps.googleusercontent.com', 
      offlineAccess: true,
    });
  }, []);

  const onGoogleButtonPress = async () => {
    setLoading(true);
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      
      const response = await GoogleSignin.signIn();

      if (response.type === 'success' && response.data) {
        const { idToken, user } = response.data;

        if (!idToken) throw new Error("ID Token tidak ditemukan");

        // 1. Login ke Firebase Authentication
        const googleCredential = auth.GoogleAuthProvider.credential(idToken);
        const userCredential = await auth().signInWithCredential(googleCredential);

        // 2. Sinkronisasi data ke Firestore Database
        const userDocRef = firestore().collection('users').doc(userCredential.user.uid);
        const userDoc = await userDocRef.get();

        if (!userDoc.exists) {
          await userDocRef.set({
            nama_pengguna: user.name || 'Pengguna Baru',
            alamat_email: user.email,
            url_foto_profil: user.photo,
            pengaturan_notifikasi: true,
            pengaturan_visibilitas_kontak: true,
            pengaturan_data_lokasi: true,
            tanggal_pendaftaran: firestore.FieldValue.serverTimestamp(),
          });
        }
      } else {
        throw new Error("Login dibatalkan atau gagal.");
      }
    } catch (error: any) {
      console.log("Detail Error: ", error);
      if (error.code !== '12501') { 
        // PERBAIKAN: Tampilkan pesan error asli di popup
        Alert.alert(
          'Gagal (Detail Error)', 
          `Kode: ${error.code || 'Tidak ada kode'}\nPesan: ${error.message || error}`
        );
      }
    } finally {
      setLoading(false);
    }
  }

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Mohon isi email dan password.');
      return;
    }
    setLoading(true);
    try {
      await auth().signInWithEmailAndPassword(email, password);
    } catch (error: any) {
      let msg = 'Gagal masuk.';
      if (error.code === 'auth/user-not-found') msg = 'Email tidak terdaftar.';
      else if (error.code === 'auth/wrong-password') msg = 'Password salah.';
      Alert.alert('Login Gagal', msg);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={{flex: 1, justifyContent: 'center', backgroundColor: '#FFFBF5'}}>
        <ActivityIndicator size="large" color="#6F4E37" />
        <Text style={{textAlign: 'center', marginTop: 10}}>Sedang memproses...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>TAPA</Text>
      
      <TouchableOpacity style={styles.googleButton} onPress={onGoogleButtonPress}>
        <Icon name="logo-google" size={24} color="white" />
        <Text style={styles.googleButtonText}>Masuk dengan Google</Text>
      </TouchableOpacity>

      <Text style={styles.separator}>atau masuk dengan email</Text>

      <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
      
      <View style={styles.buttonContainer}>
        <Button title="Login" onPress={handleLogin} color="#6F4E37" />
      </View>
      
      <Button
        title="Belum punya akun? Daftar di sini"
        onPress={() => navigation.navigate('Register')}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#FFFBF5' },
  title: { fontSize: 36, fontWeight: 'bold', textAlign: 'center', marginBottom: 40, color: '#3D405B' },
  googleButton: { flexDirection: 'row', backgroundColor: '#4285F4', padding: 15, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 25, elevation: 3 },
  googleButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold', marginLeft: 15 },
  separator: { textAlign: 'center', color: 'gray', marginBottom: 20 },
  input: { height: 50, backgroundColor: 'white', borderColor: '#EAE0D5', borderWidth: 1, borderRadius: 10, marginBottom: 15, paddingHorizontal: 15 },
  buttonContainer: { marginBottom: 15 },
});

export default LoginScreen;