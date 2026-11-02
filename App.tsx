// App.tsx

import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'; 
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import Icon from 'react-native-vector-icons/Ionicons'; 

// Impor semua screen Anda
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import KecamatanScreen from './src/screens/KecamatanScreen';
import AdListScreen from './src/screens/AdListScreen';
import AdDetailScreen from './src/screens/AdDetailScreen';
import SurveyRequestScreen from './src/screens/SurveyRequestScreen';
import FavoritesScreen from './src/screens/FavoritesScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import ChangeUsernameScreen from './src/screens/ChangeUsernameScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import Model3DScreen from './src/screens/Model3DScreen';
import SurveyHistoryScreen from './src/screens/SurveyHistoryScreen';

// Definisikan semua screen di aplikasi Anda
export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  MainTabs: undefined; 
  AdDetailScreen: { propertyId: string };
  SurveyRequest: undefined;
  Favorites: undefined; 
  Model3D: { url3d: string }; // <--- SUDAH DITAMBAHKAN DI SINI
};

// Definisikan screen untuk setiap tab
export type HomeStackParamList = {
  Home: undefined;
  Kecamatan: undefined;
  AdListScreen: { kecamatan: string };
};
export type FavoritesStackParamList = {
  FavoritesList: undefined;
};
export type ProfileStackParamList = {
  ProfileHome: undefined;
  Settings: undefined;
  ChangeUsername: undefined;
  SurveyHistory: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const FavoritesStack = createNativeStackNavigator<FavoritesStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();
const Tab = createBottomTabNavigator();

// Stack untuk alur utama (Beranda, Kecamatan, Daftar Iklan)
const HomeStackNavigator = () => (
  <HomeStack.Navigator>
    <HomeStack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
    <HomeStack.Screen name="Kecamatan" component={KecamatanScreen} />
    <HomeStack.Screen name="AdListScreen" component={AdListScreen} />
  </HomeStack.Navigator>
);

// Stack untuk alur Favorit
const FavoritesStackNavigator = () => (
  <FavoritesStack.Navigator>
    <FavoritesStack.Screen name="FavoritesList" component={FavoritesScreen} options={{title: 'Favorit'}}/>
  </FavoritesStack.Navigator>
);

// Stack untuk alur Profil
const ProfileStackNavigator = () => (
  <ProfileStack.Navigator>
    <ProfileStack.Screen name="ProfileHome" component={ProfileScreen} options={{title: 'Profil Saya'}}/>
    <ProfileStack.Screen name="Settings" component={SettingsScreen} options={{title: 'Pengaturan Akun'}} />
    <ProfileStack.Screen name="ChangeUsername" component={ChangeUsernameScreen} options={{title: 'Ubah Nama'}} />
    <ProfileStack.Screen 
  name="SurveyHistory" 
  component={SurveyHistoryScreen} 
  options={{title: 'Riwayat Survei'}} 
/> 
  </ProfileStack.Navigator>
);

// Komponen Tab Navigator Utama
const MainTabsNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName = 'alert-circle-outline';
        if (route.name === 'Beranda') {
          iconName = focused ? 'home' : 'home-outline';
        } else if (route.name === 'Favorit') {
          iconName = focused ? 'heart' : 'heart-outline';
        } else if (route.name === 'Profil') {
          iconName = focused ? 'person' : 'person-outline';
        }
        return <Icon name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#6F4E37',
      tabBarInactiveTintColor: 'gray',
      headerShown: false, 
    })}
  >
    <Tab.Screen name="Beranda" component={HomeStackNavigator} />
    <Tab.Screen name="Favorit" component={FavoritesStackNavigator} />
    <Tab.Screen name="Profil" component={ProfileStackNavigator} />
  </Tab.Navigator>
);

const App = () => {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);

  function onAuthStateChanged(user: FirebaseAuthTypes.User | null) {
    setUser(user);
    if (initializing) setInitializing(false);
  }

  useEffect(() => {
    const subscriber = auth().onAuthStateChanged(onAuthStateChanged);
    return subscriber;
  }, []);

  if (initializing) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {user ? (
          <>
            <Stack.Screen name="MainTabs" component={MainTabsNavigator} options={{ headerShown: false }} />
            {/* Definisikan screen yang bisa dipanggil dari mana saja di sini */}
            <Stack.Screen name="AdDetailScreen" component={AdDetailScreen} />
            <Stack.Screen name="SurveyRequest" component={SurveyRequestScreen} options={{ title: 'Permintaan Survei' }} />
            <Stack.Screen name="Favorites" component={FavoritesScreen} />
            
            {/* V V V LAYAR 3D DIDAFTARKAN DI SINI V V V */}
            <Stack.Screen name="Model3D" component={Model3DScreen} options={{ title: 'Visual 3D Tanah' }} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;