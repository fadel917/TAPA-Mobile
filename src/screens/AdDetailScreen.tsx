// src/screens/AdDetailScreen.tsx

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ActivityIndicator,
  Image, ScrollView, FlatList, Dimensions, TouchableOpacity, Alert,
  Linking, Share, Modal, TextInput
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { Property } from '../types/data';
import Icon from 'react-native-vector-icons/Ionicons';
import ImageViewer from 'react-native-image-zoom-viewer';
import PropertyCard from '../components/PropertyCard'; // <--- Tambah import ini

type Props = NativeStackScreenProps<RootStackParamList, 'AdDetailScreen'>;
const { width } = Dimensions.get('window');

const formatCurrency = (value: number) => {
  if (!value) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', minimumFractionDigits: 0,
  }).format(value);
};

const DetailRow = ({ label, value }: { label: string; value: string | number | undefined }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value || 'N/A'}</Text>
  </View>
);

const AdDetailScreen = ({ route, navigation }: Props) => {
  // =========================================================
  // 1. DEKLARASI SEMUA HOOK DI PALING ATAS (WAJIB!)
  // =========================================================
  const { propertyId } = route.params;
  const [loading, setLoading] = useState(true);
  const [property, setProperty] = useState<Property | null>(null);
  const [relatedProperties, setRelatedProperties] = useState<Property[]>([]); // Fitur 6
  const [activeIndex, setActiveIndex] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isProcessingLike, setIsProcessingLike] = useState(false);
  const [isZoomVisible, setIsZoomVisible] = useState(false);

  // State KPR
  const [dp, setDp] = useState('0');
  const [bunga, setBunga] = useState('10');
  const [tenor, setTenor] = useState('10');
  const [cicilanPerBulan, setCicilanPerBulan] = useState(0);

  const flatListRef = useRef<FlatList>(null);
  const currentUser = auth().currentUser;

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) setActiveIndex(viewableItems[0].index);
  }).current;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;

  // Effect: Pantau Favorit
  useEffect(() => {
    if (!currentUser) return;
    const favoriteRef = firestore().collection('users').doc(currentUser.uid).collection('favorites').doc(propertyId);
    const unsubscribe = favoriteRef.onSnapshot(snapshot => {
      setIsFavorited(snapshot.exists);
    });
    return () => unsubscribe();
  }, [currentUser, propertyId]);

  // Effect: Ambil Data Utama & Iklan Serupa
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        // Ambil Data Iklan Utama
        const doc = await firestore().collection('properties').doc(propertyId).get();
        const data = doc.data() as Omit<Property, 'id'> | undefined;
        
        if (data) {
          setProperty({ id: doc.id, ...data });
          setDp((data.harga * 0.2).toString());
          navigation.setOptions({ 
            title: data.judul_iklan,
            headerRight: () => (
              <TouchableOpacity onPress={() => handleShare(data.judul_iklan)} style={{marginRight: 15}}>
                <Icon name="share-social-outline" size={24} color="#6F4E37" />
              </TouchableOpacity>
            )
          });

          // FITUR 6: Ambil 4 Iklan Serupa di Kecamatan yang sama
          const relatedQuery = await firestore()
            .collection('properties')
            .where('kecamatan', '==', data.kecamatan)
            .limit(5)
            .get();
          
          const list: Property[] = [];
          relatedQuery.forEach(rDoc => {
            if (rDoc.id !== propertyId) list.push({ id: rDoc.id, ...rDoc.data() } as Property);
          });
          setRelatedProperties(list);
        }
      } catch (error) { console.error(error); }
      finally { setLoading(false); }
    };
    fetchAllData();
  }, [propertyId, navigation]);

  // Effect: Hitung KPR
  useEffect(() => {
    if (!property) return;
    const pinjaman = property.harga - (parseInt(dp) || 0);
    const bungaPerBulan = (parseFloat(bunga) / 100) / 12;
    const totalBulan = parseInt(tenor) * 12;

    if (pinjaman > 0 && totalBulan > 0) {
      if (bungaPerBulan > 0) {
        const hitung = (pinjaman * bungaPerBulan) / (1 - Math.pow(1 + bungaPerBulan, -totalBulan));
        setCicilanPerBulan(Math.round(hitung));
      } else {
        setCicilanPerBulan(Math.round(pinjaman / totalBulan));
      }
    } else { setCicilanPerBulan(0); }
  }, [dp, bunga, tenor, property]);

  // HANDLERS
  const handleWhatsApp = () => {
    if (!property) return;
    const url = `whatsapp://send?phone=6281267654466&text=${encodeURIComponent(`Halo Admin TAPA, saya tertarik: *${property.judul_iklan}*`)}`;
    Linking.openURL(url);
  };

  const handleOpenMaps = () => {
    if (!property) return;
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${property.koordinat_latitude},${property.koordinat_longitude}`);
  };

  const handleShare = async (judul?: string) => {
    try {
      await Share.share({ message: `Cek tanah ini: ${judul || property?.judul_iklan} di TAPA!` });
    } catch (e) { console.error(e); }
  };

  const handleFavoriteToggle = async () => {
    if (!currentUser || isProcessingLike) return;
    setIsProcessingLike(true);
    const userFavRef = firestore().collection('users').doc(currentUser.uid).collection('favorites').doc(propertyId);
    const propRef = firestore().collection('properties').doc(propertyId);
    try {
      await firestore().runTransaction(async t => {
        if (isFavorited) {
          t.delete(userFavRef);
          t.update(propRef, { jumlah_disimpan_favorit: firestore.FieldValue.increment(-1) });
        } else {
          t.set(userFavRef, { id_tanah: propertyId, id_pengguna: currentUser.uid, tanggal_favorit: firestore.FieldValue.serverTimestamp() });
          t.update(propRef, { jumlah_disimpan_favorit: firestore.FieldValue.increment(1) });
        }
      });
    } catch (e) { Alert.alert("Error", "Gagal favorit."); }
    finally { setIsProcessingLike(false); }
  };

  const zoomImages = property?.url_foto?.map(url => ({ url })) || [];

  // =========================================================
  // 2. RENDER UTAMA (HANYA SATU RETURN)
  // =========================================================
  return (
    <SafeAreaView style={styles.container}>
      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#6F4E37" /><Text style={{marginTop:10}}>Memuat Iklan...</Text></View>
      ) : !property ? (
        <View style={styles.center}><Text>Data tidak ditemukan.</Text></View>
      ) : (
        <>
          {/* Modal Zoom */}
          <Modal visible={isZoomVisible} transparent={true} onRequestClose={() => setIsZoomVisible(false)}>
            <ImageViewer imageUrls={zoomImages} index={activeIndex} onSwipeDown={() => setIsZoomVisible(false)} enableSwipeDown={true}
              renderHeader={() => (
                <TouchableOpacity style={styles.closeZoom} onPress={() => setIsZoomVisible(false)}><Icon name="close" size={30} color="white" /></TouchableOpacity>
              )}
            />
          </Modal>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Carousel Gambar */}
            <FlatList ref={flatListRef} data={property.url_foto} keyExtractor={(item, index) => `${item}-${index}`}
              horizontal pagingEnabled showsHorizontalScrollIndicator={false}
              onViewableItemsChanged={onViewableItemsChanged} viewabilityConfig={viewabilityConfig}
              renderItem={({ item }) => (
                <TouchableOpacity activeOpacity={0.9} onPress={() => setIsZoomVisible(true)}>
                  <Image source={{ uri: item }} style={styles.carouselImage} />
                </TouchableOpacity>
              )}
            />
            <View style={styles.pagination}>
              {property.url_foto.map((_, index) => (
                <View key={index} style={[styles.dot, activeIndex === index ? styles.dotActive : {}]} />
              ))}
            </View>

            <View style={styles.contentContainer}>
              <Text style={styles.priceText}>{formatCurrency(property.harga)}</Text>
              <Text style={styles.titleText}>{property.judul_iklan}</Text>
              
              <View style={styles.mainDetailCard}>
                <View style={styles.detailIconRow}><Icon name="expand-outline" size={20} color="#6F4E37" /><Text style={styles.detailIconText}>{property.luas_tanah} m²</Text></View>
                <View style={[styles.detailIconRow, {marginLeft: 20}]}><Icon name="location-outline" size={20} color="#6F4E37" /><Text style={styles.detailIconText}>{property.kecamatan}</Text></View>
              </View>

              <View style={styles.divider} />
              <Text style={styles.sectionTitle}>Informasi Lengkap Properti</Text>
              
              {/* INFO LENGKAP TETAP ADA SEMUA BOSKU! */}
              <DetailRow label="Luas Tanah" value={`${property.luas_tanah} m²`} />
              <DetailRow label="Harga" value={formatCurrency(property.harga)} />
              <DetailRow label="Harga/meter" value={formatCurrency(property.harga_per_meter || 0)} />
              <DetailRow label="Alamat" value={property.alamat_lengkap} />
              <DetailRow label="Harga Pajak Tanah" value={formatCurrency(property.harga_pajak_tanah || 0)} />
              <DetailRow label="Status Pajak Tanah" value={property.status_pajak_tanah} />
              <DetailRow label="Latitude" value={property.koordinat_latitude} />
              <DetailRow label="Longitude" value={property.koordinat_longitude} />
              <DetailRow label="Kontur Tanah" value={property.kontur_tanah} />

              {/* Simulasi KPR */}
              <View style={styles.kprCard}>
                <View style={styles.kprHeader}><Icon name="calculator-outline" size={24} color="#6F4E37" /><Text style={styles.kprTitle}>Simulasi Cicilan</Text></View>
                <View style={styles.kprInputRow}>
                  <View style={{flex: 1, marginRight: 10}}><Text style={styles.kprLabel}>DP (Rp)</Text><TextInput style={styles.kprInput} keyboardType="numeric" value={dp} onChangeText={setDp} /></View>
                  <View style={{width: 80}}><Text style={styles.kprLabel}>Bunga (%)</Text><TextInput style={styles.kprInput} keyboardType="numeric" value={bunga} onChangeText={setBunga} /></View>
                </View>
                <View style={styles.kprInputRow}><View style={{flex: 1}}><Text style={styles.kprLabel}>Tenor (Tahun)</Text><TextInput style={styles.kprInput} keyboardType="numeric" value={tenor} onChangeText={setTenor} /></View></View>
                <View style={styles.kprResult}><Text style={styles.kprResultLabel}>Estimasi Cicilan / Bulan:</Text><Text style={styles.kprResultValue}>{formatCurrency(cicilanPerBulan)}</Text></View>
              </View>

              {/* IKLAN SERUPA (FITUR 6) */}
              {relatedProperties.length > 0 && (
                <View style={{marginTop: 30}}>
                  <Text style={styles.sectionTitle}>Tanah Serupa di {property.kecamatan}</Text>
                  {relatedProperties.map(item => (
                    <PropertyCard 
                      key={item.id} 
                      item={item} 
                      onPress={() => navigation.push('AdDetailScreen', { propertyId: item.id })} 
                    />
                  ))}
                </View>
              )}
            </View>

            {/* Tombol Aksi */}
            <View style={styles.actionsGrid}>
                <TouchableOpacity style={styles.actionBtnMaps} onPress={handleOpenMaps}><Icon name="map-outline" size={22} color="white" /><Text style={styles.actionBtnText}>Lihat Lokasi</Text></TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn3D} onPress={() => (property as any).url_visual_3d ? (navigation.navigate as any)('Model3D', { url3d: (property as any).url_visual_3d }) : Alert.alert('Info','3D Belum tersedia')}><Icon name="cube-outline" size={22} color="white" /><Text style={styles.actionBtnText}>Visual 3D</Text></TouchableOpacity>
            </View>

            <View style={styles.bottomActions}>
                <TouchableOpacity style={[styles.favBtn, isFavorited && styles.favBtnActive]} onPress={handleFavoriteToggle} disabled={isProcessingLike}><Icon name={isFavorited ? "heart" : "heart-outline"} size={28} color={isFavorited ? "white" : "#6F4E37"} /></TouchableOpacity>
                <TouchableOpacity style={styles.waBtn} onPress={handleWhatsApp}><Icon name="logo-whatsapp" size={24} color="white" /><Text style={styles.waBtnText}>Hubungi Penjual</Text></TouchableOpacity>
            </View>
            <View style={{height: 40}} />
          </ScrollView>
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFBF5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  carouselImage: { width: width, height: 300 },
  closeZoom: { position: 'absolute', top: 50, right: 20, zIndex: 99 },
  pagination: { flexDirection: 'row', justifyContent: 'center', marginTop: -20, marginBottom: 20 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#ccc', marginHorizontal: 3 },
  dotActive: { backgroundColor: 'white', width: 15 },
  contentContainer: { paddingHorizontal: 20 },
  priceText: { fontSize: 24, fontWeight: 'bold', color: '#6F4E37', marginTop: 10 },
  titleText: { fontSize: 18, color: '#3D405B', marginBottom: 15, fontWeight: '500' },
  mainDetailCard: { flexDirection: 'row', backgroundColor: 'white', padding: 15, borderRadius: 12, elevation: 2, marginBottom: 20 },
  detailIconRow: { flexDirection: 'row', alignItems: 'center' },
  detailIconText: { marginLeft: 5, color: '#5C544A', fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: '#EAE0D5', marginVertical: 10 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#3D405B', marginBottom: 10, marginTop: 10 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F5EFE7' },
  detailLabel: { fontSize: 14, color: '#7F8C8D' },
  detailValue: { fontSize: 14, color: '#3D405B', fontWeight: 'bold', textAlign: 'right', flex: 1, marginLeft: 10 },
  kprCard: { backgroundColor: '#FDF7F0', padding: 20, borderRadius: 15, marginTop: 25, borderWidth: 1, borderColor: '#F5EFE7' },
  kprHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  kprTitle: { fontSize: 17, fontWeight: 'bold', color: '#6F4E37', marginLeft: 10 },
  kprInputRow: { flexDirection: 'row', marginBottom: 10 },
  kprLabel: { fontSize: 12, color: '#7F8C8D', marginBottom: 5 },
  kprInput: { backgroundColor: 'white', borderWidth: 1, borderColor: '#EAE0D5', borderRadius: 8, padding: 8, fontSize: 14, color: '#3D405B' },
  kprResult: { marginTop: 15, backgroundColor: '#6F4E37', padding: 15, borderRadius: 10, alignItems: 'center' },
  kprResultLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  kprResultValue: { color: 'white', fontSize: 20, fontWeight: 'bold', marginTop: 5 },
  actionsGrid: { flexDirection: 'row', paddingHorizontal: 20, marginTop: 25, justifyContent: 'space-between' },
  actionBtnMaps: { flex: 1, backgroundColor: '#3498DB', flexDirection: 'row', padding: 15, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  actionBtn3D: { flex: 1, backgroundColor: '#6F4E37', flexDirection: 'row', padding: 15, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  actionBtnText: { color: 'white', fontWeight: 'bold', marginLeft: 8 },
  bottomActions: { flexDirection: 'row', paddingHorizontal: 20, marginTop: 15, alignItems: 'center' },
  favBtn: { width: 60, height: 55, borderRadius: 12, borderWidth: 2, borderColor: '#6F4E37', alignItems: 'center', justifyContent: 'center', marginRight: 15 },
  favBtnActive: { backgroundColor: '#E74C3C', borderColor: '#E74C3C' },
  waBtn: { flex: 1, backgroundColor: '#25D366', flexDirection: 'row', height: 55, borderRadius: 12, alignItems: 'center', justifyContent: 'center', elevation: 3 },
  waBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16, marginLeft: 10 },
});

export default AdDetailScreen;