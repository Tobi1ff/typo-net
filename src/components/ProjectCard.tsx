import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { doc, updateDoc, increment, setDoc, deleteDoc, onSnapshot, serverTimestamp, addDoc, collection } from 'firebase/firestore';
import { db, auth, OperationType, handleFirestoreError } from '../firebase';
import { ExternalLink, Github, Heart, Layout, Lock, Star, GitFork, Users, Code, Terminal, Download, X, AlertTriangle } from 'lucide-react';
import { fetchGitHubRepo, GitHubRepoData } from '../services/githubService';
import { motion } from 'motion/react';
import ReportModal from './ReportModal';

interface ProjectCardProps {
  project: any;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(project.likesCount || 0);
  const [githubData, setGithubData] = useState<GitHubRepoData | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followRole, setFollowRole] = useState<'follower' | 'contributor' | null>(null);
  const [isBlockedByAuthor, setIsBlockedByAuthor] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (project.repoUrl && project.repoUrl.includes('github.com')) {
      fetchGitHubRepo(project.repoUrl).then(setGithubData);
    }
  }, [project.repoUrl]);

  useEffect(() => {
    if (!currentUser || !db) return;
    const likeRef = doc(db, 'projects', project.id, 'likes', currentUser.uid);
    const unsubscribe = onSnapshot(likeRef, (doc) => {
      setLiked(doc.exists());
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `projects/${project.id}/likes/${currentUser.uid}`);
    });
    return () => unsubscribe();
  }, [project.id, currentUser]);

  useEffect(() => {
    if (currentUser && currentUser.uid !== project.authorUid && db) {
      const blockId = `${project.authorUid}_${currentUser.uid}`;
      const unsub = onSnapshot(doc(db, 'blocks', blockId), (doc) => {
        setIsBlockedByAuthor(doc.exists());
      });
      return () => unsub();
    }
  }, [project.authorUid, currentUser]);

  useEffect(() => {
    if (!currentUser || !db) return;
    const followId = `${currentUser.uid}_${project.id}`;
    const followRef = doc(db, 'projectFollows', followId);
    const unsubscribe = onSnapshot(followRef, (doc) => {
      if (doc.exists()) {
        setIsFollowing(true);
        setFollowRole(doc.data().role);
      } else {
        setIsFollowing(false);
        setFollowRole(null);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `projectFollows/${followId}`);
    });
    return () => unsubscribe();
  }, [project.id, currentUser]);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentUser || isBlockedByAuthor || !db) return;

    const likeRef = doc(db, 'projects', project.id, 'likes', currentUser.uid);
    const projectRef = doc(db, 'projects', project.id);

    try {
      if (liked) {
        await deleteDoc(likeRef);
        await updateDoc(projectRef, { likesCount: increment(-1) });
        setLikesCount(prev => prev - 1);
      } else {
        await setDoc(likeRef, {
          userUid: currentUser.uid,
          projectUid: project.id,
          createdAt: serverTimestamp(),
        });
        await updateDoc(projectRef, { likesCount: increment(1) });
        setLikesCount(prev => prev + 1);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `projects/${project.id}`);
    }
  };

  const handleFollowProject = async (role: 'follower' | 'contributor') => {
    if (!currentUser || isBlockedByAuthor || !db) return;
    const followId = `${currentUser.uid}_${project.id}`;
    const followRef = doc(db, 'projectFollows', followId);

    try {
      if (isFollowing && followRole === role) {
        await deleteDoc(followRef);
      } else {
        await setDoc(followRef, {
          projectUid: project.id,
          userUid: currentUser.uid,
          userName: currentUser.displayName,
          userPhoto: currentUser.photoURL,
          role,
          createdAt: serverTimestamp(),
        });

        // Create notification for project owner
        if (project.authorUid !== currentUser.uid) {
          await addDoc(collection(db, 'notifications'), {
            recipientUid: project.authorUid,
            senderUid: currentUser.uid,
            senderName: currentUser.displayName,
            type: role === 'contributor' ? 'contribute_interest' : 'project_follow',
            projectUid: project.id,
            projectTitle: project.title,
            read: false,
            createdAt: serverTimestamp(),
          });
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `projectFollows/${followId}`);
    }
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!project.repoUrl) {
      setDownloadError('NO_REPO_URL');
      setTimeout(() => setDownloadError(null), 3000);
      return;
    }

    setDownloading(true);
    setDownloadError(null);

    try {
      let zipUrl = project.repoUrl;
      
      if (project.repoUrl.includes('github.com')) {
        const match = project.repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
        if (match) {
          const owner = match[1];
          const repo = match[2].replace(/\.git$/, '').replace(/\/$/, '');
          
          // Check if repo exists via GitHub API
          const apiRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
          if (!apiRes.ok) {
            throw new Error('REPO_NOT_FOUND');
          }
          
          const repoData = await apiRes.json();
          const defaultBranch = repoData.default_branch || 'main';
          zipUrl = `https://github.com/${owner}/${repo}/archive/refs/heads/${defaultBranch}.zip`;
        }
      } else {
        // For non-github URLs, try a HEAD request to check existence
        const headRes = await fetch(zipUrl, { method: 'HEAD' }).catch(() => null);
        if (headRes && !headRes.ok) {
          throw new Error('FILE_NOT_FOUND');
        }
      }

      // Trigger download
      const link = document.createElement('a');
      link.href = zipUrl;
      link.setAttribute('download', `${project.title.replace(/\s+/g, '_')}.zip`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Download error:', err);
      setDownloadError('SOURCE_UNAVAILABLE');
      setTimeout(() => setDownloadError(null), 3000);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#111] border border-[#222] group hover:border-[#00ff00] transition-all overflow-hidden flex flex-col"
    >
      {project.thumbnail ? (
        <img 
          src={project.thumbnail} 
          alt={project.title} 
          className="w-full h-48 object-cover grayscale group-hover:grayscale-0 transition-all" 
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="w-full h-48 bg-[#0a0a0a] flex items-center justify-center border-b border-[#222]">
          <Layout size={48} className="text-[#222] group-hover:text-[#00ff00] transition-all" />
        </div>
      )}

      {downloadError && (
        <div className="absolute top-0 left-0 w-full bg-red-600 text-white text-[10px] font-mono py-2 px-4 z-20 flex items-center justify-between animate-in slide-in-from-top duration-300">
          <span className="flex items-center gap-2">
            <X size={12} />
            {downloadError === 'NO_REPO_URL' ? 'ERROR: NO_REPOSITORY_LINK_FOUND' : 
             downloadError === 'REPO_NOT_FOUND' ? 'ERROR: GITHUB_REPOSITORY_NOT_FOUND' :
             'ERROR: PROJECT_SOURCE_UNAVAILABLE'}
          </span>
          <button onClick={() => setDownloadError(null)} className="opacity-50 hover:opacity-100">
            [CLOSE]
          </button>
        </div>
      )}
      
      <div className="p-6 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2 truncate">
            <h3 className="text-xl font-bold text-white group-hover:text-[#00ff00] transition-all truncate">
              {project.title}
            </h3>
            {project.visibility === 'private' && <Lock size={14} className="text-yellow-500 shrink-0" />}
          </div>
          <div className="flex items-center gap-3">
            {currentUser && currentUser.uid !== project.authorUid && (
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowReportModal(true);
                }}
                className="text-[#444] hover:text-yellow-500 transition-all"
                title="Report this project"
              >
                <AlertTriangle size={14} />
              </button>
            )}
            <button 
              onClick={handleLike}
              disabled={isBlockedByAuthor}
              className={`flex items-center gap-1 text-[10px] font-mono transition-all ${liked ? 'text-[#00ff00]' : 'text-[#666] hover:text-white'} ${isBlockedByAuthor ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={isBlockedByAuthor ? 'You are blocked by this user' : ''}
            >
              <Heart size={12} fill={liked ? '#00ff00' : 'transparent'} />
              {likesCount}
            </button>
          </div>
        </div>

        {currentUser && (
          <ReportModal 
            isOpen={showReportModal}
            onClose={() => setShowReportModal(false)}
            targetId={project.id}
            targetType="project"
            currentUser={currentUser}
          />
        )}

        
        <p className="text-sm text-[#888] line-clamp-3 mb-4 flex-1">
          {project.description}
        </p>

        {githubData && (
          <div className="flex items-center gap-4 mb-4 p-2 bg-[#0a0a0a] border border-[#222] rounded-sm">
            <div className="flex items-center gap-1 text-[10px] font-mono text-[#666]">
              <Star size={12} className="text-yellow-500" />
              <span>{githubData.stars}</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-mono text-[#666]">
              <GitFork size={12} className="text-blue-500" />
              <span>{githubData.forks}</span>
            </div>
            {githubData.language && (
              <div className="flex items-center gap-1 text-[10px] font-mono text-[#666]">
                <Code size={12} className="text-[#00ff00]" />
                <span>{githubData.language}</span>
              </div>
            )}
          </div>
        )}
        
        <div className="flex flex-wrap gap-2 mb-6">
          {project.techStack?.slice(0, 3).map((tech: string) => (
            <span key={tech} className="px-2 py-0.5 bg-[#0a0a0a] border border-[#222] text-[8px] font-mono text-[#00ff00] uppercase">
              {tech}
            </span>
          ))}
        </div>

        <div className="flex gap-2 mb-6">
          <button 
            onClick={() => handleFollowProject('follower')}
            disabled={isBlockedByAuthor}
            className={`flex-1 py-2 text-[10px] font-mono border transition-all flex items-center justify-center gap-2 ${isFollowing && followRole === 'follower' ? 'bg-[#00ff00] text-black border-[#00ff00]' : 'bg-transparent text-[#666] border-[#222] hover:border-[#00ff00] hover:text-white'} ${isBlockedByAuthor ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={isBlockedByAuthor ? 'You are blocked by this user' : ''}
          >
            <Users size={12} />
            {isFollowing && followRole === 'follower' ? 'FOLLOWING' : 'FOLLOW'}
          </button>
          <button 
            onClick={() => handleFollowProject('contributor')}
            disabled={isBlockedByAuthor}
            className={`flex-1 py-2 text-[10px] font-mono border transition-all flex items-center justify-center gap-2 ${isFollowing && followRole === 'contributor' ? 'bg-[#00ff00] text-black border-[#00ff00]' : 'bg-transparent text-[#666] border-[#222] hover:border-[#00ff00] hover:text-white'} ${isBlockedByAuthor ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={isBlockedByAuthor ? 'You are blocked by this user' : ''}
          >
            <Terminal size={12} />
            {isFollowing && followRole === 'contributor' ? 'CONTRIBUTING' : 'CONTRIBUTE'}
          </button>
        </div>
        
        <div className="flex items-center justify-between pt-4 border-t border-[#222] mt-auto">
          <Link to={`/profile/${project.authorUid}`} className="text-[10px] font-mono text-[#444] hover:text-white truncate max-w-[100px]">
            BY_{project.authorName.toUpperCase()}
          </Link>
          <div className="flex gap-3">
            {project.repoUrl && (
              <button 
                onClick={handleDownload}
                disabled={downloading}
                className={`text-[#666] hover:text-[#00ff00] transition-all ${downloading ? 'animate-pulse' : ''}`}
                title="Download source as ZIP"
              >
                <Download size={18} className={downloading ? 'animate-bounce' : ''} />
              </button>
            )}
            {project.repoUrl && (
              <a href={project.repoUrl} target="_blank" rel="noreferrer" className="text-[#666] hover:text-white transition-all">
                <Github size={18} />
              </a>
            )}
            {project.demoUrl && (
              <a href={project.demoUrl} target="_blank" rel="noreferrer" className="text-[#666] hover:text-[#00ff00] transition-all">
                <ExternalLink size={18} />
              </a>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
