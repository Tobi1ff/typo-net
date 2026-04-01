import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { User } from 'firebase/auth';
import { doc, getDoc, collection, query, where, orderBy, onSnapshot, updateDoc, setDoc, deleteDoc, serverTimestamp, addDoc, limit, getDocs } from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from '../firebase';
import PostCard from '../components/PostCard';
import ProjectCard from '../components/ProjectCard';
import CreateProject from '../components/CreateProject';
import { motion } from 'motion/react';
import { Github, Twitter, MapPin, Calendar, Edit3, Settings, Terminal, Cpu, Layout, Code, Plus, Globe, Users, ArrowRight, X, Download, FileJson, MessageSquare, Ban, AlertTriangle } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { formatDate } from '../lib/utils';
import ReportModal from '../components/ReportModal';

interface ProfileProps {
  currentUser: User;
}

export default function Profile({ currentUser }: ProfileProps) {
  const { uid } = useParams<{ uid: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'posts' | 'projects'>('posts');
  const [isFollowing, setIsFollowing] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [editData, setEditData] = useState({ displayName: '', bio: '', github: '', twitter: '', website: '', techStack: '' });
  const [followers, setFollowers] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!uid || !db) return;

    const fetchUser = async () => {
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        setUser(data);
        
        // Check if blocked
        if (currentUser.uid !== uid) {
          const blockId = `${currentUser.uid}_${uid}`;
          const blockSnap = await getDoc(doc(db, 'blocks', blockId));
          setIsBlocked(blockSnap.exists());
        }

        setEditData({
          displayName: data.displayName || '',
          bio: data.bio || '',
          github: data.github || '',
          twitter: data.twitter || '',
          website: data.website || '',
          techStack: data.techStack?.join(', ') || ''
        });
      }
    };

    const fetchPosts = () => {
      let q;
      if (uid === currentUser.uid) {
        q = query(collection(db, 'posts'), where('authorUid', '==', uid), orderBy('createdAt', 'desc'));
      } else {
        q = query(collection(db, 'posts'), where('authorUid', '==', uid), where('visibility', '==', 'public'), orderBy('createdAt', 'desc'));
      }
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, `posts (author: ${uid})`);
      });
      return unsubscribe;
    };

    const fetchProjects = () => {
      let q;
      if (uid === currentUser.uid) {
        q = query(collection(db, 'projects'), where('authorUid', '==', uid), orderBy('createdAt', 'desc'));
      } else {
        q = query(collection(db, 'projects'), where('authorUid', '==', uid), where('visibility', '==', 'public'), orderBy('createdAt', 'desc'));
      }
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, `projects (author: ${uid})`);
      });
      return unsubscribe;
    };

    const fetchFollowers = () => {
      const q = query(collection(db, 'follows'), where('followingUid', '==', uid));
      const unsubscribe = onSnapshot(q, async (snapshot) => {
        const followerIds = snapshot.docs.map(doc => doc.data().followerUid);
        const followerData = await Promise.all(followerIds.map(async (id) => {
          const userDoc = await getDoc(doc(db, 'users', id));
          return { id, ...userDoc.data() };
        }));
        setFollowers(followerData);
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, `followers of ${uid}`);
      });
      return unsubscribe;
    };

    const fetchFollowing = () => {
      const q = query(collection(db, 'follows'), where('followerUid', '==', uid));
      const unsubscribe = onSnapshot(q, async (snapshot) => {
        const followingIds = snapshot.docs.map(doc => doc.data().followingUid);
        const followingData = await Promise.all(followingIds.map(async (id) => {
          const userDoc = await getDoc(doc(db, 'users', id));
          return { id, ...userDoc.data() };
        }));
        setFollowing(followingData);
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, `following of ${uid}`);
      });
      return unsubscribe;
    };

    const checkFollowing = () => {
      if (uid === currentUser.uid) return () => {};
      const followId = `${currentUser.uid}_${uid}`;
      const followRef = doc(db, 'follows', followId);
      const unsubscribe = onSnapshot(followRef, (doc) => {
        setIsFollowing(doc.exists());
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, `follows/${followId}`);
      });
      return unsubscribe;
    };

    fetchUser();
    const unsubPosts = fetchPosts();
    const unsubProjects = fetchProjects();
    const unsubFollowers = fetchFollowers();
    const unsubFollowing = fetchFollowing();
    const unsubFollow = checkFollowing();

    return () => {
      unsubPosts();
      unsubProjects();
      unsubFollowers();
      unsubFollowing();
      unsubFollow();
    };
  }, [uid, currentUser.uid]);

  const handleFollow = async () => {
    if (!uid) return;
    const followId = `${currentUser.uid}_${uid}`;
    const followRef = doc(db, 'follows', followId);

    try {
      if (isFollowing) {
        await deleteDoc(followRef);
      } else {
        await setDoc(followRef, {
          followerUid: currentUser.uid,
          followingUid: uid,
          createdAt: serverTimestamp(),
        });

        // Create notification
        await addDoc(collection(db, 'notifications'), {
          recipientUid: uid,
          senderUid: currentUser.uid,
          senderName: currentUser.displayName,
          type: 'follow',
          read: false,
          createdAt: serverTimestamp(),
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `follows/${followId}`);
    }
  };

  const handleBlock = async () => {
    if (!uid) return;
    const blockId = `${currentUser.uid}_${uid}`;
    const blockRef = doc(db, 'blocks', blockId);

    try {
      if (isBlocked) {
        await deleteDoc(blockRef);
        setIsBlocked(false);
      } else {
        await setDoc(blockRef, {
          blockerUid: currentUser.uid,
          blockedUid: uid,
          createdAt: serverTimestamp()
        });
        setIsBlocked(true);
        if (isFollowing) {
          await handleFollow(); // Unfollow if blocking
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `blocks/${blockId}`);
    }
  };

  const handleMessage = async () => {
    if (!uid || uid === currentUser.uid) return;

    // Check if conversation already exists
    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', currentUser.uid)
    );

    try {
      const snapshot = await getDocs(q);
      const existingConv = snapshot.docs.find(doc => {
        const participants = doc.data().participants;
        return participants.includes(uid);
      });

      if (existingConv) {
        navigate(`/messages/${existingConv.id}`);
      } else {
        // Create new conversation
        const newConvRef = await addDoc(collection(db, 'conversations'), {
          participants: [currentUser.uid, uid],
          updatedAt: serverTimestamp(),
          createdAt: serverTimestamp()
        });
        navigate(`/messages/${newConvRef.id}`);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'conversations');
    }
  };

  const handleUpdate = async () => {
    if (!uid) return;
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, {
        displayName: editData.displayName,
        bio: editData.bio,
        github: editData.github,
        twitter: editData.twitter,
        website: editData.website,
        techStack: editData.techStack.split(',').map(s => s.trim()).filter(s => s !== '')
      });
      setIsEditing(false);
      // Update local state
      setUser((prev: any) => ({ ...prev, ...editData, techStack: editData.techStack.split(',').map(s => s.trim()).filter(s => s !== '') }));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
    }
  };

  const handleExportData = async () => {
    setExporting(true);
    try {
      const zip = new JSZip();
      
      // Add profile info
      zip.file('profile.json', JSON.stringify(user, null, 2));
      
      // Add posts
      zip.file('posts.json', JSON.stringify(posts, null, 2));
      
      // Add projects
      zip.file('projects.json', JSON.stringify(projects, null, 2));
      
      // Add followers
      zip.file('followers.json', JSON.stringify(followers, null, 2));
      
      // Add following
      zip.file('following.json', JSON.stringify(following, null, 2));

      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `typo_data_${user.displayName.replace(/\s+/g, '_').toLowerCase()}.zip`);
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  if (!user) return <div className="p-8 text-center font-mono text-[#444]">LOADING_PROFILE...</div>;

  const FollowModal = ({ title, users, onClose }: { title: string, users: any[], onClose: () => void }) => (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[10000] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#0d0d0d] border border-[#222] w-full max-w-md max-h-[80vh] flex flex-col"
      >
        <div className="p-4 border-b border-[#222] flex items-center justify-between">
          <h3 className="font-bold text-white uppercase tracking-widest text-sm">{title}</h3>
          <button onClick={onClose} className="text-[#444] hover:text-white"><X size={20} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {users.length > 0 ? (
            users.map(u => (
              <Link 
                key={u.id} 
                to={`/profile/${u.id}`} 
                onClick={onClose}
                className="flex items-center gap-3 p-3 bg-[#111] border border-[#222] hover:border-[#00ff00] transition-all group"
              >
                <img src={u.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.id}`} className="w-10 h-10 border border-[#333]" />
                <div className="flex-1">
                  <p className="font-bold text-white group-hover:text-[#00ff00] transition-all">{u.displayName}</p>
                  <p className="text-[10px] font-mono text-[#666]">@{u.id.slice(0, 8)}</p>
                </div>
                <ArrowRight size={16} className="text-[#222] group-hover:text-[#00ff00]" />
              </Link>
            ))
          ) : (
            <p className="text-center py-8 text-[#444] font-mono text-xs italic">No users found.</p>
          )}
        </div>
      </motion.div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <AnimatePresence>
        {showFollowersModal && <FollowModal title="Followers" users={followers} onClose={() => setShowFollowersModal(false)} />}
        {showFollowingModal && <FollowModal title="Following" users={following} onClose={() => setShowFollowingModal(false)} />}
      </AnimatePresence>
      
      {showCreateProject && <CreateProject user={currentUser} onClose={() => setShowCreateProject(false)} />}
      
      {/* Profile Header */}
      <div className="bg-[#111] border border-[#222] mb-8 overflow-hidden relative">
        <div className="h-32 bg-gradient-to-r from-[#00ff00]/20 to-transparent border-b border-[#222]" />
        <div className="p-6 pt-0 flex flex-col md:flex-row gap-6 items-start -mt-12">
          <img 
            src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} 
            alt={user.displayName} 
            className="w-32 h-32 border-4 border-[#0a0a0a] bg-[#111] shadow-2xl" 
          />
          <div className="flex-1 pt-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-black tracking-tighter italic transform -skew-x-12 text-white">{user.displayName}</h1>
                <div className="flex items-center gap-4 mt-1">
                  <p className="text-[10px] font-mono text-[#00ff00] uppercase tracking-widest">@{user.uid.slice(0, 8)}</p>
                  <button 
                    onClick={() => setShowFollowersModal(true)}
                    className="text-[10px] font-mono text-[#666] hover:text-[#00ff00] uppercase transition-all"
                  >
                    {followers.length} Followers
                  </button>
                  <button 
                    onClick={() => setShowFollowingModal(true)}
                    className="text-[10px] font-mono text-[#666] hover:text-[#00ff00] uppercase transition-all"
                  >
                    {following.length} Following
                  </button>
                </div>
              </div>
              <div className="flex gap-2">
                {uid === currentUser.uid ? (
                  <>
                    <button 
                      onClick={handleExportData}
                      disabled={exporting}
                      className="flex items-center gap-2 bg-[#111] border border-[#222] text-[#666] px-4 py-2 hover:bg-[#222] hover:text-[#00ff00] transition-all font-mono text-xs disabled:opacity-50"
                      title="Download your data as ZIP"
                    >
                      <Download size={14} />
                      {exporting ? 'EXPORTING...' : 'EXPORT_DATA'}
                    </button>
                    <button 
                      onClick={() => setIsEditing(!isEditing)}
                      className="flex items-center gap-2 bg-[#222] text-white px-4 py-2 hover:bg-[#333] transition-all font-mono text-xs"
                    >
                      <Edit3 size={14} />
                      EDIT_PROFILE
                    </button>
                  </>
                ) : (
                  <div className="flex gap-2">
                    <button 
                      onClick={handleMessage}
                      className="flex items-center gap-2 bg-[#111] border border-[#222] text-white px-4 py-2 hover:bg-[#222] hover:text-[#00ff00] transition-all font-mono text-xs"
                    >
                      <MessageSquare size={14} />
                      MESSAGE
                    </button>
                    <button 
                      onClick={handleFollow}
                      className={`flex items-center gap-2 px-6 py-2 font-bold transition-all active:scale-95 ${isFollowing ? 'bg-[#222] text-white hover:bg-red-900/20 hover:text-red-500' : 'bg-[#00ff00] text-black hover:bg-[#00cc00]'}`}
                    >
                      {isFollowing ? 'DISCONNECT' : 'CONNECT'}
                    </button>
                    <button 
                      onClick={handleBlock}
                      className={`flex items-center gap-2 px-4 py-2 font-bold transition-all active:scale-95 border ${isBlocked ? 'bg-red-900/20 text-red-500 border-red-500/50 hover:bg-red-900/30' : 'bg-[#111] text-[#666] border-[#222] hover:border-red-500/50 hover:text-red-500'}`}
                      title={isBlocked ? 'Unblock User' : 'Block User'}
                    >
                      <Ban size={14} />
                      {isBlocked ? 'UNBLOCK' : 'BLOCK'}
                    </button>
                    <button 
                      onClick={() => setShowReportModal(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-[#111] text-[#666] border border-[#222] hover:border-yellow-500/50 hover:text-yellow-500 transition-all font-mono text-xs"
                      title="Report User"
                    >
                      <AlertTriangle size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <ReportModal 
              isOpen={showReportModal}
              onClose={() => setShowReportModal(false)}
              targetId={uid || ''}
              targetType="user"
              currentUser={currentUser}
            />

            <div className="mt-4 text-[#aaa] max-w-2xl">
              {isEditing ? (
                <div className="space-y-4 bg-[#0d0d0d] p-4 border border-[#222]">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input 
                      value={editData.displayName}
                      onChange={(e) => setEditData({ ...editData, displayName: e.target.value })}
                      placeholder="Display Name"
                      className="bg-transparent border border-[#222] p-2 text-sm focus:border-[#00ff00] focus:ring-0"
                    />
                    <input 
                      value={editData.techStack}
                      onChange={(e) => setEditData({ ...editData, techStack: e.target.value })}
                      placeholder="Tech Stack (comma separated)"
                      className="bg-transparent border border-[#222] p-2 text-sm focus:border-[#00ff00] focus:ring-0"
                    />
                    <input 
                      value={editData.github}
                      onChange={(e) => setEditData({ ...editData, github: e.target.value })}
                      placeholder="GitHub Username"
                      className="bg-transparent border border-[#222] p-2 text-sm focus:border-[#00ff00] focus:ring-0"
                    />
                    <input 
                      value={editData.twitter}
                      onChange={(e) => setEditData({ ...editData, twitter: e.target.value })}
                      placeholder="Twitter Username"
                      className="bg-transparent border border-[#222] p-2 text-sm focus:border-[#00ff00] focus:ring-0"
                    />
                    <input 
                      value={editData.website}
                      onChange={(e) => setEditData({ ...editData, website: e.target.value })}
                      placeholder="Website URL"
                      className="bg-transparent border border-[#222] p-2 text-sm focus:border-[#00ff00] focus:ring-0 md:col-span-2"
                    />
                  </div>
                  <textarea 
                    value={editData.bio}
                    onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                    placeholder="Bio"
                    className="w-full bg-transparent border border-[#222] p-2 text-sm focus:border-[#00ff00] focus:ring-0 min-h-[100px]"
                  />
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-xs font-mono text-[#666] hover:text-white">CANCEL</button>
                    <button onClick={handleUpdate} className="bg-[#00ff00] text-black px-6 py-2 text-xs font-bold hover:bg-[#00cc00]">SAVE_CHANGES</button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="mb-4 leading-relaxed">{user.bio || 'No bio provided.'}</p>
                  <div className="flex flex-wrap gap-4 text-xs font-mono text-[#666]">
                    {user.github && (
                      <a href={`https://github.com/${user.github}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-[#00ff00]">
                        <Github size={14} /> {user.github}
                      </a>
                    )}
                    {user.twitter && (
                      <a href={`https://twitter.com/${user.twitter}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-[#00ff00]">
                        <Twitter size={14} /> {user.twitter}
                      </a>
                    )}
                    {user.website && (
                      <a href={user.website.startsWith('http') ? user.website : `https://${user.website}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-[#00ff00]">
                        <Globe size={14} /> Website
                      </a>
                    )}
                    <div className="flex items-center gap-1">
                      <Calendar size={14} /> Joined {formatDate(user.createdAt?.toDate())}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Tech Stack Bar */}
        {!isEditing && user.techStack?.length > 0 && (
          <div className="px-6 pb-6 flex flex-wrap gap-2">
            {user.techStack.map((tech: string) => (
              <span key={tech} className="px-2 py-1 bg-[#0a0a0a] border border-[#222] text-[10px] font-mono text-[#00ff00] uppercase">
                {tech}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Profile Tabs */}
      <div className="flex border-b border-[#222] mb-8">
        <button 
          onClick={() => setActiveTab('posts')}
          className={`px-8 py-4 text-xs font-mono uppercase tracking-widest transition-all ${activeTab === 'posts' ? 'text-[#00ff00] border-b-2 border-[#00ff00] bg-[#111]' : 'text-[#444] hover:text-white'}`}
        >
          Activity_Log ({posts.length})
        </button>
        <button 
          onClick={() => setActiveTab('projects')}
          className={`px-8 py-4 text-xs font-mono uppercase tracking-widest transition-all ${activeTab === 'projects' ? 'text-[#00ff00] border-b-2 border-[#00ff00] bg-[#111]' : 'text-[#444] hover:text-white'}`}
        >
          Build_Showcase ({projects.length})
        </button>
      </div>

      {/* Profile Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {activeTab === 'posts' ? (
            <>
              {loading ? (
                <div className="h-64 bg-[#111] border border-[#222] animate-pulse" />
              ) : posts.length > 0 ? (
                posts.map(post => <PostCard key={post.id} post={post} currentUser={currentUser} />)
              ) : (
                <div className="p-12 text-center border border-dashed border-[#222]">
                  <p className="text-[#444] font-mono uppercase tracking-widest text-sm">No activity recorded for this user.</p>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-6">
              {uid === currentUser.uid && (
                <button 
                  onClick={() => setShowCreateProject(true)}
                  className="w-full py-8 border border-dashed border-[#222] hover:border-[#00ff00] hover:bg-[#00ff00]/5 transition-all flex flex-col items-center justify-center gap-2 group"
                >
                  <Plus size={32} className="text-[#222] group-hover:text-[#00ff00]" />
                  <span className="text-xs font-mono text-[#444] group-hover:text-white uppercase tracking-widest">Push_New_Build</span>
                </button>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {projects.length > 0 ? (
                  projects.map(project => <ProjectCard key={project.id} project={project} />)
                ) : (
                  <div className="col-span-full p-12 text-center border border-dashed border-[#222]">
                    <p className="text-[#444] font-mono uppercase tracking-widest text-sm">No projects showcased yet.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-8">
          <div className="bg-[#111] border border-[#222] p-6">
            <div className="flex items-center gap-2 mb-4">
              <Cpu size={18} className="text-[#00ff00]" />
              <h3 className="font-bold text-white uppercase tracking-tighter italic transform -skew-x-6">Stats</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-[#0a0a0a] border border-[#222]">
                <p className="text-[10px] font-mono text-[#666] uppercase">Posts</p>
                <p className="text-2xl font-black text-white">{posts.length}</p>
              </div>
              <div className="p-4 bg-[#0a0a0a] border border-[#222]">
                <p className="text-[10px] font-mono text-[#666] uppercase">Builds</p>
                <p className="text-2xl font-black text-white">{projects.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-[#111] border border-[#222] p-6">
            <div className="flex items-center gap-2 mb-4">
              <Code size={18} className="text-[#00ff00]" />
              <h3 className="font-bold text-white uppercase tracking-tighter italic transform -skew-x-6">Sector_Info</h3>
            </div>
            <div className="space-y-3 text-[10px] font-mono text-[#666]">
              <div className="flex justify-between">
                <span>STATUS</span>
                <span className="text-[#00ff00]">ONLINE</span>
              </div>
              <div className="flex justify-between">
                <span>ENCRYPTION</span>
                <span>AES-256</span>
              </div>
              <div className="flex justify-between">
                <span>PROTOCOL</span>
                <span>TYPO_v1.0</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

