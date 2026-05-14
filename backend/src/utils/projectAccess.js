import { supabaseAdmin } from '../database/connection.js';
import { supabaseForRequest } from './supabaseClient.js';

/**
 * Verifies if the current user has access to a project by ID or slug.
 * Uses request-scoped client to delegate authorization to RLS policies.
 */
export async function assertProjectAccess(projectIdOrSlug, req) {
  const supabase = await supabaseForRequest(req);
  const isNumeric = /^\d+$/.test(projectIdOrSlug);
  
  let query = supabase.from('projects').select('id');
  if (isNumeric) query = query.eq('id', projectIdOrSlug);
  else query = query.eq('slug', projectIdOrSlug);
  
  // Manual filtering removed: RLS in the database handles visibility
  // based on user_id and team_membership.
  const { data } = await query.maybeSingle();
  
  if (data) {
    req.projectId = data.id;
    return true;
  }
  return false;
}

/**
 * System-level utility for base64 image uploads.
 * Uses service-role (supabaseAdmin) for storage management.
 */
export async function uploadBase64Image(base64, userId, projectId, prefix) {
  if (!base64 || typeof base64 !== 'string' || !base64.includes(';base64,')) {
    return (typeof base64 === 'string' && base64.startsWith('http')) ? base64 : null;
  }
  const parts = base64.split(',');
  if (parts.length < 2) return null;
  const buffer = Buffer.from(parts[1], 'base64');
  const ext = base64.split(';')[0].split('/')[1] || 'png';
  const fileName = `${userId}/${projectId}-${prefix}-${Date.now()}.${ext}`;
  const { error } = await supabaseAdmin.storage
    .from('project-assets')
    .upload(fileName, buffer, { contentType: `image/${ext}`, upsert: true });
  if (error) throw new Error('Erro no upload da imagem');
  const { data: { publicUrl } } = supabaseAdmin.storage.from('project-assets').getPublicUrl(fileName);
  return publicUrl;
}
