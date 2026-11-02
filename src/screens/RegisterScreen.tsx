import React, { useState } from 'react';
import { View, Text, StyleSheet, Button, TextInput, Alert } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';

// Impor modul auth dari Firebase
import auth from '@react-native-firebase/auth';

type RegisterScreenProps = NativeStackScreenProps<RootStackParamList, 'Register'>;

const RegisterScreen = ({ navigation }: RegisterScreenProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleRegister = async () => {
    // 1. Validasi input
    if (!email || !password || !confirmPassword) {
      Alert.alert('Error', 'Mohon isi semua kolom.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Password dan konfirmasi password tidak cocok.');
      return;
    }

    // 2. Proses pembuatan akun dengan Firebase
    try {
      await auth().createUserWithEmailAndPassword(email, password);
      // Jika berhasil, Firebase akan otomatis login.
      // Listener di App.tsx akan menangani navigasi ke HomeScreen.
      Alert.alert('Sukses!', 'Akun berhasil dibuat. Anda akan diarahkan ke Beranda.');
    } catch (error: any) {
      let errorMessage = 'Terjadi kesalahan.';
      // 3. Menangani error spesifik dari Firebase
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Email ini sudah digunakan oleh akun lain.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Format email tidak valid.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password terlalu lemah. Minimal 6 karakter.';
      }
      Alert.alert('Pendaftaran Gagal', errorMessage);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Buat Akun Baru</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      
      <TextInput
        style={styles.input}
        placeholder="Password (min. 6 karakter)"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TextInput
        style={styles.input}
        placeholder="Konfirmasi Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />

      <View style={styles.buttonContainer}>
        <Button title="Daftar" onPress={handleRegister} />
      </View>

      <Button
        title="Sudah punya akun? Login"
        onPress={() => navigation.navigate('Login')}
      />
    </View>
  );
};

// ... (copy style dari LoginScreen dan sesuaikan jika perlu)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 12,
    paddingHorizontal: 10,
  },
  buttonContainer: {
    marginBottom: 12,
  },
});

export default RegisterScreen;