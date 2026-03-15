import { createClient } from '@supabase/supabase-js';
import config from '../config/index.js';

const supabaseUrl = config.supabase.url;
const supabaseServiceKey = config.supabase.serviceKey;

if (!supabaseUrl) {
  console.error('Configuração do Supabase ausente:', { url: !!supabaseUrl, key: !!supabaseServiceKey });
  throw new Error('SUPABASE_URL não encontrada. Verifique o arquivo backend/.env.');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default supabase;
