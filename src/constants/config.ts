export const CONFIG = {
  appName: 'TRAVIGO-AK',
  ville: 'Gagnoa',
  pays: 'Côte d\'Ivoire',
  devise: 'FCFA',
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
} as const;
