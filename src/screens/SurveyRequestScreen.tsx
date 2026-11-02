// src/screens/SurveyRequestScreen.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { useNavigation } from '@react-navigation/native';

const SurveyRequestScreen = () => {
  const navigation = useNavigation();
  const currentUser = auth().currentUser;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [namaPemohon, setNamaPemohon] = useState(currentUser?.displayName || '');
  const [emailPemohon, setEmailPemohon] = useState(currentUser?.email || '');
  const [nomorTelepon, setNomorTelepon] = useState(currentUser?.phoneNumber || '');
  const [alamatTanah, setAlamatTanah] = useState('');
  const [kecamatan, setKecamatan] = useState('');
  const [deskripsi, setDeskripsi] = useState('');

  const handleSubmit = async () => {
    if (!namaPemohon || !emailPemohon || !nomorTelepon || !alamatTanah || !kecamatan) {
      Alert.alert('Error', 'Mohon isi semua kolom yang wajib diisi.');
      return;
    }
    if (!currentUser) {
        Alert.alert('Error', 'Anda harus login untuk mengirim permintaan.');
        return;
    }

    setIsSubmitting(true);

    try {
      // PERBAIKAN: Menyamakan nama field dengan SurveyHistoryScreen dan Admin Panel
      const requestData = {
        nama_pemohon: namaPemohon,
        email_pemohon: emailPemohon,
        nomor_telepon_pemohon: nomorTelepon,
        alamat_tanah: alamatTanah,
        kecamatan: kecamatan,
        pesan: deskripsi, // <--- Diubah dari 'deskripsi_singkat_tanah' agar muncul di Riwayat
        id_pengguna: currentUser.uid, // <--- Diubah dari 'id_pemohon' agar filter .where() jalan
        status_permintaan: 'Diajukan',
        tanggal_permintaan: firestore.FieldValue.serverTimestamp(),
      };

      await firestore().collection('surveyRequests').add(requestData);

      Alert.alert('Sukses', 'Permintaan survei Anda telah berhasil dikirim.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);

    } catch (error) {
      console.error("Error submitting survey request: ", error);
      Alert.alert('Error', 'Terjadi kesalahan saat mengirim permintaan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>Formulir Permintaan Survei</Text>
        <Text style={styles.subtitle}>
          Isi detail di bawah ini untuk mengajukan permintaan survei lokasi tanah Anda.
        </Text>

        <TextInput style={styles.input} placeholder="Nama Lengkap Pemohon" value={namaPemohon} onChangeText={setNamaPemohon} />
        <TextInput style={styles.input} placeholder="Email" value={emailPemohon} onChangeText={setEmailPemohon} keyboardType="email-address" />
        <TextInput style={styles.input} placeholder="Nomor Telepon/HP" value={nomorTelepon} onChangeText={setNomorTelepon} keyboardType="phone-pad" />
        <TextInput style={styles.input} placeholder="Alamat Tanah yang Diajukan" value={alamatTanah} onChangeText={setAlamatTanah} />
        <TextInput style={styles.input} placeholder="Kecamatan Lokasi Tanah" value={kecamatan} onChangeText={setKecamatan} />
        <TextInput style={[styles.input, styles.textArea]} placeholder="Deskripsi Singkat Tanah..." value={deskripsi} onChangeText={setDeskripsi} multiline numberOfLines={4} />

        {isSubmitting ? (
          <ActivityIndicator size="large" color="#6F4E37" />
        ) : (
          <TouchableOpacity 
            style={styles.submitButton} 
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <Text style={styles.submitButtonText}>Kirim Permintaan</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFBF5' },
  scrollContainer: { padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 10, color: '#3D405B' },
  subtitle: { fontSize: 14, textAlign: 'center', marginBottom: 30, color: '#5C544A' },
  input: { backgroundColor: 'white', borderWidth: 1, borderColor: '#EAE0D5', borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 15, color: '#000' },
  textArea: { height: 100, textAlignVertical: 'top' },
  submitButton: { backgroundColor: '#6F4E37', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  submitButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' }
});

export default SurveyRequestScreen;