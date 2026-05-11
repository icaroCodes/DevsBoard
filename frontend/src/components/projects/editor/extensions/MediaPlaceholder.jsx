import { useState, useRef, useEffect } from'react';
import { Image as ImageIcon, AudioLines, SquarePlay, Mic } from'lucide-react';
import { AudioRecorderVisualizer } from'./AudioRecorderVisualizer';

export function MediaPlaceholder({ type, onUrlSubmit, onFileUpload }) {
 const [isOpen, setIsOpen] = useState(false);
 const [isRecording, setIsRecording] = useState(false);
 const fileInputRef = useRef(null);
 const containerRef = useRef(null);

 const getIcon = () => {
 if (type ==='audio') return <AudioLines size={18} color="#86868B" />;
 if (type ==='video') return <SquarePlay size={18} color="#86868B" />;
 return <ImageIcon size={18} color="#86868B" />;
 };

 const getTitle = () => {
 if (type ==='audio') return'Adicionar arquivo de áudio';
 if (type ==='video') return'Integrar ou carregar um vídeo';
 return'Adicionar uma imagem';
 };

 const getButtonText = () => {
 if (type ==='video') return'Escolher vídeo';
 if (type ==='audio') return'Escolher um arquivo';
 return'Carregar arquivo';
 };

 const handleFileChange = (e) => {
 const file = e.target.files?.[0];
 if (file && onFileUpload) {
 onFileUpload(file);
 }
 };

 useEffect(() => {
 const handleClickOutside = (e) => {
 if (containerRef.current && !containerRef.current.contains(e.target)) {
 setIsOpen(false);
 }
 };
 document.addEventListener('mousedown', handleClickOutside);
 return () => {
 document.removeEventListener('mousedown', handleClickOutside);
 };
 }, []);

 if (isRecording) {
 return (
 <AudioRecorderVisualizer 
 onCancel={() => setIsRecording(false)} 
 onSave={(file) => {
 setIsRecording(false);
 if (onFileUpload) onFileUpload(file);
 }} 
 />
 );
 }

 return (
 <div className="db-media-placeholder-container" ref={containerRef} contentEditable={false}>
 <div 
 className="db-media-placeholder-trigger" 
 onClick={() => setIsOpen(!isOpen)}
 >
 {getIcon()}
 <span>{getTitle()}</span>
 </div>

 {isOpen && (
 <div className="db-media-popover">
 <div className="db-media-content">
 <div className="db-media-upload-tab">
 <input 
 type="file" 
 ref={fileInputRef} 
 onChange={handleFileChange}
 style={{ display:'none' }}
 accept={type ==='image' ?'image/*' : type ==='audio' ?'audio/*' :'video/*'}
 />
 <button 
 type="button" 
 className="db-media-upload-btn"
 onClick={() => fileInputRef.current?.click()}
 >
 {getButtonText()}
 </button>

 {type ==='audio' && (
 <button 
 type="button" 
 className="db-media-record-start-btn" 
 onClick={() => setIsRecording(true)}
 style={{ marginTop:'8px' }}
 >
 <Mic size={16} /> Gravar Áudio
 </button>
 )}
 </div>
 </div>
 </div>
 )}
 </div>
 );
}
