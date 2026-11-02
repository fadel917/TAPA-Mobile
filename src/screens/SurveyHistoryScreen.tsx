// src/screens/SurveyHistoryScreen.tsx

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, ActivityIndicator } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

const SurveyHistoryScreen = () => {
  const [surveys, setSurveys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const currentUser = auth().currentUser;

  useEffect(() => {
    if (!currentUser) return;

    // Menarik data survei khusus untuk user yang sedang login
    const subscriber = firestore()
      .collection('surveyRequests')
      // Catatan: Pastikan saat membuat request survei, Anda menyimpan field 'id_pengguna'
      .where('id_pengguna', '==', currentUser.uid) 
      .onSnapshot(querySnapshot => {
        const history: any[] = [];
        if (querySnapshot) {
          querySnapshot.forEach(documentSnapshot => {
            history.push({
              id: documentSnapshot.id,
              ...documentSnapshot.data(),
            });
          });
        }
        
        // Urutkan dari yang terbaru (opsional, karena Firestore butuh index jika di-orderBy langsung)
        history.sort((a, b) => {
          const dateA = a.tanggal_permintaan?.seconds || 0;
          const dateB = b.tanggal_permintaan?.seconds || 0;
          return dateB - dateA;
        });

        setSurveys(history);
        setLoading(false);
      }, error => {
        console.error("Gagal mengambil riwayat survei: ", error);
        setLoading(false);
      });

    return () => subscriber();
  }, [currentUser]);

  const renderStatus = (status: string) => {
    let bgColor = '#F39C12'; // Default: Orange (Menunggu)
    if (status === 'Disetujui') bgColor = '#27AE60'; // Hijau
    if (status === 'Ditolak') bgColor = '#E74C3C'; // Merah

    return (
      <View style={[styles.statusBadge, { backgroundColor: bgColor }]}>
        <Text style={styles.statusText}>{status || 'Menunggu'}</Text>
      </View>
    );
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
      {surveys.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Belum ada riwayat permintaan survei.</Text>
        </View>
      ) : (
        <FlatList
          data={surveys}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => {
            const date = item.tanggal_permintaan 
              ? new Date(item.tanggal_permintaan.seconds * 1000).toLocaleDateString('id-ID') 
              : 'Tanggal tidak diketahui';

            return (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.dateText}>{date}</Text>
                  {renderStatus(item.status_permintaan)}
                </View>
                <Text style={styles.propertyText}>{item.alamat_tanah || 'Alamat tidak tersedia'}</Text>
                <Text style={styles.messageText}>Pesan Anda: "{item.pesan || '-'}"</Text>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFBF5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFBF5' },
  listContainer: { padding: 20 },
  card: { backgroundColor: 'white', padding: 20, borderRadius: 15, marginBottom: 15, elevation: 3 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  dateText: { fontSize: 14, color: '#95A5A6', fontWeight: 'bold' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  statusText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  propertyText: { fontSize: 16, fontWeight: 'bold', color: '#3D405B', marginBottom: 5 },
  messageText: { fontSize: 14, color: '#7F8C8D', fontStyle: 'italic' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyText: { fontSize: 16, color: '#7F8C8D', textAlign: 'center' }
});

export default SurveyHistoryScreen;