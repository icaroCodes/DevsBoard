import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import config from '../config/index.js';

// Garante que o backend use sempre o arquivo backend/.env
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL || config.supabase.url;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || config.supabase.serviceKey;

if (!supabaseUrl) {
  throw new Error('SUPABASE_URL não encontrada. Verifique o arquivo backend/.env.');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default supabase;
