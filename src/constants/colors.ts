export const COLORS = {
  ivoire: '#FAF8F4',
  graphite: '#3D3D3D',
  taupe: '#B0A898',
  terracotta: '#C0522A',
  rouge: '#D32F2F',
  blanc: '#FFFFFF',
} as const;

export type ColorKey = keyof typeof COLORS;
