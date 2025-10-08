import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl: string = "https://aftlhyhiskoeyflfiljr.supabase.co";
const supabaseAnonKey: string = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmdGxoeWhpc2tvZXlmbGZpbGpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0MTE4MTUsImV4cCI6MjA3MDk4NzgxNX0.qIme7fEG4B4urkgpgIeUs4RuNFxNc57_fOsQqt07QZc";

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);
