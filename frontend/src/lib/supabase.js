import { createClient } from '@supabase/supabase-js';

// O Supabase URL e Anon Key são públicos (anon key, não service key)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase = null;

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    realtime: {
      params: {
        eventsPerSecond: 20,
      },
      // Heartbeat para manter conexão ativa
      heartbeatIntervalMs: 15000,
      // Timeout para reconnect
      reconnectAfterMs: (tries) => {
        // Backoff exponencial: 1s, 2s, 4s, 8s, max 30s
        return Math.min(1000 * Math.pow(2, tries), 30000);
      },
    },
  });
}

export default supabase;
