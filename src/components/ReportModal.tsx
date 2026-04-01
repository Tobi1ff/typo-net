import { useState } from 'react';
import { User } from 'firebase/auth';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X, Send, CheckCircle2 } from 'lucide-react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetId: string;
  targetType: 'post' | 'project' | 'user' | 'comment';
  currentUser: User;
}

const REPORT_REASONS = [
  'Spam or misleading',
  'Harassment or hate speech',
  'Inappropriate content',
  'Intellectual property violation',
  'Malicious code or security risk',
  'Other'
];

export default function ReportModal({ isOpen, onClose, targetId, targetType, currentUser }: ReportModalProps) {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) return;

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'reports'), {
        targetId,
        targetType,
        reporterUid: currentUser.uid,
        reporterName: currentUser.displayName,
        reason,
        details: details.trim(),
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      setSubmitted(true);
      setTimeout(() => {
        onClose();
        setSubmitted(false);
        setReason('');
        setDetails('');
      }, 2000);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'reports');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100000] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-[#0d0d0d] border border-[#222] w-full max-w-md overflow-hidden relative"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-500 to-transparent" />
            
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-full">
                    <AlertTriangle size={20} className="text-yellow-500" />
                  </div>
                  <h2 className="text-xl font-black tracking-tighter italic transform -skew-x-12 text-white uppercase">
                    Report_{targetType}
                  </h2>
                </div>
                <button onClick={onClose} className="text-[#444] hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>

              {submitted ? (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="py-12 flex flex-col items-center justify-center text-center space-y-4"
                >
                  <CheckCircle2 size={48} className="text-[#00ff00]" />
                  <div>
                    <p className="text-white font-bold uppercase tracking-widest">Report_Submitted</p>
                    <p className="text-xs font-mono text-[#666] mt-2">Our moderators will review this shortly.</p>
                  </div>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono text-[#666] uppercase tracking-widest">Select_Reason</label>
                    <div className="grid grid-cols-1 gap-2">
                      {REPORT_REASONS.map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setReason(r)}
                          className={`text-left p-3 text-sm font-mono border transition-all ${
                            reason === r 
                              ? 'bg-yellow-500/10 border-yellow-500 text-yellow-500' 
                              : 'bg-[#111] border-[#222] text-[#aaa] hover:border-[#444]'
                          }`}
                        >
                          {r.toUpperCase().replace(/\s+/g, '_')}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-mono text-[#666] uppercase tracking-widest">Additional_Details (Optional)</label>
                    <textarea
                      value={details}
                      onChange={(e) => setDetails(e.target.value)}
                      placeholder="Provide more context..."
                      className="w-full bg-[#111] border border-[#222] p-3 text-sm text-white focus:border-yellow-500 focus:ring-0 min-h-[100px] font-mono"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting || !reason}
                    className="w-full bg-yellow-500 text-black py-4 font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
                  >
                    {submitting ? 'SUBMITTING...' : (
                      <>
                        <Send size={18} />
                        SUBMIT_REPORT
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
            
            <div className="p-4 bg-[#0a0a0a] border-t border-[#222]">
              <p className="text-[9px] font-mono text-[#444] text-center leading-relaxed">
                Abuse of the reporting system may result in account restrictions. 
                Reports are processed according to our Community Guidelines.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
