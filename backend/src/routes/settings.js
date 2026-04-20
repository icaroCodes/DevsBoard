import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import supabase from '../database/connection.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    // Query principal — colunas que sempre existem
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, avatar_url, created_at, language, theme, wallpaper_url, wallpaper_opacity, wallpaper_type, audio_url, audio_volume, audio_enabled, audio_name, audio_artist, audio_cover_url')
      .eq('id', req.userId)
      .single();
    if (error || !data) return res.status(404).json({ error: 'Usuário não encontrado' });

    // Streak — query separada; silenciosamente retorna 0 se colunas não existirem
    const { data: streakRow } = await supabase
      .from('users')
      .select('current_streak, longest_streak, last_access_date')
      .eq('id', req.userId)
      .single();

    // Tempo total — silenciosamente retorna 0 se tabela não existir
    const { data: sessions } = await supabase
      .from('user_sessions')
      .select('active_seconds')
      .eq('user_id', req.userId);

    const totalSeconds = (sessions || []).reduce((sum, s) => sum + (s.active_seconds || 0), 0);
    const accountAgeDays = data.created_at
      ? Math.floor((Date.now() - new Date(data.created_at).getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    res.json({
      ...data,
      current_streak: streakRow?.current_streak || 0,
      longest_streak: streakRow?.longest_streak || 0,
      last_access_date: streakRow?.last_access_date || null,
      total_usage_seconds: totalSeconds,
      account_age_days: accountAgeDays,
      wallpaper_url: data.wallpaper_url || null,
      wallpaper_opacity: data.wallpaper_opacity ?? 15,
      wallpaper_type: data.wallpaper_type || 'image',
      audio_url: data.audio_url || null,
      audio_volume: data.audio_volume ?? 50,
      audio_enabled: data.audio_enabled ?? true,
      audio_name: data.audio_name || null,
      audio_artist: data.audio_artist || null,
      audio_cover_url: data.audio_cover_url || null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao carregar configurações' });
  }
});

router.put('/', [
  body('name').optional().trim().notEmpty().withMessage('Nome é obrigatório'),
  body('avatar_url').optional().isURL().withMessage('Avatar inválido'),
  body('language').optional().isIn(['pt', 'en']).withMessage('Idioma inválido'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const {
      name, avatar_url, avatar_base64, language, theme,
      wallpaper_base64, wallpaper_url: wpUrl, wallpaper_opacity, wallpaper_type,
      audio_base64, audio_url: aUrl, audio_volume, audio_enabled,
      audio_name, audio_artist, audio_cover_base64,
    } = req.body;
    const updateData = {};
    if (name) updateData.name = name;
    if (language !== undefined) updateData.language = language;
    if (theme !== undefined) updateData.theme = theme;
    if (wallpaper_opacity !== undefined) updateData.wallpaper_opacity = Math.max(0, Math.min(100, parseInt(wallpaper_opacity) || 15));
    if (audio_volume !== undefined) updateData.audio_volume = Math.max(0, Math.min(100, parseInt(audio_volume) || 50));
    if (audio_enabled !== undefined) updateData.audio_enabled = !!audio_enabled;
    if (audio_name !== undefined) updateData.audio_name = audio_name || null;
    if (audio_artist !== undefined) updateData.audio_artist = audio_artist || null;

    // Se houver uma imagem em base64, fazer o upload para o Supabase Storage
    if (avatar_base64) {
      try {
        const buffer = Buffer.from(avatar_base64.split(',')[1], 'base64');
        const fileExt = avatar_base64.split(';')[0].split('/')[1];
        const fileName = `${req.userId}-${Date.now()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, buffer, {
            contentType: `image/${fileExt}`,
            upsert: true
          });

        if (uploadError) {
          console.error('Erro no upload Storage:', uploadError);
          return res.status(500).json({ error: 'Erro ao fazer upload da imagem' });
        }

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        updateData.avatar_url = publicUrl;
      } catch (err) {
        console.error('Erro ao processar Base64:', err);
        return res.status(400).json({ error: 'Formato de imagem inválido' });
      }
    } else if (avatar_url !== undefined) {
      updateData.avatar_url = avatar_url;
    }

    // Wallpaper upload (image or video)
    if (wallpaper_base64) {
      try {
        const buffer = Buffer.from(wallpaper_base64.split(',')[1], 'base64');
        const mimeType = wallpaper_base64.split(';')[0].split(':')[1] || 'image/png';
        const fileExt = mimeType.split('/')[1] || 'png';
        const isVideo = mimeType.startsWith('video/');
        const fileName = `${req.userId}-${Date.now()}.${fileExt}`;
        const filePath = `wallpapers/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('wallpapers')
          .upload(filePath, buffer, {
            contentType: mimeType,
            upsert: true
          });

        if (uploadError) {
          console.error('Erro upload wallpaper:', uploadError);
          return res.status(500).json({ error: 'Erro ao fazer upload do wallpaper' });
        }

        const { data: { publicUrl } } = supabase.storage
          .from('wallpapers')
          .getPublicUrl(filePath);

        updateData.wallpaper_url = publicUrl;
        updateData.wallpaper_type = isVideo ? 'video' : 'image';
      } catch (err) {
        console.error('Erro ao processar wallpaper Base64:', err);
        return res.status(400).json({ error: 'Formato de arquivo de wallpaper inválido' });
      }
    } else if (wpUrl !== undefined) {
      updateData.wallpaper_url = wpUrl; // null to remove
      if (wpUrl === null) updateData.wallpaper_type = 'image'; // reset type on remove
    }
    if (wallpaper_type !== undefined) updateData.wallpaper_type = wallpaper_type;

    // Audio upload (segue o padrão do wallpaper)
    if (audio_base64) {
      try {
        const buffer = Buffer.from(audio_base64.split(',')[1], 'base64');
        const mimeType = audio_base64.split(';')[0].split(':')[1] || 'audio/mpeg';
        if (!mimeType.startsWith('audio/')) {
          return res.status(400).json({ error: 'Arquivo precisa ser de áudio' });
        }
        const fileExt = (mimeType.split('/')[1] || 'mp3').split(';')[0];
        const fileName = `${req.userId}-${Date.now()}.${fileExt}`;
        const filePath = `audios/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('audios')
          .upload(filePath, buffer, { contentType: mimeType, upsert: true });

        if (uploadError) {
          console.error('Erro upload audio:', uploadError);
          return res.status(500).json({ error: 'Erro ao fazer upload do áudio' });
        }

        const { data: { publicUrl } } = supabase.storage
          .from('audios')
          .getPublicUrl(filePath);

        updateData.audio_url = publicUrl;
      } catch (err) {
        console.error('Erro ao processar audio Base64:', err);
        return res.status(400).json({ error: 'Formato de áudio inválido' });
      }
    } else if (aUrl !== undefined) {
      updateData.audio_url = aUrl; // null to remove
      if (aUrl === null) {
        updateData.audio_name = null;
        updateData.audio_artist = null;
        updateData.audio_cover_url = null;
      }
    }

    // Capa do áudio (imagem base64)
    if (audio_cover_base64) {
      try {
        const buffer = Buffer.from(audio_cover_base64.split(',')[1], 'base64');
        const mimeType = audio_cover_base64.split(';')[0].split(':')[1] || 'image/jpeg';
        if (!mimeType.startsWith('image/')) {
          return res.status(400).json({ error: 'Capa precisa ser uma imagem' });
        }
        const fileExt = mimeType.split('/')[1] || 'jpg';
        const fileName = `covers/${req.userId}-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('audios')
          .upload(fileName, buffer, { contentType: mimeType, upsert: true });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage.from('audios').getPublicUrl(fileName);
        updateData.audio_cover_url = publicUrl;
      } catch (err) {
        console.error('Erro upload capa:', err);
        return res.status(500).json({ error: 'Erro ao fazer upload da capa' });
      }
    }

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', req.userId)
      .select('id, name, email, avatar_url, language, wallpaper_url, wallpaper_opacity, wallpaper_type, audio_url, audio_volume, audio_enabled, audio_name, audio_artist, audio_cover_url')
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Erro ao atualizar perfil:', err);
    res.status(500).json({ error: 'Erro ao atualizar perfil' });
  }
});

router.delete('/', async (req, res) => {
  try {
    const { error } = await supabase.from('users').delete().eq('id', req.userId);
    if (error) throw error;
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao excluir conta' });
  }
});

export default router;
