// src/screens/AdListScreen.tsx

import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet, SafeAreaView, FlatList, ActivityIndicator, View, Text,
  TextInput, TouchableOpacity, Modal, Button, ScrollView, Alert
} from 'react-native';
import { useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, HomeStackParamList } from '../../App';
import firestore from '@react-native-firebase/firestore';
import { Property } from '../types/data';
import PropertyCard from '../components/PropertyCard';
import Icon from 'react-native-vector-icons/Ionicons';

type AdListScreenRouteProp = RouteProp<HomeStackParamList, 'AdListScreen'>;

const Checkbox = ({ label, isSelected, onToggle }: { label: string, isSelected: boolean, onToggle: () => void }) => (
  <TouchableOpacity style={styles.checkboxContainer} onPress={onToggle}>
    <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
      {isSelected && <Icon name="checkmark" size={18} color="white" />}
    </View>
    <Text style={styles.checkboxLabel}>{label}</Text>
  </TouchableOpacity>
);

const AdListScreen = ({ route }: { route: AdListScreenRouteProp }) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { kecamatan } = route.params;
  const [loading, setLoading] = useState(true);
  const [masterProperties, setMasterProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  
  // State Filter Lokal (di dalam modal)
  const [jenisTanahFilter, setJenisTanahFilter] = useState<string[]>([]);
  const [minHarga, setMinHarga] = useState('');
  const [maxHarga, setMaxHarga] = useState('');
  const [minLuas, setMinLuas] = useState('');
  const [maxLuas, setMaxLuas] = useState('');
  
  // State Filter yang sudah di-Apply
  const [appliedFilters, setAppliedFilters] = useState<any>({});

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    try {
      const propertiesList: Property[] = [];
      const querySnapshot = await firestore()
        .collection('properties')
        .where('kecamatan', '==', kecamatan)
        .get();
      
      querySnapshot.forEach(doc => {
        propertiesList.push({ id: doc.id, ...doc.data() } as Property);
      });
      setMasterProperties(propertiesList);
    } catch (error) { 
      console.error("Error fetching properties: ", error); 
    } finally { 
      setLoading(false); 
    }
  }, [kecamatan]);

  useEffect(() => {
    navigation.setOptions({ title: kecamatan });
    fetchProperties();
  }, [kecamatan, navigation, fetchProperties]);

  // LOGIKA FILTER UTAMA
  useEffect(() => {
    let tempProperties = [...masterProperties];

    // 1. Filter Search (Judul)
    if (searchQuery) {
      tempProperties = tempProperties.filter(p => 
        p.judul_iklan.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // 2. Filter Jenis Tanah (SUDAH DIAKTIFKAN)
    if (appliedFilters.jenisTanah && appliedFilters.jenisTanah.length > 0) {
      tempProperties = tempProperties.filter((p: any) => 
        appliedFilters.jenisTanah.includes(p.jenis_tanah)
      );
    }

    // 3. Filter Harga
    if (appliedFilters.minHarga) {
      tempProperties = tempProperties.filter(p => p.harga >= parseInt(appliedFilters.minHarga, 10));
    }
    if (appliedFilters.maxHarga) {
      tempProperties = tempProperties.filter(p => p.harga <= parseInt(appliedFilters.maxHarga, 10));
    }

    // 4. Filter Luas
    if (appliedFilters.minLuas) {
      tempProperties = tempProperties.filter(p => p.luas_tanah >= parseInt(appliedFilters.minLuas, 10));
    }
    if (appliedFilters.maxLuas) {
      tempProperties = tempProperties.filter(p => p.luas_tanah <= parseInt(appliedFilters.maxLuas, 10));
    }

    setFilteredProperties(tempProperties);
  }, [searchQuery, appliedFilters, masterProperties]);

  const handleJenisTanahToggle = (jenis: string) => {
    setJenisTanahFilter(prev => 
      prev.includes(jenis) ? prev.filter(item => item !== jenis) : [...prev, jenis]
    );
  };

  const handleApplyFilter = () => {
    setAppliedFilters({ 
      jenisTanah: jenisTanahFilter, 
      minHarga, 
      maxHarga, 
      minLuas, 
      maxLuas 
    });
    setFilterModalVisible(false);
  };

  const handleResetFilter = () => {
    // Reset state modal
    setJenisTanahFilter([]); 
    setMinHarga(''); 
    setMaxHarga(''); 
    setMinLuas(''); 
    setMaxLuas('');
    // Reset filter yang terpasang
    setAppliedFilters({}); 
    setSearchQuery('');
    // Tutup modal agar langsung liat hasil
    setFilterModalVisible(false);
  };

  if (loading) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFBF5'}}>
        <ActivityIndicator size="large" color="#6F4E37" />
        <Text style={{marginTop: 10, color: '#6F4E37'}}>Memuat Iklan...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchContainer}>
        <TouchableOpacity onPress={() => setFilterModalVisible(true)} style={styles.filterButton}>
          <Icon name="filter-outline" size={24} color="#3D405B" />
          {Object.keys(appliedFilters).length > 0 && <View style={styles.filterIndicator} />}
        </TouchableOpacity>
        
        <TextInput 
          style={styles.searchInput} 
          placeholder="Cari berdasarkan judul..." 
          value={searchQuery} 
          onChangeText={setSearchQuery} 
        />
        
        <View style={styles.searchButton}>
          <Icon name="search-outline" size={24} color="#3D405B" />
        </View>
      </View>

      <FlatList
        data={filteredProperties}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <PropertyCard item={item} onPress={() => navigation.navigate('AdDetailScreen', { propertyId: item.id })} />
        )}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 20 }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="search-outline" size={60} color="#ccc" />
            <Text style={styles.emptyText}>Iklan tidak ditemukan dengan filter ini.</Text>
            <TouchableOpacity onPress={handleResetFilter}>
              <Text style={styles.resetText}>Reset Pencarian</Text>
            </TouchableOpacity>
          </View>
        }
      />

      <Modal
        animationType="slide" transparent={true} visible={filterModalVisible}
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                  <Icon name="close" size={28} color="#3D405B" />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Filter Pencarian</Text>
                <View style={{width: 28}} /> 
              </View>

              <Text style={styles.filterSectionTitle}>Jenis Tanah</Text>
              <View style={styles.checkboxGroup}>
                <Checkbox label="Perumahan" isSelected={jenisTanahFilter.includes('Perumahan')} onToggle={() => handleJenisTanahToggle('Perumahan')} />
                <Checkbox label="Komersial" isSelected={jenisTanahFilter.includes('Komersial')} onToggle={() => handleJenisTanahToggle('Komersial')} />
                <Checkbox label="Pertanian" isSelected={jenisTanahFilter.includes('Pertanian')} onToggle={() => handleJenisTanahToggle('Pertanian')} />
              </View>

              <Text style={styles.filterSectionTitle}>Harga</Text>
              <TextInput style={styles.filterInput} placeholder="Harga Minimum (Rp)" value={minHarga} onChangeText={setMinHarga} keyboardType="numeric" />
              <TextInput style={styles.filterInput} placeholder="Harga Maksimum (Rp)" value={maxHarga} onChangeText={setMaxHarga} keyboardType="numeric" />

              <Text style={styles.filterSectionTitle}>Luas (m²)</Text>
              <TextInput style={styles.filterInput} placeholder="Luas Minimum" value={minLuas} onChangeText={setMinLuas} keyboardType="numeric" />
              <TextInput style={styles.filterInput} placeholder="Luas Maksimum" value={maxLuas} onChangeText={setMaxLuas} keyboardType="numeric" />

              <View style={styles.filterActions}>
                <TouchableOpacity style={styles.resetBtn} onPress={handleResetFilter}>
                  <Text style={styles.resetBtnText}>RESET FILTER</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.applyBtn} onPress={handleApplyFilter}>
                  <Text style={styles.applyBtnText}>LIHAT HASIL</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFBF5' },
    searchContainer: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: 'white', alignItems: 'center', elevation: 2 },
    filterButton: { padding: 8, position: 'relative' },
    filterIndicator: { position: 'absolute', top: 8, right: 8, width: 10, height: 10, backgroundColor: '#E74C3C', borderRadius: 5, borderWidth: 1, borderColor: 'white' },
    searchInput: { flex: 1, height: 40, backgroundColor: '#f0f0f0', borderRadius: 20, paddingHorizontal: 16, color: '#000' },
    searchButton: { padding: 8, marginLeft: 8 },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 },
    emptyText: { marginTop: 15, fontSize: 16, color: '#7F8C8D' },
    resetText: { marginTop: 10, color: '#6F4E37', fontWeight: 'bold', textDecorationLine: 'underline' },
    modalContainer: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
    modalContent: { width: '100%', maxHeight: '85%', backgroundColor: '#FFFBF5', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#3D405B' },
    filterSectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#3D405B', marginTop: 15, marginBottom: 12 },
    checkboxGroup: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start' },
    checkboxContainer: { flexDirection: 'row', alignItems: 'center', marginRight: 15, marginBottom: 10 },
    checkbox: { width: 22, height: 22, borderWidth: 2, borderColor: '#ccc', borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
    checkboxSelected: { backgroundColor: '#6F4E37', borderColor: '#6F4E37' },
    checkboxLabel: { marginLeft: 8, fontSize: 15, color: '#555' },
    filterInput: { backgroundColor: 'white', borderWidth: 1, borderColor: '#EAE0D5', borderRadius: 10, padding: 12, fontSize: 16, marginBottom: 15, color: '#000' },
    filterActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 25, marginBottom: 10 },
    resetBtn: { flex: 1, padding: 15, borderRadius: 12, backgroundColor: '#BDC3C7', alignItems: 'center', marginRight: 10 },
    resetBtnText: { color: 'white', fontWeight: 'bold' },
    applyBtn: { flex: 1, padding: 15, borderRadius: 12, backgroundColor: '#6F4E37', alignItems: 'center' },
    applyBtnText: { color: 'white', fontWeight: 'bold' },
});

export default AdListScreen;