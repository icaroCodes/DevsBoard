import supabase from '../database/connection.js';

/**
 * Retorna a data atual no fuso de Brasília (America/Sao_Paulo) como YYYY-MM-DD.
 * Usa Intl para lidar corretamente com horário de verão caso volte a existir.
 */
function getBrasiliaDate() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
  }).format(new Date()); // 'en-CA' produz YYYY-MM-DD
}

/**
 * Retorna o dia anterior à data fornecida (YYYY-MM-DD).
 * Usa apenas manipulação de string para evitar problemas de timezone.
 */
function getPreviousDay(dateStr) {
  const d = new Date(`${dateStr}T12:00:00Z`); // meio-dia UTC para evitar offset de 1 dia
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().split('T')[0];
}

// Cache em memória: { [userId]: 'YYYY-MM-DD' }
// Evita consultas repetidas ao banco no mesmo dia para o mesmo usuário.
const processedToday = new Map();

/**
 * Atualiza o streak do usuário baseado em acesso diário (fuso Brasília).
 * Fire-and-forget: não deve ser aguardado pelo caller.
 *
 * Regras:
 * - Acesso no mesmo dia  → nenhuma mudança
 * - Acesso no dia seguinte → streak + 1
 * - Pulou um ou mais dias → streak = 1 (reset)
 */
export async function updateDailyStreak(userId) {
  try {
    const today = getBrasiliaDate();

    // Cache in-memory: já processamos esse usuário hoje neste processo
    if (processedToday.get(String(userId)) === today) return;

    const { data: user, error } = await supabase
      .from('users')
      .select('current_streak, longest_streak, last_access_date')
      .eq('id', userId)
      .single();

    if (error || !user) return;

    // Já foi atualizado hoje — marcar cache e sair
    if (user.last_access_date === today) {
      processedToday.set(String(userId), today);
      return;
    }

    const yesterday = getPreviousDay(today);
    const newStreak = user.last_access_date === yesterday
      ? (user.current_streak || 0) + 1  // dia consecutivo
      : 1;                                // pulou — reset

    const newLongest = Math.max(newStreak, user.longest_streak || 0);

    await supabase
      .from('users')
      .update({
        current_streak:   newStreak,
        longest_streak:   newLongest,
        last_access_date: today,
      })
      .eq('id', userId);

    processedToday.set(String(userId), today);
  } catch (e) {
    console.error('[Streak] Erro ao atualizar:', e.message);
  }
}
