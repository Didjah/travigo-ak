import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { COLORS } from '../../constants/colors';
import { RootStackParamList } from '../../navigation/types';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
  route: RouteProp<RootStackParamList, 'Home'>;
};

export default function HomeScreen({ navigation, route }: Props) {
  const { nom } = route.params;

  function handleCommanderTaxi() {
    navigation.navigate('Commande', { nom });
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* En-tête */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSalut}>Bonjour,</Text>
          <Text style={styles.headerNom}>{nom}</Text>
        </View>
        <View style={styles.logoMini}>
          <Text style={styles.logoMiniTexte}>
            <Text style={styles.logoMiniTravi}>T</Text>
            <Text style={styles.logoMiniGo}>G</Text>
          </Text>
        </View>
      </View>

      {/* Corps principal */}
      <View style={styles.corps}>
        {/* Carte destination */}
        <View style={styles.carteDestination}>
          <Text style={styles.carteDestinationLabel}>Où allez-vous ?</Text>
          <TouchableOpacity
            style={styles.inputDestination}
            activeOpacity={0.7}
            onPress={handleCommanderTaxi}
          >
            <View style={styles.inputDestinationPoint} />
            <Text style={styles.inputDestinationTexte}>Entrez votre destination</Text>
          </TouchableOpacity>
        </View>

        {/* Bouton principal */}
        <TouchableOpacity
          style={styles.boutonCommander}
          onPress={handleCommanderTaxi}
          activeOpacity={0.85}
        >
          <Text style={styles.boutonCommanderIcone}>TAX</Text>
          <View>
            <Text style={styles.boutonCommanderTexte}>Commander un taxi</Text>
            <Text style={styles.boutonCommanderSous}>Disponible maintenant à Gagnoa</Text>
          </View>
        </TouchableOpacity>

        {/* Services rapides */}
        <View style={styles.services}>
          <Text style={styles.servicesTitre}>Services</Text>
          <View style={styles.servicesGrille}>
            <ServiceCard label="Taxi" icone="T" />
            <ServiceCard label="Tricycle" icone="TR" />
            <ServiceCard label="Urgence" icone="U" couleur={COLORS.rouge} />
          </View>
        </View>
      </View>

      {/* Pied de page — info ville */}
      <View style={styles.footer}>
        <View style={styles.footerPoint} />
        <Text style={styles.footerTexte}>Gagnoa, Côte d'Ivoire</Text>
      </View>
    </SafeAreaView>
  );
}

function ServiceCard({
  label,
  icone,
  couleur = COLORS.terracotta,
}: {
  label: string;
  icone: string;
  couleur?: string;
}) {
  return (
    <TouchableOpacity
      style={styles.serviceCard}
      activeOpacity={0.75}
      onPress={() => Alert.alert('Bientôt disponible', `Le service "${label}" arrive prochainement.`)}
    >
      <View style={[styles.serviceCardIconeContainer, { backgroundColor: couleur + '18' }]}>
        <Text style={[styles.serviceCardIcone, { color: couleur }]}>{icone}</Text>
      </View>
      <Text style={styles.serviceCardLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.ivoire,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  headerSalut: {
    fontSize: 14,
    color: COLORS.taupe,
    fontWeight: '500',
  },
  headerNom: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.graphite,
    letterSpacing: 0.3,
  },
  logoMini: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.graphite,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoMiniTexte: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  logoMiniTravi: {
    color: COLORS.ivoire,
  },
  logoMiniGo: {
    color: COLORS.terracotta,
  },
  corps: {
    flex: 1,
    paddingHorizontal: 24,
    gap: 20,
    paddingTop: 8,
  },
  carteDestination: {
    backgroundColor: COLORS.blanc,
    borderRadius: 16,
    padding: 20,
    shadowColor: COLORS.graphite,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
    gap: 12,
  },
  carteDestinationLabel: {
    fontSize: 13,
    color: COLORS.taupe,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  inputDestination: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E0D8',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 10,
  },
  inputDestinationPoint: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.terracotta,
  },
  inputDestinationTexte: {
    fontSize: 15,
    color: COLORS.taupe,
  },
  boutonCommander: {
    backgroundColor: COLORS.terracotta,
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    shadowColor: COLORS.terracotta,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  boutonCommanderIcone: {
    fontSize: 13,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    textAlign: 'center',
    lineHeight: 44,
  },
  boutonCommanderTexte: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.blanc,
    letterSpacing: 0.2,
  },
  boutonCommanderSous: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
  },
  services: {
    gap: 12,
  },
  servicesTitre: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.graphite,
  },
  servicesGrille: {
    flexDirection: 'row',
    gap: 12,
  },
  serviceCard: {
    flex: 1,
    backgroundColor: COLORS.blanc,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    shadowColor: COLORS.graphite,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  serviceCardIconeContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceCardIcone: {
    fontSize: 14,
    fontWeight: '800',
  },
  serviceCardLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.graphite,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 6,
  },
  footerPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.terracotta,
  },
  footerTexte: {
    fontSize: 12,
    color: COLORS.taupe,
    fontWeight: '500',
  },
});
