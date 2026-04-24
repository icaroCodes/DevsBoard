import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));


const envPath = path.resolve(__dirname, '../../.env');

const loadEnv = () => {
  const fileEnv = {};
  try {
    if (fs.existsSync(envPath)) {
      console.log('📖 Lendo arquivo .env em:', envPath);
      const content = fs.readFileSync(envPath, 'utf8');
      
      content.split(/\r?\n/).forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const index = trimmed.indexOf('=');
          if (index > 0) {
            const key = trimmed.substring(0, index).trim();
            const value = trimmed.substring(index + 1).trim();
            
            fileEnv[key] = value.replace(/^["']|["']$/g, '');
          }
        }
      });
      console.log('🔑 Chaves carregadas do arquivo:', Object.keys(fileEnv));
    } else {
      console.warn('⚠️ Arquivo .env não encontrado em:', envPath);
    }
  } catch (err) {
    console.error('❌ Erro ao ler .env:', err.message);
  }
  return fileEnv;
};

const fileEnv = loadEnv();

const config = {
  supabase: {
    url: process.env.SUPABASE_URL || fileEnv.SUPABASE_URL,
    serviceKey: process.env.SUPABASE_SERVICE_KEY || fileEnv.SUPABASE_SERVICE_KEY,
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || fileEnv.JWT_ACCESS_SECRET || process.env.JWT_SECRET || fileEnv.JWT_SECRET || 'strong-access-secret-mandatory',
    refreshSecret: process.env.JWT_REFRESH_SECRET || fileEnv.JWT_REFRESH_SECRET || 'strong-refresh-secret-mandatory',
    accessExpires: '15m',
    refreshExpires: '7d',
  },
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', 
  },
  server: {
    port: parseInt(process.env.PORT || fileEnv.PORT || '3001', 10),
    nodeEnv: process.env.NODE_ENV || fileEnv.NODE_ENV || 'development',
  },
};

console.log('🚀 Configuração carregada para Supabase URL:', config.supabase.url ? '✅ Definida' : '❌ NÃO DEFINIDA');

export default config;
