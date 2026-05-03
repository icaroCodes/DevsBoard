import supabase from '../database/connection.js';

export async function assertProjectAccess(projectIdOrSlug, req) {
  const { userId, teamId } = req;
  const isNumeric = /^\d+$/.test(projectIdOrSlug);
  
  let query = supabase.from('projects').select('id');
  if (isNumeric) query = query.eq('id', projectIdOrSlug);
  else query = query.eq('slug', projectIdOrSlug);
  
  if (teamId) query = query.eq('team_id', teamId);
  else query = query.eq('user_id', userId).is('team_id', null);
  
  const { data } = await query.maybeSingle();
  if (data) {
    req.projectId = data.id;
    return true;
  }
  return false;
}

export async function uploadBase64Image(base64, userId, projectId, prefix) {
  if (!base64 || typeof base64 !== 'string' || !base64.includes(';base64,')) {
    return (typeof base64 === 'string' && base64.startsWith('http')) ? base64 : null;
  }
  const parts = base64.split(',');
  if (parts.length < 2) return null;
  const buffer = Buffer.from(parts[1], 'base64');
  const ext = base64.split(';')[0].split('/')[1] || 'png';
  const fileName = `${userId}/${projectId}-${prefix}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from('project-assets')
    .upload(fileName, buffer, { contentType: `image/${ext}`, upsert: true });
  if (error) throw new Error('Erro no upload da imagem');
  const { data: { publicUrl } } = supabase.storage.from('project-assets').getPublicUrl(fileName);
  return publicUrl;
}
