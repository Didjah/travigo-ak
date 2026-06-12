import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  SafeAreaView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { COLORS } from '../../constants/colors';
import { SPACING, RADIUS, SHADOWS, TYPOGRAPHY, TOUCH } from '../../constants/tokens';
import { RootStackParamList } from '../../navigation/types';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'SuccesPaiement'>;
  route: RouteProp<RootStackParamList, 'SuccesPaiement'>;
};

const LABELS_MODE: Record<string, string> = {
  especes:      'Espèces',
  orange_money: 'Orange Money',
  mtn_money:    'MTN Money',
  wave:         'Wave',
};

const COULEURS_MODE: Record<string, string> = {
  especes:      COLORS.graphite,
  orange_money: '#FF6600',
  mtn_money:    '#FFCC00',
  wave:         '#1D9BF0',
};

export default function SuccesPaiementScreen({ navigation, route }: Props) {
  const { nom, montant, modePaiement, courseId } = route.params;

  const scaleAnim   = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const slideAnim   = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const couleurMode = COULEURS_MODE[modePaiement] ?? COLORS.graphite;
  const labelMode   = LABELS_MODE[modePaiement] ?? modePaiement;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        {/* Cercle succès */}
        <Animated.View
          style={[
            styles.cercleSucces,
            { transform: [{ scale: scaleAnim }], opacity: opacityAnim },
          ]}
        >
          <Text style={styles.iconSucces}>✅</Text>
        </Animated.View>

        {/* Textes */}
        <Animated.View
          style={[
            styles.textes,
            { opacity: opacityAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <Text style={styles.titre}>Paiement confirmé !</Text>
          <Text style={styles.sousTitre}>Merci, {nom} 🎉</Text>
        </Animated.View>

        {/* Récapitulatif */}
        <Animated.View
          style={[
            styles.recapCard,
            { opacity: opacityAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={styles.recapRow}>
            <Text style={styles.recapLabel}>Montant payé</Text>
            <Text style={styles.recapMontant}>{montant.toLocaleString('fr-FR')} FCFA</Text>
          </View>
          <View style={styles.separateur} />
          <View style={styles.recapRow}>
            <Text style={styles.recapLabel}>Mode de paiement</Text>
            <Text style={[styles.recapMode, { color: couleurMode }]}>{labelMode}</Text>
          </View>
          <View style={styles.separateur} />
          <View style={styles.recapRow}>
            <Text style={styles.recapLabel}>Statut</Text>
            <View style={styles.statutBadge}>
              <View style={styles.statutPoint} />
              <Text style={styles.statutTexte}>Confirmé</Text>
            </View>
          </View>
        </Animated.View>

        {/* Actions */}
        <Animated.View
          style={[
            styles.actions,
            { opacity: opacityAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <TouchableOpacity
            style={styles.boutonNoter}
            onPress={() => navigation.replace('Notation', { nom, courseId })}
            activeOpacity={0.85}
          >
            <Text style={styles.boutonNoterEmoji}>⭐</Text>
            <Text style={styles.boutonNoterTexte}>Noter le chauffeur</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.boutonAccueil}
            onPress={() => navigation.replace('Home', { nom })}
            activeOpacity={0.85}
          >
            <Text style={styles.boutonAccueilTexte}>Retour à l'accueil</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.ivoire },
  inner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl - 4,
    gap: SPACING.xl - 4,
  },

  cercleSucces: {
    width: 110,
    height: 110,
    borderRadius: RADIUS.full,
    backgroundColor: '#F0FDF4',
    borderWidth: 3,
    borderColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  iconSucces: { fontSize: 52 },

  textes: { alignItems: 'center', gap: SPACING.xs + 2 },
  titre: { fontSize: 26, fontWeight: '900', color: COLORS.graphite, textAlign: 'center' },
  sousTitre: { ...TYPOGRAPHY.h3, color: COLORS.taupe, textAlign: 'center', fontWeight: '400' },

  recapCard: {
    width: '100%',
    backgroundColor: COLORS.blanc,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    gap: SPACING.xs,
    ...SHADOWS.card,
  },
  recapRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm + 2,
  },
  recapLabel: { ...TYPOGRAPHY.body, color: COLORS.taupe, fontWeight: '500' },
  recapMontant: { fontSize: 22, fontWeight: '900', color: COLORS.graphite },
  recapMode: { ...TYPOGRAPHY.h3, fontWeight: '700' },
  separateur: { height: 1, backgroundColor: '#F0EDE8' },
  statutBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs + 1,
    backgroundColor: '#F0FDF4',
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.xs,
  },
  statutPoint: {
    width: 6,
    height: 6,
    borderRadius: RADIUS.full,
    backgroundColor: '#22C55E',
  },
  statutTexte: { ...TYPOGRAPHY.caption, color: '#15803D', fontWeight: '700' },

  actions: { width: '100%', gap: SPACING.md - 4 },
  boutonNoter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm + 2,
    backgroundColor: '#FEF3C7',
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    borderWidth: 1.5,
    borderColor: '#FCD34D',
    minHeight: TOUCH.minButton,
  },
  boutonNoterEmoji: { fontSize: 18 },
  boutonNoterTexte: { ...TYPOGRAPHY.h3, color: '#92400E' },
  boutonAccueil: {
    backgroundColor: COLORS.graphite,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md + 1,
    alignItems: 'center',
    minHeight: TOUCH.minButton,
    ...SHADOWS.card,
  },
  boutonAccueilTexte: { ...TYPOGRAPHY.h2, color: COLORS.ivoire, letterSpacing: 0.3 },
});
