import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User } from 'firebase/auth';
import { collection, query, where, orderBy, onSnapshot, updateDoc, doc, limit } from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from '../firebase';
import { Bell, Heart, MessageSquare, UserPlus, Terminal, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { formatDate } from '../lib/utils';

interface NotificationsProps {
  user: User;
}

export default function Notifications({ user }: NotificationsProps) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'notifications'),
      where('recipientUid', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setNotifications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'notifications');
    });

    return () => unsubscribe();
  }, [user.uid]);

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (error) {
      console.error(error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'like': return <Heart size={16} className="text-red-500" />;
      case 'comment': return <MessageSquare size={16} className="text-blue-500" />;
      case 'follow': return <UserPlus size={16} className="text-[#00ff00]" />;
      default: return <Bell size={16} />;
    }
  };

  const getMessage = (notif: any) => {
    switch (notif.type) {
      case 'like': return 'liked your post';
      case 'comment': return 'commented on your post';
      case 'follow': return 'started following you';
      default: return 'sent you a notification';
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8">
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-3xl font-black tracking-tighter italic transform -skew-x-12 text-white mb-2">ALERTS_LOG</h1>
          <p className="text-[10px] font-mono text-[#00ff00] uppercase tracking-widest">// System notifications</p>
        </div>
        <button className="text-[10px] font-mono text-[#444] hover:text-[#00ff00] transition-all flex items-center gap-1">
          <CheckCircle2 size={12} />
          MARK_ALL_READ
        </button>
      </div>

      <div className="space-y-2">
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-[#111] border border-[#222] animate-pulse" />
            ))}
          </div>
        ) : notifications.length > 0 ? (
          notifications.map((notif) => (
            <motion.div 
              key={notif.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => markAsRead(notif.id)}
              className={`flex items-center gap-4 p-4 border transition-all ${notif.read ? 'bg-[#0a0a0a] border-[#222] opacity-60' : 'bg-[#111] border-[#00ff00]/30'}`}
            >
              <div className="p-2 bg-[#0a0a0a] border border-[#222]">
                {getIcon(notif.type)}
              </div>
              <div className="flex-1">
                <p className="text-sm">
                  <Link to={`/profile/${notif.senderUid}`} className="font-bold text-white hover:text-[#00ff00]">{notif.senderName}</Link>
                  <span className="text-[#888] ml-2">{getMessage(notif)}</span>
                </p>
                <p className="text-[10px] font-mono text-[#444]">{formatDate(notif.createdAt?.toDate())}</p>
              </div>
              {notif.postUid && (
                <Link 
                  to={`/`} // In a real app, link to specific post
                  className="p-2 text-[#444] hover:text-white"
                >
                  <Terminal size={16} />
                </Link>
              )}
            </motion.div>
          ))
        ) : (
          <div className="text-center py-20 border border-dashed border-[#222]">
            <Bell size={48} className="mx-auto text-[#111] mb-4" />
            <p className="text-[#444] font-mono uppercase tracking-widest text-sm">No alerts detected in this session.</p>
          </div>
        )}
      </div>
    </div>
  );
}
