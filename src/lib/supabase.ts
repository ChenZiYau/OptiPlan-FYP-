import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? 'https://zgxmzpzuedqclfvphuqy.supabase.co';
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpneG16cHp1ZWRxY2xmdnBodXF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2ODQ1NjAsImV4cCI6MjA4NzI2MDU2MH0.KN75oa81l0uSZEXcBT3INLqaSEi0nZmG2kzgevIdPLs';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
