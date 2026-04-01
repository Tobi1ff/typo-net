import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { collection, query, orderBy, onSnapshot, limit, where } from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from '../firebase';
import ProjectCard from '../components/ProjectCard';
import CreateProject from '../components/CreateProject';
import { Layout, Plus, Terminal, Search } from 'lucide-react';
import { motion } from 'motion/react';

interface ProjectsProps {
  user: User;
}

export default function Projects({ user }: ProjectsProps) {
  const [projects, setProjects] = useState<any[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }
    const q = query(
      collection(db, 'projects'), 
      where('visibility', '==', 'public'),
      orderBy('createdAt', 'desc'), 
      limit(50)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const projectsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProjects(projectsData);
      setFilteredProjects(projectsData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'projects');
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredProjects(projects);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = projects.filter(project => {
      const titleMatch = project.title?.toLowerCase().includes(term);
      const descMatch = project.description?.toLowerCase().includes(term);
      const techMatch = project.techStack?.some((tech: string) => 
        tech.toLowerCase().includes(term)
      );
      return titleMatch || descMatch || techMatch;
    });
    setFilteredProjects(filtered);
  }, [searchTerm, projects]);

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      {showCreateProject && <CreateProject user={user} onClose={() => setShowCreateProject(false)} />}
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black tracking-tighter italic transform -skew-x-12 text-white mb-2">PROJECT_SHOWCASE</h1>
          <p className="text-[10px] font-mono text-[#00ff00] uppercase tracking-widest">// Explore developer builds & experiments</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden md:block">
            <p className="text-[10px] font-mono text-[#444] uppercase">Total Builds</p>
            <p className="text-xl font-black text-white">{filteredProjects.length}</p>
          </div>
          <div className="h-10 w-[1px] bg-[#222] hidden md:block" />
          <button 
            onClick={() => setShowCreateProject(true)}
            className="bg-[#00ff00] text-black font-bold px-6 py-3 hover:bg-[#00cc00] transition-all flex items-center gap-2 text-sm uppercase tracking-tighter"
          >
            <Plus size={18} />
            Submit_Project
          </button>
        </div>
      </div>

      <div className="relative mb-12">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#444]">
          <Search size={20} />
        </div>
        <input 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search projects by title, description, or tech stack..."
          className="w-full bg-[#111] border border-[#222] pl-12 pr-4 py-4 text-white focus:border-[#00ff00] focus:ring-0 font-mono text-sm"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
          [1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-[400px] bg-[#111] border border-[#222] animate-pulse" />
          ))
        ) : filteredProjects.length > 0 ? (
          filteredProjects.map(project => (
            <ProjectCard key={project.id} project={project} />
          ))
        ) : (
          <div className="col-span-full py-32 text-center border border-dashed border-[#222]">
            <Layout size={64} className="mx-auto text-[#222] mb-6" />
            <h3 className="text-xl font-bold text-[#444] mb-2 uppercase tracking-widest">No Projects Found</h3>
            <p className="text-[#333] font-mono text-sm">Be the first to push your build to the showcase.</p>
          </div>
        )}
      </div>
    </div>
  );
}
