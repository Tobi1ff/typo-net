import { useState, useEffect } from 'react';
import { collection, query, getDocs, deleteDoc, doc, updateDoc, where, orderBy, limit, getDoc } from 'firebase/firestore';
import { db, auth, isAdmin } from '../firebase';
import { Shield, Trash2, UserX, AlertTriangle, CheckCircle, Search, Filter, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Admin() {
  const [activeTab, setActiveTab] = useState<'posts' | 'users' | 'projects' | 'reports'>('posts');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      if (!auth?.currentUser || !db) {
        // If not logged in yet, wait or deny
        if (auth?.currentUser === null) setIsAuthorized(false);
        return;
      }
      
      // Check hardcoded email first (fast)
      if (isAdmin()) {
        setIsAuthorized(true);
        return;
      }

      // Check Firestore role (slower)
      try {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists() && userDoc.data().role === 'admin') {
          setIsAuthorized(true);
        } else {
          setIsAuthorized(false);
        }
      } catch (error) {
        console.error('Error checking admin role:', error);
        setIsAuthorized(false);
      }
    };

    checkAuth();
  }, [auth?.currentUser]);

  useEffect(() => {
    if (isAuthorized) {
      fetchItems();
    }
  }, [activeTab, isAuthorized]);

  const fetchItems = async () => {
    if (!db) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const colRef = collection(db, activeTab);
      const q = query(colRef, orderBy('createdAt', 'desc'), limit(50));
      const snapshot = await getDocs(q);
      setItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error('Error fetching admin items:', error);
      setStatus({ type: 'error', message: 'Failed to fetch items' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!db) return;
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      await deleteDoc(doc(db, activeTab, id));
      setItems(items.filter(item => item.id !== id));
      setStatus({ type: 'success', message: 'Item deleted successfully' });
    } catch (error) {
      console.error('Error deleting item:', error);
      setStatus({ type: 'error', message: 'Failed to delete item' });
    }
  };

  const handleBanUser = async (uid: string) => {
    if (!db) return;
    if (!window.confirm('Are you sure you want to ban this user?')) return;
    try {
      // In a real app, you'd have a 'banned' field or use Firebase Auth Admin SDK
      await updateDoc(doc(db, 'users', uid), { role: 'banned' });
      setStatus({ type: 'success', message: 'User banned successfully' });
      fetchItems();
    } catch (error) {
      console.error('Error banning user:', error);
      setStatus({ type: 'error', message: 'Failed to ban user' });
    }
  };

  const handleResolveReport = async (id: string, status: 'resolved' | 'reviewed') => {
    if (!db) return;
    try {
      await updateDoc(doc(db, 'reports', id), { status });
      setItems(items.map(item => item.id === id ? { ...item, status } : item));
      setStatus({ type: 'success', message: `Report marked as ${status}` });
    } catch (error) {
      console.error('Error resolving report:', error);
      setStatus({ type: 'error', message: 'Failed to resolve report' });
    }
  };

  if (isAuthorized === null) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <Lock size={48} className="mx-auto text-[#00ff00] animate-pulse" />
          <p className="text-[#666] font-mono text-xs animate-pulse uppercase tracking-[0.2em]">Verifying_Credentials...</p>
        </div>
      </div>
    );
  }

  if (isAuthorized === false) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <Shield size={48} className="mx-auto text-red-500" />
          <h1 className="text-2xl font-black italic transform -skew-x-12 text-white">ACCESS_DENIED</h1>
          <p className="text-[#666] font-mono">ADMIN_PRIVILEGES_REQUIRED</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between border-b border-[#222] pb-6">
        <div className="flex items-center gap-3">
          <Shield size={32} className="text-[#00ff00]" />
          <h1 className="text-3xl font-black italic transform -skew-x-12 uppercase tracking-tighter">
            Command_Center
          </h1>
        </div>
        <div className="flex gap-2">
          {['posts', 'users', 'projects', 'reports'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-2 text-[10px] font-mono border transition-all ${
                activeTab === tab 
                  ? 'bg-[#00ff00] text-black border-[#00ff00]' 
                  : 'text-[#666] border-[#222] hover:border-[#444]'
              }`}
            >
              {tab.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {status && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`p-4 border font-mono text-xs flex items-center gap-3 ${
              status.type === 'success' ? 'bg-[#00ff00]/10 border-[#00ff00] text-[#00ff00]' : 'bg-red-500/10 border-red-500 text-red-500'
            }`}
          >
            {status.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
            {status.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#444]" />
        <input
          type="text"
          placeholder={`SEARCH_${activeTab.toUpperCase()}...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-[#111] border border-[#222] pl-10 pr-4 py-3 text-sm font-mono focus:border-[#00ff00] focus:ring-0"
        />
      </div>

      <div className="grid gap-4">
        {loading ? (
          <div className="text-center py-20 font-mono text-[#444] animate-pulse">FETCHING_DATA...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 font-mono text-[#444]">NO_ITEMS_FOUND</div>
        ) : (
          items.map((item) => (
            <motion.div
              layout
              key={item.id}
              className="bg-[#111] border border-[#222] p-4 flex items-center justify-between group hover:border-[#444] transition-all"
            >
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono text-[#444]">ID: {item.id}</span>
                  <span className="text-[10px] font-mono text-[#00ff00]">
                    {new Date(item.createdAt?.toDate?.() || item.createdAt).toLocaleString()}
                  </span>
                </div>
                <h3 className="text-white font-bold truncate">
                  {activeTab === 'users' ? item.displayName : 
                   activeTab === 'posts' ? item.content : 
                   activeTab === 'projects' ? item.title :
                   `REPORT: ${item.reason}`}
                </h3>
                {activeTab === 'users' && <p className="text-xs text-[#666] font-mono">{item.uid}</p>}
                {activeTab === 'posts' && item.authorName && (
                  <p className="text-xs text-[#666] font-mono">BY: {item.authorName}</p>
                )}
                {activeTab === 'reports' && (
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-[#aaa] font-mono">TARGET_ID: {item.targetId} ({item.targetType})</p>
                    <p className="text-xs text-[#aaa] font-mono">REPORTER: {item.reporterName}</p>
                    {item.details && <p className="text-xs text-[#666] italic">"{item.details}"</p>}
                    <span className={`inline-block px-2 py-0.5 text-[8px] font-mono uppercase ${
                      item.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-[#00ff00]/20 text-[#00ff00]'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                {activeTab === 'reports' && item.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleResolveReport(item.id, 'reviewed')}
                      className="p-2 text-[#666] hover:text-[#00ff00] transition-all"
                      title="Mark as Reviewed"
                    >
                      <CheckCircle size={18} />
                    </button>
                    <button
                      onClick={() => handleResolveReport(item.id, 'resolved')}
                      className="p-2 text-[#666] hover:text-[#00ff00] transition-all"
                      title="Mark as Resolved"
                    >
                      <Shield size={18} />
                    </button>
                  </>
                )}
                {activeTab === 'users' && item.role !== 'banned' && (
                  <button
                    onClick={() => handleBanUser(item.id)}
                    className="p-2 text-[#666] hover:text-red-500 transition-all"
                    title="Ban User"
                  >
                    <UserX size={18} />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-2 text-[#666] hover:text-red-500 transition-all"
                  title="Delete Item"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
