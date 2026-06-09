import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { RootStackParamList } from './src/navigation/types';
import { initialiserNotifications } from './src/services/notificationService';

// Écrans partagés
import SplashScreen from './src/screens/shared/SplashScreen';
import OnboardingScreen from './src/screens/shared/OnboardingScreen';
import OTPScreen from './src/screens/shared/OTPScreen';
import ProfileScreen from './src/screens/shared/ProfileScreen';

// Écrans passager
import HomeScreen from './src/screens/client/HomeScreen';
import CommandeScreen from './src/screens/client/CommandeScreen';
import RechercheScreen from './src/screens/client/RechercheScreen';
import CourseScreen from './src/screens/client/CourseScreen';

// Écrans chauffeur
import LoginChauffeurScreen from './src/screens/chauffeur/LoginChauffeurScreen';
import OTPChauffeurScreen from './src/screens/chauffeur/OTPChauffeurScreen';
import DashboardChauffeurScreen from './src/screens/chauffeur/DashboardChauffeurScreen';
import CourseEntranteScreen from './src/screens/chauffeur/CourseEntranteScreen';
import NavigationChauffeurScreen from './src/screens/chauffeur/NavigationChauffeurScreen';
import CourseEnCoursScreen from './src/screens/chauffeur/CourseEnCoursScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  useEffect(() => {
    // Initialiser les permissions push au démarrage (silencieux)
    initialiserNotifications();
  }, []);

  return (
    <NavigationContainer>
      <StatusBar style="dark" backgroundColor="#FAF8F4" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/* Partagés */}
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="OTP" component={OTPScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />

        {/* Passager */}
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Commande" component={CommandeScreen} />
        <Stack.Screen name="Recherche" component={RechercheScreen} />
        <Stack.Screen name="Course" component={CourseScreen} />

        {/* Chauffeur */}
        <Stack.Screen name="LoginChauffeur" component={LoginChauffeurScreen} />
        <Stack.Screen name="OTPChauffeur" component={OTPChauffeurScreen} />
        <Stack.Screen name="DashboardChauffeur" component={DashboardChauffeurScreen} />
        <Stack.Screen
          name="CourseEntrante"
          component={CourseEntranteScreen}
          options={{ presentation: 'transparentModal', animation: 'fade' }}
        />
        <Stack.Screen name="NavigationChauffeur" component={NavigationChauffeurScreen} />
        <Stack.Screen name="CourseEnCours" component={CourseEnCoursScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
