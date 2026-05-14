import { Router } from 'express';
import { supabaseForRequest } from '../utils/supabaseClient.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const supabase = await supabaseForRequest(req);
    const { userId, teamId } = req;
    const alarms = [];

    // Simple tasks with alarm_time
    let tasksQ = supabase
      .from('tasks')
      .select('id, title, description, alarm_time')
      .not('alarm_time', 'is', null)
      .eq('completed', false);
    if (teamId) tasksQ = tasksQ.eq('team_id', teamId);
    else tasksQ = tasksQ.eq('user_id', userId).is('team_id', null);
    const { data: tasks } = await tasksQ;
    (tasks || []).forEach(t =>
      alarms.push({ id: `task-${t.id}`, title: t.title, description: t.description, time: t.alarm_time, type: 'task' })
    );

    // Task cards with alarm_time
    let cardsQ = supabase
      .from('task_cards')
      .select('id, name, alarm_time')
      .not('alarm_time', 'is', null)
      .eq('completed', false);
    if (teamId) cardsQ = cardsQ.eq('team_id', teamId);
    else cardsQ = cardsQ.eq('user_id', userId).is('team_id', null);
    const { data: cards } = await cardsQ;
    (cards || []).forEach(c =>
      alarms.push({ id: `card-${c.id}`, title: c.name, time: c.alarm_time, type: 'card' })
    );

    // Routine tasks with alarm_enabled + start_time
    let routinesQ = supabase.from('routines').select('id');
    if (teamId) routinesQ = routinesQ.eq('team_id', teamId);
    else routinesQ = routinesQ.eq('user_id', userId).is('team_id', null);
    const { data: routines } = await routinesQ;
    const routineIds = (routines || []).map(r => r.id);

    if (routineIds.length > 0) {
      const { data: rtasks } = await supabase
        .from('routine_tasks')
        .select('id, title, description, start_time')
        .in('routine_id', routineIds)
        .eq('alarm_enabled', true)
        .not('start_time', 'is', null)
        .eq('completed', false);
      (rtasks || []).forEach(t =>
        alarms.push({ id: `routine-task-${t.id}`, title: t.title, description: t.description, time: t.start_time, type: 'routine' })
      );
    }

    res.json(alarms);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao listar alarmes' });
  }
});

export default router;
