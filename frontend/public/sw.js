// DevsBoard Alarm Service Worker
let alarms = [];
let firedThisMinute = {};
let lastMinute = null;

function getBrasiliaHHMM() {
  try {
    const parts = new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(new Date());
    const h = parts.find(p => p.type === 'hour')?.value || '00';
    const m = parts.find(p => p.type === 'minute')?.value || '00';
    return `${h}:${m}`;
  } catch {
    const now = new Date();
    const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
    const d = new Date(utcMs - 3 * 60 * 60 * 1000);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }
}

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('message', event => {
  const data = event.data || {};
  if (data.type === 'SET_ALARMS') {
    alarms = data.alarms || [];
  }
});

setInterval(checkAlarms, 30000);

async function checkAlarms() {
  if (!alarms.length) return;
  const currentHHMM = getBrasiliaHHMM();

  if (currentHHMM !== lastMinute) {
    firedThisMinute = {};
    lastMinute = currentHHMM;
  }

  const toFire = alarms.filter(a => a.time && a.time.substring(0, 5) === currentHHMM && !firedThisMinute[a.id]);
  for (const alarm of toFire) {
    firedThisMinute[alarm.id] = true;
    await fireAlarm(alarm);
  }
}

async function fireAlarm(alarm) {
  const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });

  clients.forEach(client => {
    client.postMessage({ type: 'ALARM_FIRE', alarm });
  });

  // Notification for when no client is visible or audio is muted
  try {
    await self.registration.showNotification(`⏰ ${alarm.title}`, {
      body: alarm.description || 'Hora de executar esta atividade no DevsBoard!',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: `alarm-${alarm.id}`,
      requireInteraction: true,
      vibrate: [200, 100, 200],
    });
  } catch (_) {}
}

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(clients => {
      if (clients.length > 0) return clients[0].focus();
      return self.clients.openWindow('/tasks');
    })
  );
});
