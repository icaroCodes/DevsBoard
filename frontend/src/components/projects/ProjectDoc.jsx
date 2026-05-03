import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Check } from 'lucide-react';
import { useProjectDoc } from '../../hooks/useProjects';
import Editor from './editor/Editor.jsx';

export default function ProjectDoc({ projectId }) {
  const { doc, setContent, loading, savingState } = useProjectDoc(projectId);

  if (loading) {
    return <div className="text-[#86868B] text-[13px] py-8">Carregando...</div>;
  }

  return (
    <div className="relative">
      {/* Save indicator (canto superior, fixo dentro do scroll do main) */}
      <div className="absolute -top-12 right-1 z-10 pointer-events-none">
        <AnimatePresence mode="wait">
          <motion.div
            key={savingState}
            initial={{ opacity: 0, y: -2 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 2 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-1.5 text-[11px] text-[#86868B]"
          >
            {savingState === 'saving' && <><Loader2 size={11} className="animate-spin" /> Salvando…</>}
            {savingState === 'saved'  && <><Check size={11} className="text-[#30D158]" /> Salvo</>}
          </motion.div>
        </AnimatePresence>
      </div>

      <Editor
        projectId={projectId}
        value={doc.content || ''}
        onChange={setContent}
        autoFocus={!doc.content}
      />
    </div>
  );
}
