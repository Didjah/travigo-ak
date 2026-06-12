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
import { SPACING, RADIUS, SHADOWS, TYPOGRAPHY, TOUCH } from '../../constants/tokens';
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

  function handleHistorique() {
    navigation.navigate('Historique', { nom });
  }

  function handleTransportScolaire() {
    navigation.navigate('TransportScolaire', { nom });
  }

  function handleLivraison() {
    navigation.navigate('Livraison', { nom });
  }

  function handleCovoiturage() {
    navigation.navigate('Covoiturage', { nom });
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

        {/* Boutons secondaires — grille 2×2 */}
        <View style={styles.boutonsGrille}>
          <View style={styles.boutonsRow}>
            <TouchableOpacity
              style={[styles.boutonSecondaire, { flex: 1 }]}
              onPress={handleHistorique}
              activeOpacity={0.8}
            >
              <Text style={styles.boutonSecondaireIcone}>📋</Text>
              <Text style={styles.boutonSecondaireTexte}>Mes courses</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.boutonSecondaire, { flex: 1 }]}
              onPress={handleTransportScolaire}
              activeOpacity={0.8}
            >
              <Text style={styles.boutonSecondaireIcone}>🏫</Text>
              <Text style={styles.boutonSecondaireTexte}>Scolaire</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.boutonsRow}>
            <TouchableOpacity
              style={[styles.boutonSecondaire, { flex: 1 }]}
              onPress={handleLivraison}
              activeOpacity={0.8}
            >
              <Text style={styles.boutonSecondaireIcone}>📦</Text>
              <Text style={styles.boutonSecondaireTexte}>Livraison</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.boutonSecondaire, { flex: 1 }]}
              onPress={handleCovoiturage}
              activeOpacity={0.8}
            >
              <Text style={styles.boutonSecondaireIcone}>🚗</Text>
              <Text style={styles.boutonSecondaireTexte}>Covoiturage</Text>
            </TouchableOpacity>
          </View>
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

  // ── Header ──────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  headerSalut: {
    ...TYPOGRAPHY.caption,
    color: COLORS.taupe,
  },
  headerNom: {
    ...TYPOGRAPHY.h1,
    color: COLORS.graphite,
  },
  logoMini: {
    width: TOUCH.iconButton,
    height: TOUCH.iconButton,
    borderRadius: RADIUS.full,
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

  // ── Corps ────────────────────────────────────────────────────────────────
  corps: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    gap: SPACING.lg,
    paddingTop: SPACING.sm,
  },

  // ── Carte destination ────────────────────────────────────────────────────
  carteDestination: {
    backgroundColor: COLORS.blanc,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    ...SHADOWS.card,
    gap: SPACING.sm + SPACING.xs, // 12
  },
  carteDestinationLabel: {
    ...TYPOGRAPHY.sectionLabel,
    color: COLORS.taupe,
  },
  inputDestination: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.md - 2, // 14
    paddingVertical: SPACING.md,       // 16 — touch target ≥48dp
    gap: SPACING.sm + SPACING.xs,      // 12
    minHeight: TOUCH.minSize,
  },
  inputDestinationPoint: {
    width: 10,
    height: 10,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.terracotta,
  },
  inputDestinationTexte: {
    ...TYPOGRAPHY.h3,
    fontWeight: '400',
    color: COLORS.taupe,
  },

  // ── Grille boutons secondaires ──────────────────────────────────────────
  boutonsGrille: {
    gap: SPACING.sm + SPACING.xs, // 12
  },
  boutonsRow: {
    flexDirection: 'row',
    gap: SPACING.sm + SPACING.xs, // 12
  },
  boutonSecondaire: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.blanc,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md - 2, // 14
    paddingVertical: SPACING.md,       // 16 — touch target ≥48dp
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
    minHeight: TOUCH.minSize,
    ...SHADOWS.card,
  },
  boutonSecondaireIcone: {
    fontSize: 18,
  },
  boutonSecondaireTexte: {
    ...TYPOGRAPHY.h3,
    color: COLORS.graphite,
  },

  // ── Bouton principal CTA ─────────────────────────────────────────────────
  boutonCommander: {
    backgroundColor: COLORS.terracotta,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md + SPACING.xs, // 20
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    minHeight: TOUCH.minButton,
    ...SHADOWS.cta,
  },
  boutonCommanderIcone: {
    fontSize: 13,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1,
    width: TOUCH.iconButton,
    height: TOUCH.iconButton,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.overlayLight,
    textAlign: 'center',
    lineHeight: TOUCH.iconButton,
  },
  boutonCommanderTexte: {
    ...TYPOGRAPHY.h2,
    color: COLORS.blanc,
  },
  boutonCommanderSous: {
    ...TYPOGRAPHY.caption,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
  },

  // ── Services ─────────────────────────────────────────────────────────────
  services: {
    gap: SPACING.sm + SPACING.xs, // 12
  },
  servicesTitre: {
    ...TYPOGRAPHY.h2,
    color: COLORS.graphite,
  },
  servicesGrille: {
    flexDirection: 'row',
    gap: SPACING.sm + SPACING.xs, // 12
  },
  serviceCard: {
    flex: 1,
    backgroundColor: COLORS.blanc,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    gap: SPACING.sm,
    minHeight: TOUCH.minSize + SPACING.md, // zone tactile confortable
    ...SHADOWS.card,
  },
  serviceCardIconeContainer: {
    width: TOUCH.iconButton,
    height: TOUCH.iconButton,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceCardIcone: {
    fontSize: 14,
    fontWeight: '800',
  },
  serviceCardLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.graphite,
  },

  // ── Footer ───────────────────────────────────────────────────────────────
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    gap: SPACING.xs + 2, // 6
  },
  footerPoint: {
    width: 6,
    height: 6,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.terracotta,
  },
  footerTexte: {
    ...TYPOGRAPHY.caption,
    color: COLORS.taupe,
    fontWeight: '500',
  },
});
