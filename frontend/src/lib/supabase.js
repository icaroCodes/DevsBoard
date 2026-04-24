import { createClient } from '@supabase/supabase-js';


const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase = null;

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    realtime: {
      params: {
        eventsPerSecond: 20,
      },
      
      heartbeatIntervalMs: 15000,
      
      reconnectAfterMs: (tries) => {
        
        return Math.min(1000 * Math.pow(2, tries), 30000);
      },
    },
  });
}

export default supabase;
