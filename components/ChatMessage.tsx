
import React, { useState } from 'react';
import { Message, Department } from '../types';
import { getBotIcon, DEPARTMENT_BOTS } from '../constants';
import { ExternalLink, FileText, Image as ImageIcon, Download, User, HardDrive, File as FileGeneric } from 'lucide-react';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const [imgError, setImgError] = useState(false);
  const [isAvatarOpen, setIsAvatarOpen] = useState(false);
  const isUser = message.role === 'user';
  const botInfo = DEPARTMENT_BOTS.find(b => b.id === message.department);

  // Simplified Markdown-like rendering for Drive files if found in content
  // Since Gemini might describe the files, we check if there's a specific format
  // or just render the text. In a real scenario, we'd have a custom 'parts' type.

  return (
    <div className={`flex w-full mb-8 animate-in fade-in slide-in-from-bottom-2 duration-300 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'} gap-4`}>
        {!isUser && (
          <div className="flex-shrink-0 mt-1">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-2xl overflow-hidden border border-white/10 ${message.department === Department.GENERAL ? 'bg-indigo-600' : 'bg-neutral-800'
              }`}>
              {botInfo?.avatarUrl ? (
                <img
                  src={botInfo.avatarUrl}
                  alt="Leila"
                  className="w-full h-full object-cover object-top cursor-pointer transition-transform hover:scale-110 active:scale-95 duration-300"
                  onClick={() => setIsAvatarOpen(true)}
                />
              ) : (
                getBotIcon(message.department, 24)
              )}
            </div>
          </div>
        )}

        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          {!isUser && (
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em] mb-1.5 ml-1">
              Leila OS / {botInfo?.name || message.department}
            </span>
          )}

          <div className={`px-5 py-4 rounded-3xl text-[13px] leading-relaxed shadow-xl ${isUser
            ? 'bg-indigo-600 text-white rounded-tr-none border border-white/10'
            : 'glass text-neutral-200 rounded-tl-none border-white/5'
            }`}>
            {message.attachments && message.attachments.length > 0 && (
              <div className="flex flex-col gap-3 mb-4">
                {message.attachments.map((file, i) => (
                  <div key={i} className="rounded-xl overflow-hidden border border-white/10 bg-black/20">
                    {file.mimeType?.startsWith('image') ? (
                      <img src={file.url || `data:${file.mimeType};base64,${file.data}`} alt={file.name || 'Image'} className="max-w-full max-h-60 object-cover" />
                    ) : (
                      <div className="p-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FileText size={20} className="text-indigo-400" />
                          <div>
                            <p className="text-xs font-bold truncate max-w-[200px]">{file.name || 'Document'}</p>
                            <p className="text-[10px] text-neutral-500 uppercase">{file.mimeType ? file.mimeType.split('/')[1] : 'FILE'}</p>
                          </div>
                        </div>
                        <button className="p-2 hover:bg-white/5 rounded-lg text-neutral-400 hover:text-white transition-colors">
                          <Download size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="whitespace-pre-wrap font-medium">
              {message.content}
            </div>

            {/* Simulated Drive File List Rendering if Leila mentions Drive Files */}
            {message.content.includes("Нашла следующие файлы") && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 mb-2 text-indigo-400">
                  <HardDrive size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Google Drive Results</span>
                </div>
                {[1, 2].map(i => (
                  <div key={i} className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-colors group cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-neutral-900 flex items-center justify-center text-indigo-400">
                        <FileGeneric size={16} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">Документ_Drive_00{i}.pdf</p>
                        <p className="text-[9px] text-neutral-500">Google Drive Archive • 2.1 MB</p>
                      </div>
                    </div>
                    <button className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg group-hover:bg-indigo-500 group-hover:text-white transition-all">
                      <Download size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {message.groundingUrls && message.groundingUrls.length > 0 && (
              <div className="mt-5 pt-4 border-t border-white/10">
                <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-3">Grounding Intelligence:</p>
                <div className="flex flex-wrap gap-2">
                  {message.groundingUrls.map((link, idx) => (
                    <a
                      key={idx}
                      href={link.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/5 hover:bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-[11px] font-bold text-indigo-300 transition-all hover:scale-105 active:scale-95"
                    >
                      {link.title}
                      <ExternalLink size={12} />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 mt-2 mx-1 opacity-50">
            <span className="text-[10px] font-mono text-neutral-500">
              {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            <div className="w-1 h-1 bg-neutral-700 rounded-full" />
            <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-tighter">Verified Identity</span>
          </div>
        </div>
      </div>

      {isAvatarOpen && botInfo?.avatarUrl && (
        <div
          className="fixed inset-0 z-[999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300 cursor-zoom-out"
          onClick={() => setIsAvatarOpen(false)}
        >
          <img
            src={botInfo.avatarUrl}
            alt="Leila Fullscreen"
            className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl scale-in-center animate-in zoom-in-95 duration-300 border border-white/10"
          />
        </div>
      )}
    </div>
  );
};

export default ChatMessage;
