import { Easing } from 'react-native';
import { COLORS } from './colors';

// ─── SPACING — grille 4/8px (Material Design 8dp) ─────────────────────────
export const SPACING = {
  xs:   4,   // séparateurs fins, padding interne d'icône
  sm:   8,   // gap entre éléments inline (chips, badges)
  md:   16,  // padding card, padding horizontal section
  lg:   24,  // gap entre sections, padding horizontal page
  xl:   32,  // marges larges, espacement fort
  xxl:  48,  // espacement header ↔ contenu
  safe: 52,  // paddingTop safe-area iOS/Android — figer à cette valeur
} as const;

// ─── RADIUS — 5 valeurs fixes ───────────────────────────────────────────────
export const RADIUS = {
  xs:   6,    // badges, petits tags ("DEV", "Fixe", "Actif")
  sm:   10,   // chips heures, inputs, petits boutons secondaires
  md:   14,   // cards principales, boutons CTA, boutons primaires
  lg:   20,   // chips villes (pills), avatars, sélections actives
  xl:   24,   // bottom sheets, grands modaux, header bottom corners
  full: 999,  // boutons pills, avatars circulaires, loaders
} as const;

// ─── SHADOWS — 4 niveaux cohérents ─────────────────────────────────────────
export const SHADOWS = {
  // Niveau 0 — pas d'ombre (état désactivé, fond plat)
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },

  // Niveau 1 — Cards, inputs, boutons secondaires
  card: {
    shadowColor: COLORS.graphite,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },

  // Niveau 2 — Bottom bar sticky, header scroll shadow
  bar: {
    shadowColor: COLORS.graphite,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },

  // Niveau 3 — Modaux, bottom sheets, FAB flottant
  modal: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 12,
  },

  // CTA — Halo terracotta sous le bouton principal
  cta: {
    shadowColor: COLORS.terracotta,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 6,
  },
} as const;

// ─── TYPOGRAPHY — hiérarchie systématique ──────────────────────────────────
// Basée sur le type system iOS 11 Dynamic Type / Material 5 type roles.
// lineHeight = fontSize × 1.4–1.5 pour le confort de lecture mobile.
export const TYPOGRAPHY = {
  // Grands chiffres, titres héros (montants FCFA, KM)
  display: {
    fontSize: 32,
    fontWeight: '900' as const,
    lineHeight: 36,
    letterSpacing: -0.5,
  },

  // Titre d'écran dans le header
  h1: {
    fontSize: 22,
    fontWeight: '800' as const,
    lineHeight: 28,
    letterSpacing: 0.2,
  },

  // Titre de section ("Tournée du matin", "Services")
  h2: {
    fontSize: 17,
    fontWeight: '800' as const,
    lineHeight: 22,
    letterSpacing: 0.2,
  },

  // Titre de card, nom d'enfant, nom de chauffeur
  h3: {
    fontSize: 15,
    fontWeight: '700' as const,
    lineHeight: 20,
  },

  // Corps de texte principal
  body: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 21,
  },

  // Labels de champs, sous-titres de cards, écoles
  caption: {
    fontSize: 12,
    fontWeight: '600' as const,
    lineHeight: 16,
    letterSpacing: 0.3,
  },

  // Badges, tags, petites mentions ("Mode DEV", "FCFA/mois")
  micro: {
    fontSize: 11,
    fontWeight: '700' as const,
    lineHeight: 14,
    letterSpacing: 0.4,
  },

  // Section label — uppercase (ex: "DESTINATION *", "PRIX PAR PLACE")
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700' as const,
    lineHeight: 18,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
  },

  // Données chiffrées — tabular-nums évite le shift de layout
  mono: {
    fontSize: 18,
    fontWeight: '900' as const,
    fontVariant: ['tabular-nums'] as const,
  },
} as const;

// ─── ANIMATION — tokens durée + easing ─────────────────────────────────────
// Easing.bezier(0.16, 1, 0.3, 1) = expo-out — démarre vite, s'installe doucement.
// Recommandé par le skill pour les apps transport mobile premium.
const _easingEnter    = Easing.bezier(0.16, 1, 0.3, 1);
const _easingExit     = Easing.bezier(0.4, 0, 1, 1);
const _easingStandard = Easing.bezier(0.4, 0, 0.2, 1);

export const ANIMATION = {
  duration: {
    instant: 100,  // press highlight (dans les 80–100ms requis par Apple HIG)
    fast:    150,  // micro-interactions (badge appear, icon swap)
    normal:  250,  // transitions de composants (modal slide, card expand)
    slow:    350,  // transitions de page (screen push/pop)
  } as const,

  easing: {
    enter:    _easingEnter,    // entrée — expo-out
    exit:     _easingExit,     // sortie — accélération
    standard: _easingStandard, // standard — Material
  },

  // Animated.spring — pour modaux et bottom sheets
  spring: {
    damping:         20,
    stiffness:       90,
    useNativeDriver: true,
  } as const,

  // Feedback visuel sur press de cards/boutons
  press: {
    scale:    0.97,
    duration: 100,
  } as const,

  // Décalage entre items de liste (stagger entrance)
  stagger: 40,
} as const;

// ─── TOUCH — taille minimale des cibles tactiles ───────────────────────────
// iOS HIG : 44×44pt / Android Material : 48×48dp
export const TOUCH = {
  minSize:    48,  // hauteur/largeur minimale d'une zone tappable
  minButton:  52,  // hauteur minimale des boutons principaux
  iconButton: 44,  // boutons icon-only (retour, fermer, menu)
} as const;
