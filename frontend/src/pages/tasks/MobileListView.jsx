import { useState } from'react';
import { motion, AnimatePresence } from'framer-motion';
import {
 Plus,
 Pencil,
 Trash2,
 Loader2,
 ListTodo,
 CircleDashed,
} from'lucide-react';
import Sheet from'../../components/mobile/Sheet';
import { useRegisterMobileFab } from'../../contexts/MobileFabContext';

const PRIORITIES = [
 { id:'low', label:'Pode esperar', color:'#32D74B' },
 { id:'medium', label:'Importante', color:'#FF9F0A' },
 { id:'high', label:'Muito Urgente', color:'#FF453A' },
];

function StatusDot({ completed, priority }) {
 if (completed) {
 return <span className="block w-[18px] h-[18px] rounded-full bg-[#10B981]" />;
 }
 const c =
 priority ==='high'
 ?'#EF4444'
 : priority ==='medium'
 ?'#F59E0B'
 : priority ==='low'
 ?'#3B82F6'
 :'#86868B';
 return <CircleDashed size={20} strokeWidth={2} style={{ color: c }} />;
}

export default function MobileListView({
 items,
 pendingCount,
 filter,
 setFilter,
 toggleComplete,
 openEdit,
 handleDelete,
 formParams,
 setFormParams,
 handleSubmit,
 modalOpen,
 setModalOpen,
 editing,
 setEditing,
 t,
}) {
 const [actionSheet, setActionSheet] = useState(null);

 const filteredItems = items.filter((i) => {
 if (filter ==='completed') return i.completed;
 if (filter ==='pending') return !i.completed;
 return true;
 });

 const openNew = () => {
 setEditing(null);
 setFormParams({ title:'', description:'', priority:'medium', submitting: false });
 setModalOpen(true);
 };

 useRegisterMobileFab(
 { icon: Plus, label:'Nova atividade', onClick: openNew, tone:'accent' },
 []
 );

 return (
 <div className="px-4 pt-2 pb-6 max-w-[640px] mx-auto">
 <div className="mb-5 px-1">
 <p className="text-[12.5px] font-medium text-[#86868B] tracking-tight">
 Minhas atividades
 </p>
 <h1 className="text-[26px] font-semibold text-[#F5F5F7] tracking-tight leading-tight">
 {pendingCount} para concluir
 </h1>
 </div>

 {/* Segmented filter */}
 <div className="relative flex p-1 mb-4 bg-[#0F0F11] rounded-[12px] border border-white/[0.04]">
 {[
 { id:'all', label:'Tudo' },
 { id:'pending', label:'Para fazer' },
 { id:'completed', label:'Terminadas' },
 ].map((f) => (
 <button
 key={f.id}
 type="button"
 onClick={() => setFilter(f.id)}
 className={`relative flex-1 py-2 rounded-[8px] text-[12.5px] font-semibold tracking-tight transition-colors z-10 outline-none ${
 filter === f.id ?'text-[#F5F5F7]' :'text-[#86868B]'
 }`}
 >
 {filter === f.id && (
 <motion.div
 layoutId="mobileTaskFilter"
 className="absolute inset-0 bg-[#2C2C2E] rounded-[8px] -z-10"
 transition={{ type:'spring', bounce: 0.2, duration: 0.5 }}
 />
 )}
 {f.label}
 </button>
 ))}
 </div>

 {/* Task list */}
 {filteredItems.length === 0 ? (
 <div className="flex flex-col items-center justify-center gap-2 py-16 rounded-[18px] border border-white/[0.05] bg-[#1A1A1C]">
 <ListTodo size={28} className="text-[#5A5A5F]" strokeWidth={1.5} />
 <p className="text-[13px] text-[#86868B]">Nada por aqui ainda.</p>
 </div>
 ) : (
 <div className="rounded-[18px] border border-white/[0.05] bg-[#1A1A1C] overflow-hidden">
 <ul className="divide-y divide-white/[0.04]">
 {filteredItems.map((item) => (
 <li key={item.id}>
 <div className="flex items-start gap-3 px-4 py-3 active:bg-white/[0.04] transition-colors">
 <button
 type="button"
 onClick={() => toggleComplete(item)}
 aria-label="Concluir"
 className="mt-[2px] shrink-0 active:scale-90 transition-transform outline-none"
 >
 <StatusDot completed={item.completed} priority={item.priority} />
 </button>
 <button
 type="button"
 onClick={() => setActionSheet(item)}
 className="flex-1 min-w-0 text-left outline-none"
 >
 <span
 className={`block text-[14.5px] font-medium leading-snug ${
 item.completed
 ?'line-through text-[#86868B]'
 :'text-[#F5F5F7]'
 }`}
 >
 {item.title}
 </span>
 {item.description && (
 <span
 className={`block text-[12.5px] mt-0.5 line-clamp-2 ${
 item.completed ?'text-[#86868B]/60' :'text-[#86868B]'
 }`}
 >
 {item.description}
 </span>
 )}
 </button>
 </div>
 </li>
 ))}
 </ul>
 </div>
 )}

 {/* Action sheet (per task) */}
 <Sheet
 open={!!actionSheet}
 onClose={() => setActionSheet(null)}
 title={actionSheet?.title}
 >
 <div className="px-4 pb-5 space-y-2">
 <button
 type="button"
 onClick={() => {
 const target = actionSheet;
 setActionSheet(null);
 openEdit(target);
 }}
 className="flex items-center gap-3 w-full p-3.5 rounded-[12px] bg-white/[0.04] active:bg-white/[0.08] transition-colors outline-none"
 >
 <Pencil size={17} className="text-[#E5E5EA]" strokeWidth={2} />
 <span className="text-[14px] font-medium text-[#F5F5F7]">Editar</span>
 </button>
 <button
 type="button"
 onClick={() => {
 const id = actionSheet?.id;
 setActionSheet(null);
 if (id != null) handleDelete(id);
 }}
 className="flex items-center gap-3 w-full p-3.5 rounded-[12px] bg-[#FF3B30]/10 active:bg-[#FF3B30]/20 transition-colors outline-none"
 >
 <Trash2 size={17} className="text-[#FF6961]" strokeWidth={2} />
 <span className="text-[14px] font-semibold text-[#FF6961]">Apagar</span>
 </button>
 </div>
 </Sheet>

 {/* Form sheet */}
 <Sheet
 open={modalOpen}
 onClose={() => {
 setModalOpen(false);
 setEditing(null);
 }}
 title={editing ?'Editar atividade' :'Nova atividade'}
 maxHeight="92dvh"
 >
 <form onSubmit={handleSubmit} className="px-4 pb-6 space-y-4">
 <div className="space-y-1.5">
 <label className="text-[12px] font-medium text-[#86868B] ml-1">
 O que precisa ser feito?
 </label>
 <input
 type="text"
 value={formParams.title}
 onChange={(e) =>
 setFormParams({ ...formParams, title: e.target.value })
 }
 placeholder="Ex: Comprar pão, pagar conta..."
 required
 autoFocus
 className="w-full px-4 py-3.5 rounded-[14px] bg-[#0F0F11] border border-white/[0.06] text-[15px] text-[#F5F5F7] focus:border-[#0A84FF]/50 focus:outline-none transition-colors placeholder:text-[#5A5A5F]"
 />
 </div>

 <div className="space-y-1.5">
 <label className="text-[12px] font-medium text-[#86868B] ml-1">
 Mais detalhes (opcional)
 </label>
 <textarea
 rows={3}
 value={formParams.description}
 onChange={(e) =>
 setFormParams({ ...formParams, description: e.target.value })
 }
 placeholder="Mais informações..."
 className="w-full px-4 py-3 rounded-[14px] bg-[#0F0F11] border border-white/[0.06] text-[14.5px] text-[#F5F5F7] focus:border-[#0A84FF]/50 focus:outline-none transition-colors resize-none placeholder:text-[#5A5A5F]"
 />
 </div>

 <div className="space-y-1.5">
 <label className="text-[12px] font-medium text-[#86868B] ml-1">
 Importância
 </label>
 <div className="grid grid-cols-3 gap-2">
 {PRIORITIES.map((p) => (
 <button
 key={p.id}
 type="button"
 onClick={() => setFormParams({ ...formParams, priority: p.id })}
 className={`relative px-2 py-3 rounded-[12px] text-[12.5px] font-semibold transition-all outline-none border ${
 formParams.priority === p.id
 ?'border-white/15 bg-white/[0.06] text-[#F5F5F7]'
 :'border-white/[0.04] bg-[#0F0F11] text-[#86868B]'
 }`}
 >
 <span
 className="block w-2 h-2 rounded-full mx-auto mb-1.5"
 style={{ background: p.color }}
 />
 {p.label}
 </button>
 ))}
 </div>
 </div>

 <button
 type="submit"
 disabled={formParams.submitting || !formParams.title.trim()}
 className="w-full py-4 rounded-[16px] bg-[#0A84FF] text-white text-[15px] font-semibold active:scale-[0.98] disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#0A84FF]/20"
 >
 {formParams.submitting ? (
 <>
 <Loader2 size={18} className="animate-spin" />
 <span>{t.taskSaving}</span>
 </>
 ) : editing ? (
'Salvar mudanças'
 ) : (
'Criar atividade'
 )}
 </button>
 </form>
 </Sheet>
 </div>
 );
}
