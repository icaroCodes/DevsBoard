
import supabase from '../database/connection.js';
import dayjs from 'dayjs';


export async function processRecurring(userId, teamId = null) {
  try {
    
    let query = supabase
      .from('recurring_transactions')
      .select('*')
      .eq('is_active', true);
    
    if (teamId) {
      query = query.eq('team_id', teamId);
    } else {
      query = query.eq('user_id', userId).is('team_id', null);
    }

    const { data: recurringList, error } = await query;
    if (error) throw error;
    if (!recurringList?.length) return [];

    const today = dayjs().startOf('day');
    const newTransactions = [];

    for (const rec of recurringList) {
      let lastGenerated = rec.last_generated_date ? dayjs(rec.last_generated_date) : dayjs(rec.start_date).subtract(1, 'day');
      let nextDate = calculateNextOccurrence(rec, lastGenerated);
      
      const occurrencesToGenerate = [];

      while (nextDate.isBefore(today) || nextDate.isSame(today, 'day')) {
        occurrencesToGenerate.push({
          user_id: rec.user_id,
          team_id: rec.team_id,
          category: rec.category,
          description: rec.description,
          amount: rec.amount,
          type: rec.type,
          transaction_date: nextDate.format('YYYY-MM-DD'),
          recurring_id: rec.id
        });
        
        lastGenerated = nextDate;
        nextDate = calculateNextOccurrence(rec, lastGenerated);
      }

      if (occurrencesToGenerate.length > 0) {
        
        const { error: insertErr } = await supabase.from('finances').insert(occurrencesToGenerate);
        if (insertErr) {
          console.error('[processRecurring] Insert error:', insertErr);
          continue;
        }

        
        await supabase
          .from('recurring_transactions')
          .update({ last_generated_date: lastGenerated.format('YYYY-MM-DD') })
          .eq('id', rec.id);
        
        newTransactions.push(...occurrencesToGenerate);
      }
    }

    return newTransactions;
  } catch (err) {
    console.error('[processRecurring] Error:', err);
    return [];
  }
}

function calculateNextOccurrence(rec, fromDate) {
  switch (rec.recurrence_interval) {
    case 'weekly':
      
      return fromDate.add(1, 'week').day(rec.day_of_week || dayjs(rec.start_date).day());
    case 'biweekly':
      return fromDate.add(14, 'day');
    case 'monthly':
      
      const dayOfMonth = rec.day_of_month || dayjs(rec.start_date).date();
      let next = fromDate.add(1, 'month').date(dayOfMonth);
      
      if (next.date() !== dayOfMonth) {
          next = next.subtract(dayOfMonth - next.date(), 'day');
      }
      return next;
    default:
      return fromDate.add(1, 'month');
  }
}
