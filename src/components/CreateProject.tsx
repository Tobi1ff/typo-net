import { useState } from 'react';
import { User } from 'firebase/auth';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from '../firebase';
import { motion } from 'motion/react';
import { X, Layout, Github, ExternalLink, Plus, Globe, Lock } from 'lucide-react';

interface CreateProjectProps {
  user: User;
  onClose: () => void;
}

export default function CreateProject({ user, onClose }: CreateProjectProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [demoUrl, setDemoUrl] = useState('');
  const [techStack, setTechStack] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [loading, setLoading] = useState(false);
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    if (!db) {
      alert('Database connection not available.');
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'projects'), {
        authorUid: user.uid,
        authorName: user.displayName || 'Anonymous',
        title: title.trim(),
        description: description.trim(),
        repoUrl: repoUrl.trim(),
        demoUrl: demoUrl.trim(),
        techStack: techStack.split(',').map(s => s.trim()).filter(s => s !== ''),
        thumbnail: thumbnail.trim(),
        likesCount: 0,
        visibility,
        createdAt: serverTimestamp(),
      });
      onClose();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'projects');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#111] border border-[#222] w-full max-w-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between p-6 border-b border-[#222]">
          <div className="flex items-center gap-3">
            <Layout size={24} className="text-[#00ff00]" />
            <h2 className="text-xl font-black italic transform -skew-x-12 uppercase tracking-tighter">Push_New_Build</h2>
          </div>
          <button onClick={onClose} className="text-[#444] hover:text-white transition-all">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-mono text-[#666] uppercase">Project_Title</label>
              <input 
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Typo Social Protocol"
                className="w-full bg-[#0a0a0a] border border-[#222] p-3 text-sm focus:border-[#00ff00] focus:ring-0"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-mono text-[#666] uppercase">Tech_Stack (Comma Separated)</label>
              <input 
                value={techStack}
                onChange={(e) => setTechStack(e.target.value)}
                placeholder="React, Firebase, Tailwind"
                className="w-full bg-[#0a0a0a] border border-[#222] p-3 text-sm focus:border-[#00ff00] focus:ring-0"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-mono text-[#666] uppercase">Repository_URL</label>
              <div className="relative">
                <Github size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#444]" />
                <input 
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="github.com/username/repo"
                  className="w-full bg-[#0a0a0a] border border-[#222] pl-10 pr-3 py-3 text-sm focus:border-[#00ff00] focus:ring-0"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-mono text-[#666] uppercase">Live_Demo_URL</label>
              <div className="relative">
                <ExternalLink size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#444]" />
                <input 
                  value={demoUrl}
                  onChange={(e) => setDemoUrl(e.target.value)}
                  placeholder="project-demo.com"
                  className="w-full bg-[#0a0a0a] border border-[#222] pl-10 pr-3 py-3 text-sm focus:border-[#00ff00] focus:ring-0"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-mono text-[#666] uppercase">Thumbnail_URL (Optional)</label>
            <input 
              value={thumbnail}
              onChange={(e) => setThumbnail(e.target.value)}
              placeholder="https://picsum.photos/seed/project/800/600"
              className="w-full bg-[#0a0a0a] border border-[#222] p-3 text-sm focus:border-[#00ff00] focus:ring-0"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-mono text-[#666] uppercase">Project_Description</label>
            <textarea 
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your project, the challenges you faced, and the tech you used..."
              className="w-full bg-[#0a0a0a] border border-[#222] p-3 text-sm focus:border-[#00ff00] focus:ring-0 min-h-[120px] resize-none"
            />
          </div>

          <div className="flex justify-end items-center gap-4 pt-4 border-t border-[#222]">
            <div className="flex-1 flex gap-2">
              <button
                type="button"
                onClick={() => setVisibility('public')}
                className={`flex items-center gap-2 px-3 py-2 text-[10px] font-mono transition-all border ${visibility === 'public' ? 'border-[#00ff00] text-[#00ff00] bg-[#00ff00]/5' : 'border-[#222] text-[#444] hover:text-[#666]'}`}
              >
                <Globe size={14} />
                PUBLIC
              </button>
              <button
                type="button"
                onClick={() => setVisibility('private')}
                className={`flex items-center gap-2 px-3 py-2 text-[10px] font-mono transition-all border ${visibility === 'private' ? 'border-yellow-500 text-yellow-500 bg-yellow-500/5' : 'border-[#222] text-[#444] hover:text-[#666]'}`}
              >
                <Lock size={14} />
                PRIVATE
              </button>
            </div>
            <button 
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-xs font-mono text-[#666] hover:text-white uppercase tracking-widest"
            >
              Abort_Process
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="bg-[#00ff00] text-black font-bold px-8 py-3 hover:bg-[#00cc00] disabled:opacity-50 transition-all flex items-center gap-2 uppercase text-xs tracking-widest"
            >
              {loading ? 'UPLOADING...' : 'DEPLOY_PROJECT'}
              <Plus size={16} />
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
