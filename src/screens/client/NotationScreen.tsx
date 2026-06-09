import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { COLORS } from '../../constants/colors';
import { RootStackParamList } from '../../navigation/types';
import { supabase } from '../../services/supabase';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Notation'>;
  route: RouteProp<RootStackParamList, 'Notation'>;
};

const LABELS_NOTE = ['', 'Très mauvais', 'Mauvais', 'Correct', 'Bien', 'Excellent !'];

export default function NotationScreen({ navigation, route }: Props) {
  const { nom, courseId } = route.params;
  const [note, setNote] = useState(0);
  const [commentaire, setCommentaire] = useState('');
  const [chargement, setChargement] = useState(false);

  async function handleEnvoyer() {
    if (note === 0) {
      Alert.alert('Note requise', 'Sélectionnez au moins une étoile pour continuer.');
      return;
    }
    setChargement(true);

    if (courseId && !__DEV__) {
      await supabase
        .from('courses')
        .update({
          note_chauffeur: note,
          commentaire_passager: commentaire.trim() || null,
        })
        .eq('id', courseId);
    }

    setChargement(false);
    navigation.replace('Home', { nom });
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        {/* En-tête */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>🚖</Text>
          </View>
          <Text style={styles.titre}>Notez votre course</Text>
          <Text style={styles.sousTitre}>
            Votre avis aide à améliorer le service pour tous
          </Text>
        </View>

        {/* Étoiles interactives */}
        <View style={styles.etoilesSection}>
          <View style={styles.etoilesContainer}>
            {[1, 2, 3, 4, 5].map((n) => (
              <TouchableOpacity
                key={n}
                onPress={() => setNote(n)}
                activeOpacity={0.6}
                style={styles.etoileBouton}
              >
                <Text style={[styles.etoile, n <= note && styles.etoileActive]}>★</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.noteLabel}>
            {note > 0 ? LABELS_NOTE[note] : 'Sélectionnez une note'}
          </Text>
        </View>

        {/* Commentaire */}
        <View style={styles.commentaireSection}>
          <Text style={styles.commentaireLabel}>Commentaire (optionnel)</Text>
          <TextInput
            style={styles.commentaireInput}
            placeholder="Comment s'est passée votre course ?"
            placeholderTextColor={COLORS.taupe}
            value={commentaire}
            onChangeText={setCommentaire}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            maxLength={300}
          />
          {commentaire.length > 0 && (
            <Text style={styles.compteurChar}>{commentaire.length}/300</Text>
          )}
        </View>

        {/* Boutons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.boutonEnvoyer, note === 0 && styles.boutonDesactive]}
            onPress={handleEnvoyer}
            activeOpacity={0.85}
            disabled={chargement || note === 0}
          >
            {chargement ? (
              <ActivityIndicator color={COLORS.blanc} size="small" />
            ) : (
              <Text style={styles.boutonEnvoyerTexte}>Envoyer ma note</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.boutonIgnorer}
            onPress={() => navigation.replace('Home', { nom })}
            activeOpacity={0.7}
          >
            <Text style={styles.boutonIgnorerTexte}>Ignorer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.ivoire,
  },
  inner: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 40,
    paddingBottom: 36,
    gap: 28,
    alignItems: 'center',
  },

  // En-tête
  header: {
    alignItems: 'center',
    gap: 10,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  icon: {
    fontSize: 36,
  },
  titre: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.graphite,
    textAlign: 'center',
  },
  sousTitre: {
    fontSize: 13,
    color: COLORS.taupe,
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 19,
  },

  // Étoiles
  etoilesSection: {
    alignItems: 'center',
    gap: 12,
  },
  etoilesContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  etoileBouton: {
    padding: 4,
  },
  etoile: {
    fontSize: 46,
    color: '#E5E0D8',
  },
  etoileActive: {
    color: '#F59E0B',
  },
  noteLabel: {
    fontSize: 14,
    color: COLORS.taupe,
    fontWeight: '600',
    minHeight: 20,
  },

  // Commentaire
  commentaireSection: {
    width: '100%',
    gap: 8,
  },
  commentaireLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.graphite,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  commentaireInput: {
    backgroundColor: COLORS.blanc,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E0D8',
    padding: 14,
    fontSize: 14,
    color: COLORS.graphite,
    minHeight: 100,
  },
  compteurChar: {
    fontSize: 11,
    color: COLORS.taupe,
    alignSelf: 'flex-end',
  },

  // Boutons
  actions: {
    width: '100%',
    gap: 10,
    marginTop: 'auto',
  },
  boutonEnvoyer: {
    backgroundColor: COLORS.terracotta,
    borderRadius: 14,
    paddingVertical: 17,
    alignItems: 'center',
    shadowColor: COLORS.terracotta,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 5,
  },
  boutonDesactive: {
    opacity: 0.4,
    shadowOpacity: 0,
    elevation: 0,
  },
  boutonEnvoyerTexte: {
    color: COLORS.blanc,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  boutonIgnorer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  boutonIgnorerTexte: {
    fontSize: 14,
    color: COLORS.taupe,
    fontWeight: '600',
  },
});
