/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Search from './pages/Search';
import Notifications from './pages/Notifications';
import Projects from './pages/Projects';
import Messages from './pages/Messages';
import Auth from './pages/Auth';
import Admin from './pages/Admin';
import Navbar from './components/Navbar';
import DevTools from './components/DevTools';
import ProfileCompletionBanner from './components/ProfileCompletionBanner';
import { useDevice } from './lib/useDevice';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { isMobile } = useDevice();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Sync user to Firestore
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
          await setDoc(userRef, {
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName || 'Anonymous Developer',
            photoURL: firebaseUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${firebaseUser.uid}`,
            bio: 'New developer on Typo',
            techStack: [],
            createdAt: serverTimestamp(),
          });
        }
        setUser(firebaseUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-[#00ff00] font-mono text-xl"
        >
          TYPO_INIT...
        </motion.div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-[#0a0a0a] text-[#e0e0e0] font-sans selection:bg-[#00ff00] selection:text-black">
        {user && <ProfileCompletionBanner user={user} />}
        {user && <Navbar user={user} />}
        <main className={user ? `pt-16 pb-20 md:pb-0 md:pl-64 ${isMobile ? 'px-4' : ''}` : ""}>
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/auth" element={!user ? <Auth /> : <Navigate to="/" />} />
              <Route path="/" element={user ? <Home user={user} /> : <Navigate to="/auth" />} />
              <Route path="/profile/:uid" element={user ? <Profile currentUser={user} /> : <Navigate to="/auth" />} />
              <Route path="/search" element={user ? <Search /> : <Navigate to="/auth" />} />
              <Route path="/projects" element={user ? <Projects user={user} /> : <Navigate to="/auth" />} />
              <Route path="/notifications" element={user ? <Notifications user={user} /> : <Navigate to="/auth" />} />
              <Route path="/messages" element={user ? <Messages user={user} /> : <Navigate to="/auth" />} />
              <Route path="/messages/:conversationId" element={user ? <Messages user={user} /> : <Navigate to="/auth" />} />
              <Route path="/admin" element={user ? <Admin /> : <Navigate to="/auth" />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </AnimatePresence>
        </main>
        <DevTools user={user} />
      </div>
    </Router>
  );
}

