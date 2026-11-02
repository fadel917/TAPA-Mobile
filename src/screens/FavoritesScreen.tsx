// src/screens/FavoritesScreen.tsx

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, ActivityIndicator } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { Property } from '../types/data';
import PropertyCard from '../components/PropertyCard';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';

const FavoritesScreen = () => {
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<Property[]>([]);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const currentUser = auth().currentUser;

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        // Langkah 1: Ambil semua ID properti yang difavoritkan pengguna
        const favoritesSnapshot = await firestore()
          .collection('users')
          .doc(currentUser.uid)
          .collection('favorites')
          .get();
        
        const propertyIds = favoritesSnapshot.docs.map(doc => doc.id);

        if (propertyIds.length === 0) {
          setFavorites([]);
          setLoading(false);
          return;
        }

        // Langkah 2: Ambil data lengkap properti berdasarkan daftar ID
        const propertiesSnapshot = await firestore()
          .collection('properties')
          .where(firestore.FieldPath.documentId(), 'in', propertyIds)
          .get();

        const propertiesList: Property[] = propertiesSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            judul_iklan: data.judul_iklan,
            harga: data.harga,
            kecamatan: data.kecamatan,
            luas_tanah: data.luas_tanah,
            url_foto: data.url_foto,
            alamat_lengkap: data.alamat_lengkap,
          };
        });
        
        setFavorites(propertiesList);

      } catch (error) {
        console.error("Error fetching favorites: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [currentUser]);
  
  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" style={{flex: 1}} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={favorites}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <PropertyCard
            item={item}
            onPress={() => navigation.navigate('AdDetailScreen', { propertyId: item.id })}
          />
        )}
        contentContainerStyle={{ padding: 16 }}
        ListHeaderComponent={<Text style={styles.header}>Properti Favorit Anda</Text>}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text>Anda belum memiliki properti favorit.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    paddingBottom: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  }
});

export default FavoritesScreen;