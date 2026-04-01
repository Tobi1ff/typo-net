import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, ArrowRight, X } from 'lucide-react';

interface ProfileCompletionBannerProps {
  user: User;
}

export default function ProfileCompletionBanner({ user }: ProfileCompletionBannerProps) {
  const [isIncomplete, setIsIncomplete] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'users', user.uid), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        const incomplete = !data.displayName || data.displayName === 'Anonymous Developer' || !data.bio || data.bio === 'New developer on Typo' || !data.techStack || data.techStack.length === 0;
        setIsIncomplete(incomplete);
      }
    });
    return () => unsub();
  }, [user.uid]);

  if (!isIncomplete || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className="bg-[#00ff00] text-black overflow-hidden"
      >
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle size={18} className="shrink-0" />
            <p className="text-xs font-bold uppercase tracking-widest leading-tight">
              Profile_Incomplete: <span className="font-mono opacity-70">Complete your profile to unlock full sector access.</span>
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link 
              to={`/profile/${user.uid}`}
              className="flex items-center gap-2 bg-black text-[#00ff00] px-4 py-1.5 text-[10px] font-black uppercase tracking-tighter hover:bg-[#222] transition-all whitespace-nowrap"
            >
              Update_Profile
              <ArrowRight size={14} />
            </Link>
            <button onClick={() => setDismissed(true)} className="hover:opacity-70 transition-opacity">
              <X size={18} />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
