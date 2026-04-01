import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Search as SearchIcon, User as UserIcon, Terminal, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

export default function Search() {
  const [searchTerm, setSearchTerm] = useState('');
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, 'users'), limit(500));
        const snapshot = await getDocs(q);
        const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAllUsers(users);
        setResults(users);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setResults(allUsers);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = allUsers.filter(user => {
      const nameMatch = user.displayName?.toLowerCase().includes(term);
      const techMatch = user.techStack?.some((tech: string) => 
        tech.toLowerCase().includes(term)
      );
      return nameMatch || techMatch;
    });
    setResults(filtered);
  }, [searchTerm, allUsers]);

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = text.split(new RegExp(`(${escapedQuery})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === query.toLowerCase() ? (
            <span key={i} className="text-[#00ff00] bg-[#00ff00]/10 px-0.5">{part}</span>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8">
      <div className="mb-12">
        <h1 className="text-3xl font-black tracking-tighter italic transform -skew-x-12 text-white mb-2">QUERY_USERS</h1>
        <p className="text-[10px] font-mono text-[#00ff00] uppercase tracking-widest">// Search by name, skills, or tech stack</p>
      </div>

      <div className="relative mb-12">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#444]">
          <SearchIcon size={20} />
        </div>
        <input 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search developers..."
          className="w-full bg-[#111] border border-[#222] pl-12 pr-4 py-4 text-white focus:border-[#00ff00] focus:ring-0 font-mono"
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-mono text-[#444]">
          {results.length} RESULTS
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-[#111] border border-[#222] animate-pulse" />
            ))}
          </div>
        ) : results.length > 0 ? (
          results.map((user) => (
            <motion.div 
              key={user.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Link 
                to={`/profile/${user.uid}`}
                className="flex items-center gap-4 p-4 bg-[#111] border border-[#222] hover:border-[#00ff00] transition-all group"
              >
                <img src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} className="w-12 h-12 border border-[#333] object-cover" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-white group-hover:text-[#00ff00] transition-all truncate">
                    {highlightText(user.displayName, searchTerm)}
                  </h3>
                  <p className="text-[10px] font-mono text-[#666] uppercase">@{user.uid.slice(0, 8)}</p>
                </div>
                <div className="flex flex-wrap gap-1 max-w-[240px] justify-end">
                  {user.techStack?.map((tech: string) => {
                    const isMatch = searchTerm && tech.toLowerCase().includes(searchTerm.toLowerCase());
                    return (
                      <span 
                        key={tech} 
                        className={`px-1.5 py-0.5 border text-[8px] font-mono uppercase transition-all ${
                          isMatch 
                            ? 'bg-[#00ff00] text-black border-[#00ff00] shadow-[0_0_10px_rgba(0,255,0,0.3)]' 
                            : 'bg-[#0a0a0a] border-[#222] text-[#666]'
                        }`}
                      >
                        {tech}
                      </span>
                    );
                  })}
                </div>
                <ArrowRight size={16} className="text-[#222] group-hover:text-[#00ff00] transition-all ml-2 flex-shrink-0" />
              </Link>
            </motion.div>
          ))
        ) : searchTerm ? (
          <div className="text-center py-20 border border-dashed border-[#222]">
            <Terminal size={48} className="mx-auto text-[#222] mb-4" />
            <p className="text-[#444] font-mono uppercase tracking-widest text-sm">No users found matching your query.</p>
          </div>
        ) : (
          <div className="text-center py-20">
            <UserIcon size={48} className="mx-auto text-[#111] mb-4" />
            <p className="text-[#444] font-mono uppercase tracking-widest text-sm italic">Awaiting input parameters...</p>
          </div>
        )}
      </div>
    </div>
  );
}
