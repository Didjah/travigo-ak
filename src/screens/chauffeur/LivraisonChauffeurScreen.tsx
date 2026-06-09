import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS } from '../../constants/colors';
import { RootStackParamList } from '../../navigation/types';
import { getSessionUser } from '../../services/session';
import {
  getLivraisonsDisponibles,
  getLivraisonsLivreur,
  accepterLivraison,
  avancerStatut,
  prochainStatut,
  TYPES_LIVRAISON,
  STATUTS,
  type Livraison,
} from '../../services/livraisonService';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'LivraisonChauffeur'>;
};

const DEV_DISPONIBLES: Livraison[] = [
  {
    id: 'dev-a',
    expediteur_id: 'u1',
    livreur_id: null,
    description_colis: 'Vêtements pour enfants',
    adresse_collecte: 'Marché central de Gagnoa',
    adresse_livraison: 'Quartier Bromakote, rue 12',
    type: 'colis',
    prix_fcfa: 1000,
    statut: 'en_attente',
    created_at: new Date().toISOString(),
  },
  {
    id: 'dev-b',
    expediteur_id: 'u2',
    livreur_id: null,
    description_colis: 'Doliprane 1000mg + sirop',
    adresse_collecte: 'Pharmacie Centrale Gagnoa',
    adresse_livraison: 'Résidence Les Palmiers',
    type: 'medicament',
    prix_fcfa: 800,
    statut: 'en_attente',
    created_at: new Date().toISOString(),
  },
];

function AdresseTrajet({ collecte, livraison }: { collecte: string; livraison: string }) {
  return (
    <View style={styles.trajet}>
      <View style={styles.trajetCol}>
        <View style={styles.pointDepart} />
        <View style={styles.trajetTiret} />
        <View style={styles.pointArrivee} />
      </View>
      <View style={styles.trajetTextes}>
        <Text style={styles.trajetAdresse} numberOfLines={1}>{collecte}</Text>
        <Text style={styles.trajetAdresseDest} numberOfLines={1}>{livraison}</Text>
      </View>
    </View>
  );
}

