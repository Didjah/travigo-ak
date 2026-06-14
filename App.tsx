import React, { useEffect, Component, ReactNode } from 'react';
import { View, Text } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
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
import HistoriqueScreen from './src/screens/client/HistoriqueScreen';
import TransportScolaireScreen from './src/screens/client/TransportScolaireScreen';
import LivraisonScreen from './src/screens/client/LivraisonScreen';
import CovoiturageScreen from './src/screens/client/CovoiturageScreen';
import CommandeScreen from './src/screens/client/CommandeScreen';
import RechercheScreen from './src/screens/client/RechercheScreen';
import CourseScreen from './src/screens/client/CourseScreen';
import PaiementScreen from './src/screens/client/PaiementScreen';
import SuccesPaiementScreen from './src/screens/client/SuccesPaiementScreen';
import NotationScreen from './src/screens/client/NotationScreen';

// Écrans administration Mairie
import LoginMairieScreen from './src/screens/admin/LoginMairieScreen';
import DashboardMairieScreen from './src/screens/admin/DashboardMairieScreen';

// Écrans chauffeur
import LoginChauffeurScreen from './src/screens/chauffeur/LoginChauffeurScreen';
import OTPChauffeurScreen from './src/screens/chauffeur/OTPChauffeurScreen';
import DashboardChauffeurScreen from './src/screens/chauffeur/DashboardChauffeurScreen';
import HistoriqueChauffeurScreen from './src/screens/chauffeur/HistoriqueChauffeurScreen';
import AbonnementScreen from './src/screens/chauffeur/AbonnementScreen';
import PaiementAbonnementScreen from './src/screens/chauffeur/PaiementAbonnementScreen';
import CourseScolaireScreen from './src/screens/chauffeur/CourseScolaireScreen';
import LivraisonChauffeurScreen from './src/screens/chauffeur/LivraisonChauffeurScreen';
import ProposerTrajetScreen from './src/screens/chauffeur/ProposerTrajetScreen';
import CourseEntranteScreen from './src/screens/chauffeur/CourseEntranteScreen';
import NavigationChauffeurScreen from './src/screens/chauffeur/NavigationChauffeurScreen';
import CourseEnCoursScreen from './src/screens/chauffeur/CourseEnCoursScreen';

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#C0522A', marginBottom: 12 }}>
            Erreur au démarrage
          </Text>
          <Text style={{ fontSize: 13, color: '#555', textAlign: 'center' }}>
            {(this.state.error as Error).message}
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  useEffect(() => {
    initialiserNotifications().catch(() => {});
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
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
            <Stack.Screen name="Historique" component={HistoriqueScreen} />
            <Stack.Screen name="TransportScolaire" component={TransportScolaireScreen} />
            <Stack.Screen name="Livraison" component={LivraisonScreen} />
            <Stack.Screen name="Covoiturage" component={CovoiturageScreen} />
            <Stack.Screen name="Commande" component={CommandeScreen} />
            <Stack.Screen name="Recherche" component={RechercheScreen} />
            <Stack.Screen name="Course" component={CourseScreen} />
            <Stack.Screen name="Paiement" component={PaiementScreen} />
            <Stack.Screen name="SuccesPaiement" component={SuccesPaiementScreen} />
            <Stack.Screen name="Notation" component={NotationScreen} />

            {/* Administration Mairie */}
            <Stack.Screen name="LoginMairie" component={LoginMairieScreen} />
            <Stack.Screen name="DashboardMairie" component={DashboardMairieScreen} />

            {/* Chauffeur */}
            <Stack.Screen name="LoginChauffeur" component={LoginChauffeurScreen} />
            <Stack.Screen name="OTPChauffeur" component={OTPChauffeurScreen} />
            <Stack.Screen name="DashboardChauffeur" component={DashboardChauffeurScreen} />
            <Stack.Screen name="HistoriqueChauffeur" component={HistoriqueChauffeurScreen} />
            <Stack.Screen name="Abonnement" component={AbonnementScreen} />
            <Stack.Screen name="PaiementAbonnement" component={PaiementAbonnementScreen} />
            <Stack.Screen name="CourseScolaire" component={CourseScolaireScreen} />
            <Stack.Screen name="LivraisonChauffeur" component={LivraisonChauffeurScreen} />
            <Stack.Screen name="ProposerTrajet" component={ProposerTrajetScreen} />
            <Stack.Screen
              name="CourseEntrante"
              component={CourseEntranteScreen}
              options={{ presentation: 'transparentModal', animation: 'fade' }}
            />
            <Stack.Screen name="NavigationChauffeur" component={NavigationChauffeurScreen} />
            <Stack.Screen name="CourseEnCours" component={CourseEnCoursScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}
