import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { Terminal, X, Copy, Database, User as UserIcon, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DevToolsProps {
  user: User | null;
}

export default function DevTools({ user }: DevToolsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'auth' | 'system'>('auth');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        setIsOpen(prev => !isOpen);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard');
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 p-2 bg-[#00ff00] text-black rounded-full shadow-lg z-[9999] hover:scale-110 transition-all opacity-20 hover:opacity-100"
        title="Open DevTools (Ctrl+Shift+D)"
      >
        <Terminal size={20} />
      </button>
    );
  }

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        className="fixed top-0 right-0 h-screen w-80 bg-[#0d0d0d] border-l border-[#222] z-[9999] flex flex-col font-mono text-xs shadow-2xl"
      >
        <div className="p-4 border-b border-[#222] flex items-center justify-between bg-[#111]">
          <div className="flex items-center gap-2">
            <Terminal size={14} className="text-[#00ff00]" />
            <span className="font-bold text-[#00ff00] uppercase tracking-widest">Dev_Console_v1.0</span>
          </div>
          <button onClick={() => setIsOpen(false)} className="text-[#444] hover:text-white">
            <X size={16} />
          </button>
        </div>

        <div className="flex border-b border-[#222]">
          <button 
            onClick={() => setActiveTab('auth')}
            className={`flex-1 p-3 text-center transition-all ${activeTab === 'auth' ? 'text-[#00ff00] bg-[#111] border-b-2 border-[#00ff00]' : 'text-[#444] hover:text-white'}`}
          >
            AUTH
          </button>
          <button 
            onClick={() => setActiveTab('system')}
            className={`flex-1 p-3 text-center transition-all ${activeTab === 'system' ? 'text-[#00ff00] bg-[#111] border-b-2 border-[#00ff00]' : 'text-[#444] hover:text-white'}`}
          >
            SYSTEM
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {activeTab === 'auth' ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[#666] uppercase text-[10px]">
                  <UserIcon size={12} />
                  Current_User
                </div>
                {user ? (
                  <div className="bg-[#050505] p-3 border border-[#222] space-y-2">
                    <div className="flex justify-between">
                      <span className="text-[#444]">UID:</span>
                      <span className="text-white truncate max-w-[150px]">{user.uid}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#444]">NAME:</span>
                      <span className="text-white">{user.displayName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#444]">EMAIL:</span>
                      <span className="text-white">{user.email}</span>
                    </div>
                    <button 
                      onClick={() => copyToClipboard(user.uid)}
                      className="w-full mt-2 py-1 bg-[#111] border border-[#222] text-[#00ff00] hover:bg-[#00ff00] hover:text-black transition-all flex items-center justify-center gap-2"
                    >
                      <Copy size={10} /> COPY_UID
                    </button>
                  </div>
                ) : (
                  <div className="text-red-500 italic">NOT_AUTHENTICATED</div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[#666] uppercase text-[10px]">
                  <Shield size={12} />
                  Auth_Token
                </div>
                <button 
                  onClick={async () => {
                    const token = await user?.getIdToken();
                    if (token) copyToClipboard(token);
                  }}
                  className="w-full py-2 bg-[#111] border border-[#222] text-[#00ff00] hover:bg-[#00ff00] hover:text-black transition-all flex items-center justify-center gap-2"
                >
                  <Copy size={10} /> COPY_ID_TOKEN
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[#666] uppercase text-[10px]">
                  <Database size={12} />
                  Environment
                </div>
                <div className="bg-[#050505] p-3 border border-[#222] space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[#444]">MODE:</span>
                    <span className="text-[#00ff00]">{(import.meta as any).env?.MODE || 'development'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#444]">DOMAIN:</span>
                    <span className="text-white">typo.hungrydevelopments.com</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[#666] uppercase text-[10px]">
                  <Terminal size={12} />
                  Quick_Actions
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <button 
                    onClick={() => window.location.reload()}
                    className="py-2 bg-[#111] border border-[#222] text-white hover:bg-white hover:text-black transition-all"
                  >
                    FORCE_RELOAD
                  </button>
                  <button 
                    onClick={() => {
                      localStorage.clear();
                      sessionStorage.clear();
                      alert('Storage cleared');
                    }}
                    className="py-2 bg-[#111] border border-[#222] text-white hover:bg-white hover:text-black transition-all"
                  >
                    CLEAR_STORAGE
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-[#222] bg-[#111] text-[10px] text-[#444] flex justify-between">
          <span>BUILD_2026.03.30</span>
          <span className="text-[#00ff00]">STABLE</span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
