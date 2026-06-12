export const COLORS = {
  // Palette principale — NE PAS MODIFIER
  ivoire:    '#FAF8F4',
  graphite:  '#3D3D3D',
  taupe:     '#B0A898',
  terracotta:'#C0522A',
  rouge:     '#D32F2F',
  blanc:     '#FFFFFF',

  // Surfaces sombres (headers)
  surfaceDark:   '#2A2A2A',
  surfaceDeeper: '#1E1E1E',

  // Utilitaires sémantiques
  success:       '#15803D',
  successLight:  '#DCFCE7',
  successBorder: '#86EFAC',

  // Alphas calculés (évite les magic strings inline)
  terracottaGlow:  'rgba(192,82,42,0.18)',
  borderSubtle:    'rgba(61,61,61,0.10)',
  borderLight:     '#E5E0D8',
  overlayLight:    'rgba(255,255,255,0.08)',
  overlayDark:     'rgba(0,0,0,0.50)',
} as const;

export type ColorKey = keyof typeof COLORS;
