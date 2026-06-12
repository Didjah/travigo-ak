import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Animated,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { COLORS } from '../../constants/colors';
import { SPACING, RADIUS, SHADOWS, TYPOGRAPHY, TOUCH } from '../../constants/tokens';
import { ChauffeurInfo, RootStackParamList } from '../../navigation/types';
import { ecouterStatutCourse, getPrenomUtilisateur } from '../../services/courseService';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Recherche'>;
  route: RouteProp<RootStackParamList, 'Recherche'>;
};

const CHAUFFEUR_SIMULE: ChauffeurInfo = {
  nom: 'Kouamé Jean',
  plaque: 'AB 1234 CI',
  vehicule: 'Toyota Camry — Blanc',
  telephone: '0708090001',
};

const DEV_DELAI = 5000;

export default function RechercheScreen({ navigation, route }: Props) {
  const { nom, destination, courseId } = route.params;
  const [secondes, setSecondes] = useState(0);

  const pulse1 = useRef(new Animated.Value(0)).current;
  const pulse2 = useRef(new Animated.Value(0)).current;
  const pulse3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    function creerPulse(anim: Animated.Value, delay: number) {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: 1, duration: 1500, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      );
    }

    const a1 = creerPulse(pulse1, 0);
    const a2 = creerPulse(pulse2, 500);
    const a3 = creerPulse(pulse3, 1000);

    a1.start();
    a2.start();
    a3.start();

    return () => { a1.stop(); a2.stop(); a3.stop(); };
  }, [pulse1, pulse2, pulse3]);

  useEffect(() => {
    const id = setInterval(() => setSecondes((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!__DEV__) return;
    const timeout = setTimeout(() => {
      navigation.replace('Course', { nom, chauffeur: CHAUFFEUR_SIMULE, courseId });
    }, DEV_DELAI);
    return () => clearTimeout(timeout);
  }, [navigation, nom, courseId]);

  useEffect(() => {
    if (__DEV__ || !courseId) return;
    const unsubscribe = ecouterStatutCourse(courseId, async (course) => {
      if (course.statut === 'acceptee' && course.chauffeur_id) {
        const prenomChauffeur = await getPrenomUtilisateur(course.chauffeur_id);
        const chauffeurInfo: ChauffeurInfo = {
          nom: prenomChauffeur,
          plaque: 'AB 0000 CI',
          vehicule: 'Taxi — Gagnoa',
          telephone: '',
        };
        navigation.replace('Course', {
          nom,
          chauffeur: chauffeurInfo,
          courseId,
          montant: course.prix ?? 1000,
        });
      }
    });
    return unsubscribe;
  }, [courseId, navigation, nom]);

  function handleAnnuler() {
    navigation.goBack();
  }

  function cercleStyle(anim: Animated.Value, taille: number) {
    return {
      width: taille,
      height: taille,
      borderRadius: taille / 2,
      backgroundColor: COLORS.terracotta,
      position: 'absolute' as const,
      transform: [
        {
          scale: anim.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 2.6],
          }),
        },
      ],
      opacity: anim.interpolate({
        inputRange: [0, 0.2, 1],
        outputRange: [0.55, 0.3, 0],
      }),
    };
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        {/* Cercles pulsants */}
        <View style={styles.animationContainer}>
          <Animated.View style={cercleStyle(pulse3, 80)} />
          <Animated.View style={cercleStyle(pulse2, 80)} />
          <Animated.View style={cercleStyle(pulse1, 80)} />
          <View style={styles.cercleCore}>
            <Text style={styles.cercleCoreTexte}>TAX</Text>
          </View>
        </View>

        {/* Textes */}
        <View style={styles.textes}>
          <Text style={styles.titre}>Recherche d'un chauffeur...</Text>
          <Text style={styles.destination} numberOfLines={1}>
            Vers : {destination}
          </Text>
          <Text style={styles.compteur}>Attente : {secondes}s</Text>
          {__DEV__ && (
            <View style={styles.devBanner}>
              <Text style={styles.devBannerTexte}>
                Mode DEV — chauffeur simulé dans {Math.max(0, Math.ceil((DEV_DELAI / 1000) - secondes))}s
              </Text>
            </View>
          )}
        </View>

        <PointsAnimation />

        <TouchableOpacity
          style={styles.boutonAnnuler}
          onPress={handleAnnuler}
          activeOpacity={0.8}
        >
          <Text style={styles.boutonAnnulerTexte}>Annuler la recherche</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function PointsAnimation() {
  const [dots, setDots] = useState('');
  useEffect(() => {
    const id = setInterval(() => {
      setDots((d) => (d.length >= 3 ? '' : d + '.'));
    }, 500);
    return () => clearInterval(id);
  }, []);
  return (
    <Text style={styles.dots}>{dots}</Text>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.ivoire },
  inner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    gap: SPACING.xl,
  },

  animationContainer: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cercleCore: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.terracotta,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.cta,
  },
  cercleCoreTexte: {
    color: COLORS.blanc,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },

  textes: { alignItems: 'center', gap: SPACING.sm },
  titre: { ...TYPOGRAPHY.h1, color: COLORS.graphite, textAlign: 'center' },
  destination: { ...TYPOGRAPHY.body, color: COLORS.taupe, textAlign: 'center', maxWidth: 260 },
  compteur: { ...TYPOGRAPHY.caption, color: COLORS.taupe, fontWeight: '600', marginTop: SPACING.xs },
  devBanner: {
    marginTop: SPACING.sm,
    backgroundColor: '#FFF3CD',
    borderWidth: 1,
    borderColor: '#FBBF24',
    borderRadius: RADIUS.xs,
    paddingVertical: SPACING.xs + 2,
    paddingHorizontal: SPACING.md - 4,
  },
  devBannerTexte: {
    ...TYPOGRAPHY.micro,
    color: '#92400E',
    fontWeight: '600',
    textAlign: 'center',
  },
  dots: { color: COLORS.taupe, fontSize: 24, letterSpacing: 4 },

  boutonAnnuler: {
    borderWidth: 1.5,
    borderColor: COLORS.taupe,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md - 2,
    paddingHorizontal: SPACING.xl,
    minHeight: TOUCH.minSize,
    justifyContent: 'center',
  },
  boutonAnnulerTexte: { ...TYPOGRAPHY.h3, color: COLORS.graphite, letterSpacing: 0.2 },
});
