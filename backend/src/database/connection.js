import { createClient } from '@supabase/supabase-js';
import config from '../config/index.js';

const supabase = createClient(config.supabase.url, config.supabase.serviceKey);

export default supabase;
