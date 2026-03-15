import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// O arquivo está em backend/.env, e o script em backend/src/config/index.js
// Portanto, subir 2 níveis: src -> backend
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
            // Remove aspas se existirem
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
    secret: process.env.JWT_SECRET || fileEnv.JWT_SECRET || 'devsboard-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || fileEnv.JWT_EXPIRES_IN || '7d',
  },
  server: {
    port: parseInt(process.env.PORT || fileEnv.PORT || '3001', 10),
    nodeEnv: process.env.NODE_ENV || fileEnv.NODE_ENV || 'development',
  },
};

console.log('🚀 Configuração carregada para Supabase URL:', config.supabase.url ? '✅ Definida' : '❌ NÃO DEFINIDA');

export default config;
