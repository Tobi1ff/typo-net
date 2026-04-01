import { useState } from 'react';
import { User } from 'firebase/auth';
import { collection, addDoc, serverTimestamp, updateDoc, doc, increment } from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from '../firebase';
import { motion } from 'motion/react';
import { Code, Send, Image as ImageIcon, Terminal, Globe, Lock } from 'lucide-react';

interface CreatePostProps {
  user: User;
}

export default function CreatePost({ user }: CreatePostProps) {
  const [content, setContent] = useState('');
  const [codeSnippet, setCodeSnippet] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [showCode, setShowCode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !codeSnippet.trim()) return;
    if (!db) {
      alert('Database connection not available.');
      return;
    }

    setLoading(true);
    try {
      const postData = {
        authorUid: user.uid,
        authorName: user.displayName || 'Anonymous',
        authorPhoto: user.photoURL || '',
        content: content.trim(),
        codeSnippet: showCode ? codeSnippet.trim() : '',
        language: showCode ? language : '',
        likesCount: 0,
        commentsCount: 0,
        visibility,
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'posts'), postData);
      
      setContent('');
      setCodeSnippet('');
      setShowCode(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'posts');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#111] border border-[#222] p-4 mb-8">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-4">
          <img 
            src={user.photoURL || ''} 
            alt={user.displayName || ''} 
            className="w-10 h-10 border border-[#333] shrink-0" 
          />
          <div className="flex-1 space-y-4">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your terminal?"
              className="w-full bg-transparent border-none focus:ring-0 text-white placeholder-[#444] resize-none min-h-[80px] font-sans"
            />

            {showCode && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2"
              >
                <div className="flex items-center justify-between bg-[#0a0a0a] p-2 border border-[#222]">
                  <select 
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="bg-transparent text-[10px] font-mono text-[#00ff00] border-none focus:ring-0 uppercase"
                  >
                    <option value="javascript">javascript</option>
                    <option value="typescript">typescript</option>
                    <option value="python">python</option>
                    <option value="rust">rust</option>
                    <option value="cpp">cpp</option>
                    <option value="css">css</option>
                    <option value="html">html</option>
                  </select>
                  <span className="text-[10px] font-mono text-[#444]">CODE_BLOCK</span>
                </div>
                <textarea
                  value={codeSnippet}
                  onChange={(e) => setCodeSnippet(e.target.value)}
                  placeholder="Paste your code here..."
                  className="w-full bg-[#0a0a0a] border border-[#222] p-4 font-mono text-sm text-[#00ff00] focus:border-[#00ff00] focus:ring-0 min-h-[150px]"
                />
              </motion.div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-[#222]">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowCode(!showCode)}
                  className={`p-2 transition-all ${showCode ? 'text-[#00ff00] bg-[#00ff00]/10' : 'text-[#666] hover:text-white'}`}
                  title="Add Code Snippet"
                >
                  <Code size={20} />
                </button>
                <button
                  type="button"
                  className="p-2 text-[#666] hover:text-white transition-all"
                  title="Add Image (Coming Soon)"
                >
                  <ImageIcon size={20} />
                </button>
                <div className="h-8 w-[1px] bg-[#222] mx-1" />
                <button
                  type="button"
                  onClick={() => setVisibility(visibility === 'public' ? 'private' : 'public')}
                  className={`p-2 flex items-center gap-2 text-[10px] font-mono transition-all ${visibility === 'private' ? 'text-yellow-500 bg-yellow-500/10' : 'text-[#666] hover:text-white'}`}
                  title={visibility === 'public' ? 'Public Post' : 'Private Post'}
                >
                  {visibility === 'public' ? <Globe size={18} /> : <Lock size={18} />}
                  <span className="hidden sm:inline uppercase">{visibility}</span>
                </button>
              </div>

              <button
                type="submit"
                disabled={loading || (!content.trim() && !codeSnippet.trim())}
                className="flex items-center gap-2 bg-[#00ff00] text-black font-bold px-6 py-2 hover:bg-[#00cc00] disabled:opacity-50 transition-all active:scale-95"
              >
                {loading ? 'EXECUTING...' : 'PUSH'}
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
