import { NavLink } from 'react-router-dom';
import { User } from 'firebase/auth';
import { Home, Search, Bell, User as UserIcon, LogOut, Terminal, Layout, MessageSquare, Shield } from 'lucide-react';
import { auth, isAdmin } from '../firebase';
import { motion } from 'motion/react';

interface NavbarProps {
  user: User;
}

export default function Navbar({ user }: NavbarProps) {
  const navItems = [
    { to: '/', icon: Home, label: 'Feed' },
    { to: '/projects', icon: Layout, label: 'Projects' },
    { to: '/search', icon: Search, label: 'Search' },
    { to: '/notifications', icon: Bell, label: 'Alerts' },
    { to: '/messages', icon: MessageSquare, label: 'Messages' },
    { to: `/profile/${user.uid}`, icon: UserIcon, label: 'Profile' },
  ];

  if (isAdmin()) {
    navItems.push({ to: '/admin', icon: Shield, label: 'Admin' });
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <nav className="hidden md:flex fixed left-0 top-0 h-screen w-64 bg-[#0a0a0a] border-r border-[#222] flex-col p-6 z-50">
        <div className="flex items-center gap-3 mb-12">
          <div className="p-2 border border-[#00ff00]">
            <Terminal size={24} className="text-[#00ff00]" />
          </div>
          <span className="text-2xl font-black tracking-tighter italic transform -skew-x-12">TYPO</span>
        </div>

        <div className="flex-1 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `
                flex items-center gap-4 px-4 py-3 font-mono text-sm uppercase tracking-wider transition-all
                ${isActive ? 'bg-[#111] text-[#00ff00] border-r-2 border-[#00ff00]' : 'text-[#666] hover:text-white hover:bg-[#111]'}
              `}
            >
              <item.icon size={20} />
              {item.label}
            </NavLink>
          ))}
        </div>

        <div className="mt-auto pt-6 border-t border-[#222]">
          <div className="flex items-center gap-3 mb-6 px-4">
            <img 
              src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} 
              alt={user.displayName || 'User'} 
              className="w-10 h-10 border border-[#333]" 
            />
            <div className="overflow-hidden">
              <p className="text-sm font-bold truncate">{user.displayName}</p>
              <p className="text-[10px] font-mono text-[#666] truncate">@{user.uid.slice(0, 8)}</p>
            </div>
          </div>
          <button
            onClick={() => auth.signOut()}
            className="w-full flex items-center gap-4 px-4 py-3 font-mono text-sm uppercase tracking-wider text-red-500 hover:bg-red-900/10 transition-all"
          >
            <LogOut size={20} />
            Disconnect
          </button>
        </div>
      </nav>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-[#0a0a0a] border-t border-[#222] flex justify-around p-4 z-50">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `
              p-2 transition-all
              ${isActive ? 'text-[#00ff00]' : 'text-[#666]'}
            `}
          >
            <item.icon size={24} />
          </NavLink>
        ))}
        <button
          onClick={() => auth.signOut()}
          className="p-2 text-red-500"
        >
          <LogOut size={24} />
        </button>
      </nav>

      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 w-full bg-[#0a0a0a] border-bottom border-[#222] p-4 flex items-center justify-between z-50">
        <div className="flex items-center gap-2">
          <Terminal size={20} className="text-[#00ff00]" />
          <span className="font-black italic tracking-tighter">TYPO</span>
        </div>
        <img 
          src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} 
          alt={user.displayName || 'User'} 
          className="w-8 h-8 border border-[#333]" 
        />
      </div>
    </>
  );
}
