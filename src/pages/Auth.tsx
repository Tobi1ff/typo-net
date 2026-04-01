import { useState } from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../firebase';
import { motion } from 'motion/react';
import { Terminal, Github, Cpu } from 'lucide-react';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#0a0a0a] overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#00ff00 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="z-10 w-full max-w-md"
      >
        <div className="mb-8 text-center">
          <motion.div 
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ repeat: Infinity, duration: 4 }}
            className="inline-block p-4 border-2 border-[#00ff00] mb-4"
          >
            <Terminal size={48} className="text-[#00ff00]" />
          </motion.div>
          <h1 className="text-6xl font-black tracking-tighter text-white mb-2 italic transform -skew-x-12">
            TYPO
          </h1>
          <p className="text-[#888] font-mono text-sm uppercase tracking-widest">
            // Developer Social Protocol
          </p>
        </div>

        <div className="bg-[#111] border border-[#222] p-8 shadow-2xl relative">
          <div className="absolute top-0 right-0 p-2 text-[10px] font-mono text-[#444]">
            v1.0.4_STABLE
          </div>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white">Initialize Session</h2>
              <p className="text-sm text-[#666]">Connect your developer identity to join the grid.</p>
            </div>

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full group relative flex items-center justify-center gap-3 bg-white text-black font-bold py-4 px-6 hover:bg-[#00ff00] transition-all active:scale-95 disabled:opacity-50"
            >
              <Github size={20} />
              {loading ? 'CONNECTING...' : 'SIGN IN WITH GOOGLE'}
              <div className="absolute -bottom-1 -right-1 w-full h-full border border-white group-hover:border-[#00ff00] -z-10" />
            </button>

            {error && (
              <div className="p-3 bg-red-900/20 border border-red-500/50 text-red-500 text-xs font-mono">
                ERROR: {error}
              </div>
            )}

            <div className="pt-6 border-t border-[#222] grid grid-cols-3 gap-4">
              <div className="flex flex-col items-center gap-1 opacity-40">
                <Cpu size={16} />
                <span className="text-[8px] font-mono uppercase">Compute</span>
              </div>
              <div className="flex flex-col items-center gap-1 opacity-40">
                <Terminal size={16} />
                <span className="text-[8px] font-mono uppercase">Shell</span>
              </div>
              <div className="flex flex-col items-center gap-1 opacity-40">
                <Github size={16} />
                <span className="text-[8px] font-mono uppercase">Git</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
