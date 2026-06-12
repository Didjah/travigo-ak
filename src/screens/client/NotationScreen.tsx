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
import { SPACING, RADIUS, SHADOWS, TYPOGRAPHY, TOUCH } from '../../constants/tokens';
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
  container: { flex: 1, backgroundColor: COLORS.ivoire },
  inner: {
    flex: 1,
    paddingHorizontal: SPACING.xl - 4,
    paddingTop: SPACING.xl + SPACING.sm,
    paddingBottom: SPACING.xl,
    gap: SPACING.xl - 4,
    alignItems: 'center',
  },

  header: { alignItems: 'center', gap: SPACING.sm + 2 },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: RADIUS.full,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  icon: { fontSize: 36 },
  titre: { fontSize: 24, fontWeight: '800', color: COLORS.graphite, textAlign: 'center' },
  sousTitre: {
    ...TYPOGRAPHY.caption,
    color: COLORS.taupe,
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 19,
    fontWeight: '400',
  },

  etoilesSection: { alignItems: 'center', gap: SPACING.md - 4 },
  etoilesContainer: { flexDirection: 'row', gap: SPACING.xs + 2 },
  etoileBouton: { padding: SPACING.xs, minWidth: TOUCH.iconButton, alignItems: 'center' },
  etoile: { fontSize: 46, color: COLORS.borderLight },
  etoileActive: { color: '#F59E0B' },
  noteLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.taupe,
    fontWeight: '600',
    minHeight: 20,
  },

  commentaireSection: { width: '100%', gap: SPACING.sm },
  commentaireLabel: {
    ...TYPOGRAPHY.micro,
    color: COLORS.graphite,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  commentaireInput: {
    backgroundColor: COLORS.blanc,
    borderRadius: RADIUS.sm,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
    padding: SPACING.md - 2,
    ...TYPOGRAPHY.body,
    color: COLORS.graphite,
    minHeight: 100,
  },
  compteurChar: { ...TYPOGRAPHY.micro, color: COLORS.taupe, alignSelf: 'flex-end', fontWeight: '400' },

  actions: { width: '100%', gap: SPACING.sm + 2, marginTop: 'auto' },
  boutonEnvoyer: {
    backgroundColor: COLORS.terracotta,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md + 1,
    alignItems: 'center',
    minHeight: TOUCH.minButton,
    ...SHADOWS.cta,
  },
  boutonDesactive: { opacity: 0.4, shadowOpacity: 0, elevation: 0 },
  boutonEnvoyerTexte: { ...TYPOGRAPHY.h2, color: COLORS.blanc, letterSpacing: 0.4 },
  boutonIgnorer: {
    alignItems: 'center',
    paddingVertical: SPACING.md - 4,
    minHeight: TOUCH.minSize,
    justifyContent: 'center',
  },
  boutonIgnorerTexte: { ...TYPOGRAPHY.caption, color: COLORS.taupe, fontWeight: '600' },
});
