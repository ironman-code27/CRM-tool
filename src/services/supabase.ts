import { createClient } from '@supabase/supabase-js';

let supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Fallback recovery: if the URL is invalid (e.g. placeholder, empty, or custom publishable key),
// attempt to extract the project reference from the JWT anon key.
if (!supabaseUrl || (!supabaseUrl.startsWith('http://') && !supabaseUrl.startsWith('https://'))) {
  console.warn(`Supabase URL "${supabaseUrl}" is invalid. Attempting to extract project reference from the anon key...`);
  try {
    const parts = supabaseAnonKey.split('.');
    if (parts.length === 3) {
      const payload = parts[1];
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
      const jsonPayload = atob(padded);
      const decoded = JSON.parse(jsonPayload);
      if (decoded && decoded.ref) {
        supabaseUrl = `https://${decoded.ref}.supabase.co`;
        console.log(`Successfully recovered Supabase URL from anon key: ${supabaseUrl}`);
      }
    }
  } catch (err) {
    console.error('Failed to extract Supabase project reference from anon key:', err);
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Function to verify connection by fetching data from the existing leads table
export async function verifyConnection() {
  try {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .limit(1);

    if (error) {
      console.error('Supabase connection verification failed:', error.message);
      return { success: false, error };
    }

    console.log('Supabase connection verified successfully! Leads fetched:', data);
    return { success: true, data };
  } catch (err) {
    console.error('Supabase connection verification failed with exception:', err);
    return { success: false, error: err };
  }
}
