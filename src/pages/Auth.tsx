import { useState } from 'react';
import { signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';
import { Terminal, Github, Cpu, Mail, Lock, UserPlus, LogIn, KeyRound } from 'lucide-react';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);

  const getErrorMessage = (error: any) => {
    const code = error.code;
    switch (code) {
      case 'auth/email-already-in-use':
        return 'Email already exists.';
      case 'auth/invalid-email':
        return 'Invalid email address.';
      case 'auth/weak-password':
        return 'Password is too weak.';
      case 'auth/user-not-found':
        return 'No account found with this email.';
      case 'auth/wrong-password':
        return 'Incorrect password.';
      case 'auth/invalid-credential':
        return 'Invalid login credentials.';
      case 'auth/popup-closed-by-user':
        return 'Login cancelled.';
      default:
        return error.message.replace('Firebase: ', '');
    }
  };

  const handleGoogleLogin = async () => {
    if (!auth) return;
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      if (isForgotPassword) {
        await sendPasswordResetEmail(auth, email);
        setMessage('Password reset email sent. Check your inbox.');
        setIsForgotPassword(false);
      } else if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setError(getErrorMessage(err));
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
            v1.0.5_STABLE
          </div>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white">
                {isForgotPassword ? 'Reset Access' : (isRegistering ? 'Register Identity' : 'Initialize Session')}
              </h2>
              <p className="text-sm text-[#666]">
                {isForgotPassword ? 'Enter your email to receive a reset link.' : (isRegistering ? 'Create your developer credentials.' : 'Connect your developer identity to join the grid.')}
              </p>
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase text-[#444] flex items-center gap-2">
                  <Mail size={10} /> Email_Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-black border border-[#222] p-3 text-sm focus:border-[#00ff00] outline-none transition-colors font-mono"
                  placeholder="dev@null.com"
                />
              </div>
              {!isForgotPassword && (
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-mono uppercase text-[#444] flex items-center gap-2">
                      <Lock size={10} /> Access_Key
                    </label>
                    {!isRegistering && (
                      <button
                        type="button"
                        onClick={() => setIsForgotPassword(true)}
                        className="text-[8px] font-mono text-[#444] hover:text-[#00ff00] uppercase"
                      >
                        Forgot?
                      </button>
                    )}
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full bg-black border border-[#222] p-3 text-sm focus:border-[#00ff00] outline-none transition-colors font-mono"
                    placeholder="********"
                  />
                </div>
              )}
              <button
                type="submit"
                disabled={loading || !auth}
                className="w-full flex items-center justify-center gap-3 bg-[#00ff00] text-black font-bold py-3 px-6 hover:bg-[#00cc00] transition-all active:scale-95 disabled:opacity-50 uppercase text-xs tracking-widest"
              >
                {isForgotPassword ? <KeyRound size={16} /> : (isRegistering ? <UserPlus size={16} /> : <LogIn size={16} />)}
                {loading ? 'PROCESSING...' : (isForgotPassword ? 'SEND RESET LINK' : (isRegistering ? 'REGISTER' : 'LOGIN'))}
              </button>
              {isForgotPassword && (
                <button
                  type="button"
                  onClick={() => setIsForgotPassword(false)}
                  className="w-full text-[10px] font-mono text-[#666] hover:text-[#00ff00] uppercase tracking-widest"
                >
                  Back to Login
                </button>
              )}
            </form>

            {!isForgotPassword && (
              <>
                <div className="relative flex items-center py-2">
                  <div className="flex-grow border-t border-[#222]"></div>
                  <span className="flex-shrink mx-4 text-[10px] font-mono text-[#444] uppercase">OR</span>
                  <div className="flex-grow border-t border-[#222]"></div>
                </div>

                <button
                  onClick={handleGoogleLogin}
                  disabled={loading || !auth}
                  className="w-full group relative flex items-center justify-center gap-3 bg-white text-black font-bold py-3 px-6 hover:bg-[#00ff00] transition-all active:scale-95 disabled:opacity-50 uppercase text-xs tracking-widest"
                >
                  <Github size={16} />
                  {loading ? 'CONNECTING...' : 'SIGN IN WITH GOOGLE'}
                  <div className="absolute -bottom-1 -right-1 w-full h-full border border-white group-hover:border-[#00ff00] -z-10" />
                </button>

                <div className="text-center">
                  <button
                    onClick={() => setIsRegistering(!isRegistering)}
                    className="text-[10px] font-mono text-[#666] hover:text-[#00ff00] transition-colors uppercase tracking-widest"
                  >
                    {isRegistering ? 'Already have an identity? Login' : 'Need a new identity? Register'}
                  </button>
                </div>
              </>
            )}

            {error && (
              <div className="p-3 bg-red-900/20 border border-red-500/50 text-red-500 text-[10px] font-mono break-words">
                ERROR: {error}
              </div>
            )}

            {message && (
              <div className="p-3 bg-green-900/20 border border-[#00ff00]/50 text-[#00ff00] text-[10px] font-mono break-words">
                SUCCESS: {message}
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