function CarteDisponible({
  liv,
  onAccepter,
  enCours,
}: {
  liv: Livraison;
  onAccepter: (id: string) => void;
  enCours: boolean;
}) {
  const info = TYPES_LIVRAISON[liv.type];
  return (
    <View style={styles.carte}>
      <View style={styles.carteTop}>
        <View style={styles.carteIconeWrapper}>
          <Text style={styles.carteIcone}>{info.emoji}</Text>
        </View>
        <View style={styles.carteTextes}>
          <Text style={styles.carteDesc} numberOfLines={1}>{liv.description_colis}</Text>
          <Text style={styles.carteType}>{info.label}</Text>
        </View>
        <Text style={styles.cartePrix}>{liv.prix_fcfa.toLocaleString('fr-FR')} F</Text>
      </View>
      <AdresseTrajet collecte={liv.adresse_collecte} livraison={liv.adresse_livraison} />
      <TouchableOpacity
        style={[styles.boutonAccepter, enCours && styles.boutonDesactive]}
        onPress={() => onAccepter(liv.id)}
        activeOpacity={0.85}
        disabled={enCours}
      >
        {enCours ? (
          <ActivityIndicator color={COLORS.blanc} size="small" />
        ) : (
          <Text style={styles.boutonAccepterTexte}>✓ Accepter la livraison</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

function CarteEnCours({
  liv,
  onAvancer,
  enCours,
}: {
  liv: Livraison;
  onAvancer: (liv: Livraison) => void;
  enCours: boolean;
}) {
  const info = TYPES_LIVRAISON[liv.type];
  const statut = STATUTS[liv.statut];
  const suivant = prochainStatut(liv.statut);

  const couleurBouton: Record<string, string> = {
    acceptee: '#1565C0',
    collecte:  '#E65100',
    en_route:  '#2E7D32',
  };

  return (
    <View style={[styles.carte, styles.carteEnCours]}>
      <View style={styles.carteTop}>
        <View style={styles.carteIconeWrapper}>
          <Text style={styles.carteIcone}>{info.emoji}</Text>
        </View>
        <View style={styles.carteTextes}>
          <Text style={styles.carteDesc} numberOfLines={1}>{liv.description_colis}</Text>
          <Text style={styles.carteType}>{info.label}</Text>
        </View>
        <View style={[styles.statutBadge, { backgroundColor: statut.bg }]}>
          <Text style={[styles.statutTexte, { color: statut.color }]}>{statut.label}</Text>
        </View>
      </View>
      <AdresseTrajet collecte={liv.adresse_collecte} livraison={liv.adresse_livraison} />
      {suivant && (
        <TouchableOpacity
          style={[
            styles.boutonAvancer,
            { backgroundColor: couleurBouton[liv.statut] ?? COLORS.graphite },
            enCours && styles.boutonDesactive,
          ]}
          onPress={() => onAvancer(liv)}
          activeOpacity={0.85}
          disabled={enCours}
        >
          {enCours ? (
            <ActivityIndicator color={COLORS.blanc} size="small" />
          ) : (
            <Text style={styles.boutonAvancerTexte}>{suivant.label}</Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function LivraisonChauffeurScreen({ navigation }: Props) {
  const [disponibles, setDisponibles] = useState<Livraison[]>([]);
  const [enCours, setEnCours] = useState<Livraison[]>([]);
  const [chargement, setChargement] = useState(true);
  const [rafraichissement, setRafraichissement] = useState(false);
  const [actionEnCours, setActionEnCours] = useState<string | null>(null);

  const charger = useCallback(async (silencieux = false) => {
    if (!silencieux) setChargement(true);
    const user = getSessionUser();

    if (__DEV__ || !user) {
      setDisponibles(DEV_DISPONIBLES);
      setEnCours([]);
      setChargement(false);
      setRafraichissement(false);
      return;
    }

    const [dispo, mien] = await Promise.all([
      getLivraisonsDisponibles(),
      getLivraisonsLivreur(user.id),
    ]);
    setDisponibles(dispo);
    setEnCours(mien);
    setChargement(false);
    setRafraichissement(false);
  }, []);

  useEffect(() => { charger(); }, [charger]);

  useEffect(() => {
    const unsub = navigation.addListener('focus', () => charger(true));
    return unsub;
  }, [navigation, charger]);

  async function handleAccepter(livraisonId: string) {
    const user = getSessionUser();
    if (!user && !__DEV__) return;

    Alert.alert(
      'Accepter la livraison',
      'Confirmez-vous la prise en charge de cette livraison ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Accepter',
          onPress: async () => {
            if (__DEV__) {
              setDisponibles((prev) => prev.filter((l) => l.id !== livraisonId));
              const liv = DEV_DISPONIBLES.find((l) => l.id === livraisonId);
              if (liv) setEnCours((prev) => [...prev, { ...liv, statut: 'acceptee', livreur_id: 'dev' }]);
              return;
            }
            setActionEnCours(livraisonId);
            const ok = await accepterLivraison(livraisonId, user!.id);
            setActionEnCours(null);
            if (ok) {
              charger(true);
            } else {
              Alert.alert('Erreur', 'Cette livraison a peut-être déjà été prise. Actualisez la liste.');
            }
          },
        },
      ]
    );
  }

  async function handleAvancer(liv: Livraison) {
    const suivant = prochainStatut(liv.statut);
    if (!suivant) return;

    if (__DEV__) {
      setEnCours((prev) =>
        prev.map((l) => (l.id === liv.id ? { ...l, statut: suivant.statut } : l))
      );
      return;
    }

    setActionEnCours(liv.id);
    const ok = await avancerStatut(liv.id, suivant.statut);
    setActionEnCours(null);
    if (ok) {
      if (suivant.statut === 'livree') {
        Alert.alert('Livraison effectuée !', 'Merci. La livraison a été marquée comme terminée.', [
          { text: 'OK', onPress: () => charger(true) },
        ]);
      } else {
        charger(true);
      }
    } else {
      Alert.alert('Erreur', 'Impossible de mettre à jour le statut.');
    }
  }

  const sections = [
    ...(enCours.length > 0
      ? [{ title: '🚚 Mes livraisons en cours', data: enCours, type: 'encours' as const }]
      : []),
    ...(disponibles.length > 0
      ? [{ title: '📋 Livraisons disponibles', data: disponibles, type: 'dispo' as const }]
      : []),
  ];

  return (
    <View style={styles.container}>
      {/* En-tête */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.retourBtn}>
            <Text style={styles.retourTexte}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitre}>Livraisons</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.resumeRow}>
          <View style={styles.resumeCard}>
            <Text style={styles.resumeValeur}>{disponibles.length}</Text>
            <Text style={styles.resumeLabel}>Disponibles</Text>
          </View>
          <View style={[styles.resumeCard, styles.resumeCardPrincipal]}>
            <Text style={[styles.resumeValeur, { color: COLORS.blanc }]}>{enCours.length}</Text>
            <Text style={[styles.resumeLabel, { color: 'rgba(255,255,255,0.75)' }]}>En cours</Text>
          </View>
          <View style={styles.resumeCard}>
            <Text style={styles.resumeValeur}>
              {[...disponibles, ...enCours]
                .reduce((s, l) => s + l.prix_fcfa, 0)
                .toLocaleString('fr-FR')}
            </Text>
            <Text style={styles.resumeLabel}>FCFA tot.</Text>
          </View>
        </View>
      </View>

      {chargement ? (
        <View style={styles.centred}>
          <ActivityIndicator color={COLORS.terracotta} size="large" />
          <Text style={styles.loaderTexte}>Chargement des livraisons…</Text>
        </View>
      ) : sections.length === 0 ? (
        <View style={styles.centred}>
          <Text style={styles.videIcone}>📦</Text>
          <Text style={styles.videTitre}>Aucune livraison</Text>
          <Text style={styles.videSous}>
            Aucune livraison disponible pour le moment.{'\n'}Revenez dans quelques instants.
          </Text>
          <TouchableOpacity
            style={styles.boutonRecharger}
            onPress={() => { setRafraichissement(true); charger(); }}
          >
            <Text style={styles.boutonRechargerTexte}>↻ Actualiser</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.liste}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={rafraichissement}
              onRefresh={() => { setRafraichissement(true); charger(); }}
              tintColor={COLORS.terracotta}
            />
          }
          renderSectionHeader={({ section }) => (
            <Text style={styles.sectionTitre}>{section.title}</Text>
          )}
          renderItem={({ item, section }) =>
            section.type === 'dispo' ? (
              <CarteDisponible
                liv={item}
                onAccepter={handleAccepter}
                enCours={actionEnCours === item.id}
              />
            ) : (
              <CarteEnCours
                liv={item}
                onAvancer={handleAvancer}
                enCours={actionEnCours === item.id}
              />
            )
          }
          stickySectionHeadersEnabled={false}
        />
      )}

      {__DEV__ && (
        <View style={styles.devBanner}>
          <Text style={styles.devTexte}>Mode DEV — 2 livraisons simulées</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1E1E1E' },
  header: {
    backgroundColor: '#2A2A2A',
    paddingTop: 52,
    paddingBottom: 20,
    paddingHorizontal: 20,
    gap: 18,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  retourBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  retourTexte: { fontSize: 20, color: COLORS.ivoire, fontWeight: '700' },
  headerTitre: { fontSize: 18, fontWeight: '800', color: COLORS.ivoire, letterSpacing: 0.3 },
  resumeRow: { flexDirection: 'row', gap: 10 },
  resumeCard: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 12, paddingVertical: 12, alignItems: 'center', gap: 3,
  },
  resumeCardPrincipal: {
    backgroundColor: COLORS.terracotta,
    shadowColor: COLORS.terracotta,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35, shadowRadius: 6, elevation: 4,
  },
  resumeValeur: { fontSize: 17, fontWeight: '900', color: COLORS.ivoire },
  resumeLabel: { fontSize: 10, color: '#9CA3AF', fontWeight: '600' },
  centred: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    gap: 12, backgroundColor: COLORS.ivoire,
  },
  loaderTexte: { fontSize: 13, color: COLORS.taupe },
  videIcone: { fontSize: 52 },
  videTitre: { fontSize: 17, fontWeight: '700', color: COLORS.graphite, textAlign: 'center' },
  videSous: { fontSize: 13, color: COLORS.taupe, textAlign: 'center', maxWidth: 280, lineHeight: 18 },
  boutonRecharger: {
    backgroundColor: COLORS.terracotta, borderRadius: 12,
    paddingHorizontal: 24, paddingVertical: 11, marginTop: 8,
  },
  boutonRechargerTexte: { fontSize: 14, fontWeight: '700', color: COLORS.blanc },
  liste: {
    backgroundColor: COLORS.ivoire,
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40, gap: 10,
  },
  sectionTitre: {
    fontSize: 13, fontWeight: '800', color: COLORS.graphite,
    marginBottom: 4, marginTop: 8,
  },

  // Carte
  carte: {
    backgroundColor: COLORS.blanc, borderRadius: 16,
    padding: 16, gap: 12,
    shadowColor: COLORS.graphite,
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07,
    shadowRadius: 8, elevation: 2,
  },
  carteEnCours: { borderLeftWidth: 3, borderLeftColor: COLORS.terracotta },
  carteTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  carteIconeWrapper: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: '#FFF4F0', alignItems: 'center', justifyContent: 'center',
  },
  carteIcone: { fontSize: 20 },
  carteTextes: { flex: 1, gap: 2 },
  carteDesc: { fontSize: 14, fontWeight: '700', color: COLORS.graphite },
  carteType: { fontSize: 11, color: COLORS.taupe },
  cartePrix: { fontSize: 14, fontWeight: '800', color: COLORS.terracotta },
  statutBadge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20 },
  statutTexte: { fontSize: 11, fontWeight: '700' },

  // Trajet
  trajet: {
    flexDirection: 'row', gap: 10, alignItems: 'stretch',
    borderTopWidth: 1, borderTopColor: '#F0EDE8', paddingTop: 10,
  },
  trajetCol: { alignItems: 'center', paddingTop: 3, gap: 2 },
  pointDepart: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.terracotta,
  },
  trajetTiret: { width: 1.5, flex: 1, backgroundColor: '#E5E0D8', minHeight: 12 },
  pointArrivee: {
    width: 8, height: 8, borderRadius: 2, backgroundColor: COLORS.graphite,
  },
  trajetTextes: { flex: 1, gap: 8 },
  trajetAdresse: { fontSize: 12, color: COLORS.taupe, fontWeight: '500' },
  trajetAdresseDest: { fontSize: 13, color: COLORS.graphite, fontWeight: '700' },

  // Boutons
  boutonAccepter: {
    backgroundColor: '#1B5E20', borderRadius: 12,
    paddingVertical: 13, alignItems: 'center',
    shadowColor: '#1B5E20', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25, shadowRadius: 6, elevation: 3,
  },
  boutonAccepterTexte: { fontSize: 14, fontWeight: '700', color: COLORS.blanc },
  boutonAvancer: {
    borderRadius: 12, paddingVertical: 13, alignItems: 'center',
    shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25,
    shadowRadius: 6, elevation: 3,
  },
  boutonAvancerTexte: { fontSize: 14, fontWeight: '700', color: COLORS.blanc },
  boutonDesactive: { opacity: 0.5, elevation: 0, shadowOpacity: 0 },

  devBanner: {
    backgroundColor: '#3D3200', borderTopWidth: 1, borderTopColor: '#7A6300',
    paddingVertical: 8, alignItems: 'center',
  },
  devTexte: { fontSize: 11, color: '#FFD700', fontWeight: '600' },
});
