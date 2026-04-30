import { useCallback, useEffect, useState } from 'react';
import { projectsService, tasksService, docService, assetsService, commentsService } from '../services/projects';

export function useProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setProjects(await projectsService.list());
      setError(null);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  return {
    projects, loading, error, reload: load,
    create: async (p) => { const n = await projectsService.create(p); setProjects(prev => [n, ...prev]); return n; },
    update: async (id, p) => { const u = await projectsService.update(id, p); setProjects(prev => prev.map(x => x.id === id ? u : x)); return u; },
    remove: async (id) => { await projectsService.remove(id); setProjects(prev => prev.filter(x => x.id !== id)); },
  };
}

export function useTasks(projectId) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    tasksService.list(projectId).then(setTasks).finally(() => setLoading(false));
  }, [projectId]);

  const create = async (payload) => {
    const t = await tasksService.create(projectId, payload);
    setTasks(prev => [...prev, t]);
    return t;
  };
  const update = async (taskId, payload) => {
    const prev = tasks;
    setTasks(p => p.map(t => t.id === taskId ? { ...t, ...payload } : t)); // optimista
    try {
      const t = await tasksService.update(projectId, taskId, payload);
      setTasks(p => p.map(x => x.id === taskId ? t : x));
      return t;
    } catch (e) { setTasks(prev); throw e; }
  };
  const remove = async (taskId) => {
    const prev = tasks;
    setTasks(p => p.filter(t => t.id !== taskId));
    try { await tasksService.remove(projectId, taskId); } catch (e) { setTasks(prev); throw e; }
  };
  return { tasks, loading, create, update, remove };
}

export function useProjectDoc(projectId) {
  const [doc, setDoc] = useState({ content: '' });
  const [loading, setLoading] = useState(true);
  const [savingState, setSavingState] = useState('idle'); // idle | saving | saved

  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    docService.get(projectId).then(d => setDoc(d || { content: '' })).finally(() => setLoading(false));
  }, [projectId]);

  // Debounce auto-save
  useEffect(() => {
    if (loading) return;
    setSavingState('saving');
    const t = setTimeout(async () => {
      try {
        const saved = await docService.save(projectId, doc.content || '');
        setDoc(prev => ({ ...prev, updated_at: saved.updated_at }));
        setSavingState('saved');
      } catch { setSavingState('idle'); }
    }, 800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc.content]);

  return { doc, setContent: (c) => setDoc(d => ({ ...d, content: c })), loading, savingState };
}

export function useComments(projectId) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    commentsService.list(projectId).then(setComments).catch(() => {}).finally(() => setLoading(false));
  }, [projectId]);

  return {
    comments, loading,
    create: async (content) => {
      const c = await commentsService.create(projectId, { content });
      setComments(prev => [...prev, c]);
      return c;
    },
    remove: async (id) => {
      const prev = comments;
      setComments(p => p.filter(c => c.id !== id));
      try { await commentsService.remove(projectId, id); }
      catch (e) { setComments(prev); throw e; }
    },
  };
}

export function useAssets(projectId) {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    assetsService.list(projectId).then(setAssets).finally(() => setLoading(false));
  }, [projectId]);

  return {
    assets, loading,
    create: async (p) => { const a = await assetsService.create(projectId, p); setAssets(prev => [a, ...prev]); return a; },
    remove: async (id) => { await assetsService.remove(projectId, id); setAssets(prev => prev.filter(a => a.id !== id)); },
  };
}
