import supabase from '../database/connection.js';


function getBrasiliaDate() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
  }).format(new Date()); 
}


function getPreviousDay(dateStr) {
  const d = new Date(`${dateStr}T12:00:00Z`); 
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().split('T')[0];
}



const processedToday = new Map();


export async function updateDailyStreak(userId) {
  try {
    const today = getBrasiliaDate();

    
    if (processedToday.get(String(userId)) === today) return;

    const { data: user, error } = await supabase
      .from('users')
      .select('current_streak, longest_streak, last_access_date')
      .eq('id', userId)
      .single();

    if (error || !user) return;

    
    if (user.last_access_date === today) {
      processedToday.set(String(userId), today);
      return;
    }

    const yesterday = getPreviousDay(today);
    const newStreak = user.last_access_date === yesterday
      ? (user.current_streak || 0) + 1  
      : 1;                                

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
