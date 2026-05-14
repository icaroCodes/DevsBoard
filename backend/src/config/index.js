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
            // Inject into process.env so routes that read process.env directly can find them
            if (!process.env[key]) {
              process.env[key] = fileEnv[key];
            }
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

const accessSecret =
  process.env.JWT_ACCESS_SECRET ||
  fileEnv.JWT_ACCESS_SECRET ||
  process.env.JWT_SECRET ||
  fileEnv.JWT_SECRET;

const refreshSecret =
  process.env.JWT_REFRESH_SECRET || fileEnv.JWT_REFRESH_SECRET;

// Hard fail if secrets are missing. A fallback string here would be a
// public-knowledge signing key and let anyone forge tokens for any user.
const missing = [];
if (!accessSecret) missing.push('JWT_ACCESS_SECRET (or JWT_SECRET)');
if (!refreshSecret) missing.push('JWT_REFRESH_SECRET');
if (missing.length > 0) {
  throw new Error(
    `Configuração inválida: variáveis obrigatórias ausentes: ${missing.join(', ')}. ` +
    `Defina-as no backend/.env antes de iniciar o servidor.`
  );
}

// Refuse weak / placeholder secrets even if the operator set them by accident.
const WEAK_SECRETS = new Set([
  'strong-access-secret-mandatory',
  'strong-refresh-secret-mandatory',
  'secret',
  'changeme',
  'devsboard',
]);
for (const [label, value] of [['JWT_ACCESS_SECRET', accessSecret], ['JWT_REFRESH_SECRET', refreshSecret]]) {
  if (WEAK_SECRETS.has(value) || value.length < 32) {
    throw new Error(
      `Configuração inválida: ${label} é fraco ou um placeholder. ` +
      `Use uma string aleatória de pelo menos 32 caracteres.`
    );
  }
}

if (accessSecret === refreshSecret) {
  throw new Error('JWT_ACCESS_SECRET e JWT_REFRESH_SECRET precisam ser diferentes.');
}

const config = {
  supabase: {
    url: process.env.SUPABASE_URL || fileEnv.SUPABASE_URL,
    serviceKey: process.env.SUPABASE_SERVICE_KEY || fileEnv.SUPABASE_SERVICE_KEY,
    jwtSecret: process.env.SUPABASE_JWT_SECRET || fileEnv.SUPABASE_JWT_SECRET,
  },
  jwt: {
    accessSecret,
    refreshSecret,
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
