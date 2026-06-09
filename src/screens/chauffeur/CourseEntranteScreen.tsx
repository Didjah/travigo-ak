import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { COLORS } from '../../constants/colors';
import { RootStackParamList } from '../../navigation/types';
import { accepterCourse } from '../../services/courseService';
import { getSessionUser } from '../../services/session';
import { supabase } from '../../services/supabase';
import { notifierUtilisateur } from '../../services/notificationService';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'CourseEntrante'>;
  route: RouteProp<RootStackParamList, 'CourseEntrante'>;
};

export default function CourseEntranteScreen({ navigation, route }: Props) {
  const { passagerPrenom, depart, destination, prixEstime, courseId } = route.params;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, friction: 5, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  async function handleAccepter() {
    if (!__DEV__ && courseId) {
      const user = getSessionUser();
      if (user) {
        await accepterCourse(courseId, user.id);
        // Notifier le passager que sa course a été acceptée
        const { data: courseData } = await supabase
          .from('courses')
          .select('passager_id')
          .eq('id', courseId)
          .single();
        if (courseData?.passager_id) {
          notifierUtilisateur(
            courseData.passager_id,
            'Chauffeur trouvé !',
            'Votre taxi arrive bientôt.',
            { courseId }
          );
        }
      }
    }
    navigation.replace('NavigationChauffeur', {
      passagerPrenom,
      depart,
      destination,
      prixEstime,
      courseId,
    });
  }

  function handleRefuser() {
    navigation.navigate('DashboardChauffeur');
  }

  return (
    <View style={styles.container}>
      {/* Fond semi-transparent */}
      <View style={styles.overlay} />

      <Animated.View
        style={[
          styles.carte,
          { transform: [{ scale: scaleAnim }], opacity: opacityAnim },
        ]}
      >
        {/* Icone notification */}
        <View style={styles.iconContainer}>
          <Text style={styles.iconTexte}>🔔</Text>
        </View>

        <Text style={styles.titre}>Nouvelle course !</Text>
        <Text style={styles.sousTitre}>Un passager vous attend</Text>

        {/* Infos passager */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoIcone}>👤</Text>
            <View style={styles.infoContenu}>
              <Text style={styles.infoLabel}>Passager</Text>
              <Text style={styles.infoValeur}>{passagerPrenom}</Text>
            </View>
          </View>

          <View style={styles.separateur} />

          <View style={styles.infoRow}>
            <Text style={styles.infoIcone}>📍</Text>
            <View style={styles.infoContenu}>
              <Text style={styles.infoLabel}>Point de départ</Text>
              <Text style={styles.infoValeur} numberOfLines={2}>{depart}</Text>
            </View>
          </View>

          <View style={styles.separateur} />

          <View style={styles.infoRow}>
            <Text style={styles.infoIcone}>🏁</Text>
            <View style={styles.infoContenu}>
              <Text style={styles.infoLabel}>Destination</Text>
              <Text style={styles.infoValeur} numberOfLines={2}>{destination}</Text>
            </View>
          </View>

          <View style={styles.separateurEpais} />

          <View style={styles.prixRow}>
            <Text style={styles.prixLabel}>Prix estimé</Text>
            <Text style={styles.prixValeur}>{prixEstime}</Text>
          </View>
        </View>

        {/* Boutons */}
        <View style={styles.boutonsRow}>
          <TouchableOpacity
            style={styles.boutonRefuser}
            onPress={handleRefuser}
            activeOpacity={0.85}
          >
            <Text style={styles.boutonRefuserTexte}>✗  Refuser</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.boutonAccepter}
            onPress={handleAccepter}
            activeOpacity={0.85}
          >
            <Text style={styles.boutonAccepterTexte}>✓  Accepter</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(42,42,42,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  carte: {
    backgroundColor: COLORS.blanc,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 12,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  iconTexte: {
    fontSize: 32,
  },
  titre: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.graphite,
    marginBottom: 4,
  },
  sousTitre: {
    fontSize: 14,
    color: COLORS.taupe,
    marginBottom: 20,
  },
  infoCard: {
    width: '100%',
    backgroundColor: COLORS.ivoire,
    borderRadius: 16,
    padding: 16,
    gap: 4,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 8,
  },
  infoIcone: {
    fontSize: 18,
    marginTop: 2,
  },
  infoContenu: {
    flex: 1,
    gap: 2,
  },
  infoLabel: {
    fontSize: 11,
    color: COLORS.taupe,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValeur: {
    fontSize: 15,
    color: COLORS.graphite,
    fontWeight: '600',
    lineHeight: 21,
  },
  separateur: {
    height: 1,
    backgroundColor: '#E5E0D8',
    marginHorizontal: 4,
  },
  separateurEpais: {
    height: 2,
    backgroundColor: '#E5E0D8',
    marginHorizontal: 4,
    marginTop: 4,
  },
  prixRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  prixLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.graphite,
  },
  prixValeur: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.terracotta,
  },
  boutonsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  boutonRefuser: {
    flex: 1,
    backgroundColor: '#FEE2E2',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FECACA',
  },
  boutonRefuserTexte: {
    fontSize: 15,
    fontWeight: '700',
    color: '#DC2626',
  },
  boutonAccepter: {
    flex: 1.4,
    backgroundColor: '#22C55E',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
  },
  boutonAccepterTexte: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.blanc,
  },
});
