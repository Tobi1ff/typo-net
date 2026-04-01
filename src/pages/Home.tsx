import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { collection, query, orderBy, onSnapshot, limit, where } from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from '../firebase';
import CreatePost from '../components/CreatePost';
import PostCard from '../components/PostCard';
import { motion } from 'motion/react';
import { Terminal, Activity } from 'lucide-react';
import { getBlockedUsers, getUsersWhoBlockedMe } from '../services/blockService';

interface HomeProps {
  user: User;
}

export default function Home({ user }: HomeProps) {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [blockedUids, setBlockedUids] = useState<string[]>([]);
  const [whoBlockedMe, setWhoBlockedMe] = useState<string[]>([]);

  useEffect(() => {
    // Listen to blocks
    const unsubBlocked = getBlockedUsers(user.uid, setBlockedUids);
    const unsubWhoBlockedMe = getUsersWhoBlockedMe(user.uid, setWhoBlockedMe);

    const q = query(
      collection(db, 'posts'), 
      where('visibility', '==', 'public'),
      orderBy('createdAt', 'desc'), 
      limit(50)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPosts(postsData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'posts');
    });

    return () => {
      unsubscribe();
      unsubBlocked();
      unsubWhoBlockedMe();
    };
  }, [user.uid]);

  const filteredPosts = posts.filter(post => 
    !blockedUids.includes(post.authorUid) && !whoBlockedMe.includes(post.authorUid)
  );

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tighter italic transform -skew-x-12 text-white">SYSTEM_FEED</h1>
          <p className="text-[10px] font-mono text-[#00ff00] uppercase tracking-widest">// Real-time developer activity</p>
        </div>
        <div className="flex items-center gap-2 text-[#444]">
          <Activity size={16} className="animate-pulse text-[#00ff00]" />
          <span className="text-[10px] font-mono">LIVE_SYNC</span>
        </div>
      </div>

      <CreatePost user={user} />

      {filteredPosts.length === 0 && !loading && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0a0a0a] border border-[#00ff00]/20 p-8 mb-8 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Terminal size={120} />
          </div>
          <h2 className="text-2xl font-black tracking-tighter italic transform -skew-x-12 text-white mb-2">WELCOME_TO_TYPO</h2>
          <p className="text-sm text-[#888] font-mono mb-6 max-w-md">
            You've entered the decentralized developer hub. Share your logic, showcase your builds, and connect with the sector.
          </p>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 text-[10px] font-mono text-[#00ff00] border border-[#00ff00]/30 px-3 py-1 rounded-full">
              <span className="w-1.5 h-1.5 bg-[#00ff00] rounded-full animate-pulse" />
              STATUS: CONNECTED
            </div>
            <div className="flex items-center gap-2 text-[10px] font-mono text-[#666] border border-[#222] px-3 py-1 rounded-full">
              ENCRYPTION: AES-256
            </div>
          </div>
        </motion.div>
      )}

      <div className="space-y-6">
        {loading ? (
          <div className="space-y-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 bg-[#111] border border-[#222] animate-pulse" />
            ))}
          </div>
        ) : filteredPosts.length > 0 ? (
          filteredPosts.map((post) => (
            <PostCard key={post.id} post={post} currentUser={user} />
          ))
        ) : (
          <div className="text-center py-20 border border-dashed border-[#222]">
            <Terminal size={48} className="mx-auto text-[#222] mb-4" />
            <p className="text-[#444] font-mono uppercase tracking-widest text-sm">No data packets found in this sector.</p>
          </div>
        )}
      </div>
    </div>
  );
}
