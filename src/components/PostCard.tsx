import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User } from 'firebase/auth';
import { doc, updateDoc, increment, deleteDoc, collection, addDoc, query, where, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from '../firebase';
import { motion } from 'motion/react';
import { Heart, MessageSquare, Share2, Trash2, Code, Terminal, ExternalLink, Lock, Ban, AlertTriangle } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { formatDate } from '../lib/utils';
import ReactMarkdown from 'react-markdown';
import ReportModal from './ReportModal';

interface PostCardProps {
  post: any;
  currentUser: User;
}

export default function PostCard({ post, currentUser }: PostCardProps) {
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likesCount || 0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComment, setLoadingComment] = useState(false);
  const [isBlockedByAuthor, setIsBlockedByAuthor] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  useEffect(() => {
    if (!db) return;
    // Check if user liked the post
    const likeRef = doc(db, 'posts', post.id, 'likes', currentUser.uid);
    const unsubscribe = onSnapshot(likeRef, (doc) => {
      setLiked(doc.exists());
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `posts/${post.id}/likes/${currentUser.uid}`);
    });
    return () => unsubscribe();
  }, [post.id, currentUser.uid]);

  useEffect(() => {
    if (!db) return;
    if (currentUser.uid !== post.authorUid) {
      const blockId = `${post.authorUid}_${currentUser.uid}`;
      const unsub = onSnapshot(doc(db, 'blocks', blockId), (doc) => {
        setIsBlockedByAuthor(doc.exists());
      });
      return () => unsub();
    }
  }, [post.authorUid, currentUser.uid]);

  useEffect(() => {
    if (!db) return;
    if (showComments) {
      const commentsRef = collection(db, 'posts', post.id, 'comments');
      const q = query(commentsRef);
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const commentsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setComments(commentsData.sort((a: any, b: any) => b.createdAt?.seconds - a.createdAt?.seconds));
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, `posts/${post.id}/comments`);
      });
      return () => unsubscribe();
    }
  }, [showComments, post.id]);

  const handleLike = async () => {
    if (isBlockedByAuthor || !db) return;
    const likeRef = doc(db, 'posts', post.id, 'likes', currentUser.uid);
    const postRef = doc(db, 'posts', post.id);

    try {
      if (liked) {
        await deleteDoc(likeRef);
        await updateDoc(postRef, { likesCount: increment(-1) });
        setLikesCount(prev => prev - 1);
      } else {
        await setDoc(likeRef, {
          userUid: currentUser.uid,
          postUid: post.id,
          createdAt: serverTimestamp(),
        });
        await updateDoc(postRef, { likesCount: increment(1) });
        setLikesCount(prev => prev + 1);

        // Create notification
        if (post.authorUid !== currentUser.uid) {
          await addDoc(collection(db, 'notifications'), {
            recipientUid: post.authorUid,
            senderUid: currentUser.uid,
            senderName: currentUser.displayName,
            type: 'like',
            postUid: post.id,
            read: false,
            createdAt: serverTimestamp(),
          });
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `posts/${post.id}`);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isBlockedByAuthor || !db) return;

    setLoadingComment(true);
    try {
      await addDoc(collection(db, 'posts', post.id, 'comments'), {
        postUid: post.id,
        authorUid: currentUser.uid,
        authorName: currentUser.displayName,
        authorPhoto: currentUser.photoURL,
        content: newComment.trim(),
        createdAt: serverTimestamp(),
      });

      await updateDoc(doc(db, 'posts', post.id), {
        commentsCount: increment(1)
      });

      // Create notification
      if (post.authorUid !== currentUser.uid) {
        await addDoc(collection(db, 'notifications'), {
          recipientUid: post.authorUid,
          senderUid: currentUser.uid,
          senderName: currentUser.displayName,
          type: 'comment',
          postUid: post.id,
          read: false,
          createdAt: serverTimestamp(),
        });
      }

      setNewComment('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `posts/${post.id}/comments`);
    } finally {
      setLoadingComment(false);
    }
  };

  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDelete = async () => {
    if (!confirmDelete || !db) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
      return;
    }
    try {
      await deleteDoc(doc(db, 'posts', post.id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `posts/${post.id}`);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#111] border border-[#222] overflow-hidden mb-6"
    >
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <Link to={`/profile/${post.authorUid}`} className="flex items-center gap-3 group">
            <img 
              src={post.authorPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.authorUid}`} 
              alt={post.authorName} 
              className="w-10 h-10 border border-[#333] group-hover:border-[#00ff00] transition-all" 
            />
            <div>
              <div className="flex items-center gap-2">
                <p className="font-bold text-white group-hover:text-[#00ff00] transition-all">{post.authorName}</p>
                {post.visibility === 'private' && <Lock size={12} className="text-yellow-500" />}
              </div>
              <p className="text-[10px] font-mono text-[#666]">{formatDate(post.createdAt?.toDate())}</p>
            </div>
          </Link>
          
          {currentUser.uid === post.authorUid ? (
            <button 
              onClick={handleDelete} 
              className={`transition-all flex items-center gap-2 text-xs font-mono ${confirmDelete ? 'text-red-500' : 'text-[#444] hover:text-red-500'}`}
            >
              {confirmDelete && <span>CONFIRM?</span>}
              <Trash2 size={18} />
            </button>
          ) : (
            <button 
              onClick={() => setShowReportModal(true)}
              className="text-[#444] hover:text-yellow-500 transition-all flex items-center gap-2 text-xs font-mono"
              title="Report this post"
            >
              <AlertTriangle size={18} />
            </button>
          )}
        </div>

        <ReportModal 
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          targetId={post.id}
          targetType="post"
          currentUser={currentUser}
        />


        <div className="space-y-4 mb-6">
          <div className="text-[#e0e0e0] leading-relaxed whitespace-pre-wrap">
            <ReactMarkdown>{post.content}</ReactMarkdown>
          </div>

          {post.codeSnippet && (
            <div className="relative group">
              <div className="absolute top-0 right-0 p-2 text-[10px] font-mono text-[#444] bg-[#0a0a0a] border-l border-b border-[#222] z-10">
                {post.language || 'code'}
              </div>
              <SyntaxHighlighter 
                language={post.language || 'javascript'} 
                style={vscDarkPlus}
                customStyle={{ 
                  margin: 0, 
                  padding: '1.5rem', 
                  backgroundColor: '#0a0a0a', 
                  border: '1px solid #222',
                  fontSize: '0.875rem'
                }}
              >
                {post.codeSnippet}
              </SyntaxHighlighter>
            </div>
          )}
        </div>

        <div className="flex items-center gap-6 pt-4 border-t border-[#222]">
          <button 
            onClick={handleLike}
            disabled={isBlockedByAuthor}
            className={`flex items-center gap-2 text-sm font-mono transition-all ${liked ? 'text-[#00ff00]' : 'text-[#666] hover:text-white'} ${isBlockedByAuthor ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={isBlockedByAuthor ? 'You are blocked by this user' : ''}
          >
            <Heart size={18} fill={liked ? '#00ff00' : 'transparent'} />
            {likesCount}
          </button>
          <button 
            onClick={() => setShowComments(!showComments)}
            disabled={isBlockedByAuthor}
            className={`flex items-center gap-2 text-sm font-mono transition-all ${showComments ? 'text-[#00ff00]' : 'text-[#666] hover:text-white'} ${isBlockedByAuthor ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={isBlockedByAuthor ? 'You are blocked by this user' : ''}
          >
            <MessageSquare size={18} />
            {post.commentsCount || 0}
          </button>
          <button className="flex items-center gap-2 text-sm font-mono text-[#666] hover:text-white transition-all ml-auto">
            <Share2 size={18} />
          </button>
        </div>
      </div>

      {showComments && (
        <div className="bg-[#0d0d0d] border-t border-[#222] p-4 space-y-4">
          <form onSubmit={handleComment} className="flex gap-3">
            <img src={currentUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.uid}`} className="w-8 h-8 border border-[#333]" />
            <div className="flex-1 flex gap-2">
              <input 
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 bg-transparent border border-[#222] px-3 py-1 text-sm focus:border-[#00ff00] focus:ring-0"
              />
              <button 
                disabled={loadingComment || !newComment.trim()}
                className="bg-[#00ff00] text-black px-4 py-1 text-xs font-bold hover:bg-[#00cc00] disabled:opacity-50"
              >
                {loadingComment ? '...' : 'REPLY'}
              </button>
            </div>
          </form>

          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <img src={comment.authorPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.authorUid}`} className="w-8 h-8 border border-[#333]" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{comment.authorName}</span>
                    <span className="text-[10px] font-mono text-[#444]">{formatDate(comment.createdAt?.toDate())}</span>
                  </div>
                  <p className="text-sm text-[#aaa]">{comment.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
