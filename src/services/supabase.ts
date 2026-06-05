import { createClient } from '@supabase/supabase-js';
import { CONFIG } from '../constants/config';

export const supabase = createClient(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey);
