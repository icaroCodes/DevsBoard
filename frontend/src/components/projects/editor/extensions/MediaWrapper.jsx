import { useState, useRef, useEffect } from'react';
import { MoreHorizontal, Edit, Trash2 } from'lucide-react';

export function MediaWrapper({ children, onEdit, onDelete }) {
 const [menuOpen, setMenuOpen] = useState(false);
 const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
 const menuRef = useRef(null);
 
 const openMenu = (e, x, y) => {
 e.preventDefault();
 setMenuPosition({ x, y });
 setMenuOpen(true);
 };

 const handleContextMenu = (e) => {
 // We want the menu relative to the document or wrapper.
 // Using simple clientX/clientY relative to viewport but let's just make it fixed or absolute inside.
 const rect = e.currentTarget.getBoundingClientRect();
 openMenu(e, e.clientX - rect.left, e.clientY - rect.top);
 };

 const handleDotsClick = (e) => {
 const rect = e.currentTarget.getBoundingClientRect();
 const parentRect = e.currentTarget.parentElement.getBoundingClientRect();
 // Position menu just below the dots
 openMenu(e, rect.right - parentRect.left - 140, rect.bottom - parentRect.top + 8);
 };

 useEffect(() => {
 const handleClickOutside = (e) => {
 if (menuRef.current && !menuRef.current.contains(e.target)) {
 setMenuOpen(false);
 }
 };
 document.addEventListener('mousedown', handleClickOutside);
 return () => document.removeEventListener('mousedown', handleClickOutside);
 }, []);

 return (
 <div className="db-media-wrapper group" onContextMenu={handleContextMenu} contentEditable={false}>
 {children}
 
 {/* 3 dots button, visible on hover */}
 <button 
 className="db-media-dots"
 onClick={handleDotsClick}
 onMouseDown={(e) => e.stopPropagation()}
 >
 <MoreHorizontal size={16} />
 </button>

 {/* Context Menu */}
 {menuOpen && (
 <div 
 ref={menuRef} 
 className="db-media-context-menu"
 style={{ top: menuPosition.y, left: menuPosition.x }}
 onMouseDown={(e) => e.stopPropagation()}
 >
 <button onClick={() => { setMenuOpen(false); onEdit(); }}>
 <Edit size={14} /> Editar
 </button>
 <button className="text-red-500" onClick={() => { setMenuOpen(false); onDelete(); }}>
 <Trash2 size={14} /> Excluir
 </button>
 </div>
 )}
 </div>
 );
}
