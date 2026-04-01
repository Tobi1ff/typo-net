
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { User } from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp, 
  doc, 
  getDoc,
  updateDoc,
  limit,
  setDoc
} from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from '../firebase';
import { encryptMessage, decryptMessage } from '../lib/crypto';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Lock, Shield, ShieldAlert, MessageSquare, User as UserIcon, ArrowLeft, Search, Eye, EyeOff } from 'lucide-react';
import { formatDate } from '../lib/utils';

interface MessagesProps {
  user: User;
}

interface Conversation {
  id: string;
  participants: string[];
  lastMessage?: string;
  lastMessageAt?: any;
  updatedAt: any;
  otherUser?: any;
}

interface Message {
  id: string;
  senderId: string;
  recipientId: string;
  encryptedText: string;
  iv: string;
  salt: string;
  createdAt: any;
  decryptedText?: string;
  decryptionError?: boolean;
}

export default function Messages({ user }: MessagesProps) {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [passphrase, setPassphrase] = useState(sessionStorage.getItem('chat_passphrase') || '');
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch conversations
  useEffect(() => {
    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', user.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const convs = await Promise.all(snapshot.docs.map(async (d) => {
        const data = d.data() as Conversation;
        const otherUserId = data.participants.find(p => p !== user.uid);
        let otherUser = null;
        if (otherUserId) {
          const userDoc = await getDoc(doc(db, 'users', otherUserId));
          otherUser = userDoc.exists() ? userDoc.data() : null;
        }
        return { ...data, id: d.id, otherUser };
      }));
      setConversations(convs);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'conversations');
    });

    return () => unsubscribe();
  }, [user.uid]);

  // Fetch messages for active conversation
  useEffect(() => {
    if (!conversationId) {
      setActiveConversation(null);
      setMessages([]);
      return;
    }

    const q = query(
      collection(db, 'conversations', conversationId, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const msgs = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Message));
      
      // Decrypt messages if passphrase exists
      if (passphrase) {
        const decryptedMsgs = await Promise.all(msgs.map(async (m) => {
          try {
            const text = await decryptMessage(m.encryptedText, m.iv, m.salt, passphrase);
            return { ...m, decryptedText: text };
          } catch (e) {
            return { ...m, decryptionError: true };
          }
        }));
        setMessages(decryptedMsgs);
      } else {
        setMessages(msgs);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `conversations/${conversationId}/messages`);
    });

    // Set active conversation
    const conv = conversations.find(c => c.id === conversationId);
    if (conv) setActiveConversation(conv);

    return () => unsubscribe();
  }, [conversationId, passphrase, conversations]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !conversationId || !passphrase || !activeConversation) return;

    const otherUserId = activeConversation.participants.find(p => p !== user.uid);
    if (!otherUserId) return;

    try {
      const encrypted = await encryptMessage(newMessage, passphrase);
      
      const messageData = {
        conversationId,
        senderId: user.uid,
        recipientId: otherUserId,
        encryptedText: encrypted.encryptedText,
        iv: encrypted.iv,
        salt: encrypted.salt,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'conversations', conversationId, 'messages'), messageData);
      
      // Update conversation last message
      await updateDoc(doc(db, 'conversations', conversationId), {
        lastMessage: '[Encrypted Message]',
        lastMessageAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      setNewMessage('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `conversations/${conversationId}/messages`);
    }
  };

  const savePassphrase = (e: React.FormEvent) => {
    e.preventDefault();
    sessionStorage.setItem('chat_passphrase', passphrase);
    // Trigger re-decryption by updating state if needed (already handled by useEffect dependency)
  };

  if (loading) {
    return <div className="p-8 text-center font-mono text-[#444]">LOADING_MESSAGES...</div>;
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] md:h-screen overflow-hidden bg-[#0a0a0a]">
      {/* Sidebar */}
      <div className={`w-full md:w-80 border-r border-[#222] flex flex-col ${conversationId ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-6 border-b border-[#222]">
          <h2 className="text-xl font-black italic tracking-tighter transform -skew-x-12 flex items-center gap-2">
            <Shield size={20} className="text-[#00ff00]" />
            SECURE_COMMS
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-8 text-center">
              <MessageSquare size={48} className="mx-auto text-[#222] mb-4" />
              <p className="text-xs font-mono text-[#444] uppercase">No conversations found</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <Link
                key={conv.id}
                to={`/messages/${conv.id}`}
                className={`flex items-center gap-4 p-4 border-b border-[#111] hover:bg-[#111] transition-all ${conversationId === conv.id ? 'bg-[#111] border-r-2 border-[#00ff00]' : ''}`}
              >
                <img 
                  src={conv.otherUser?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${conv.id}`} 
                  className="w-12 h-12 border border-[#222]"
                  alt=""
                />
                <div className="flex-1 min-w-0">
                  <p className="font-bold truncate">{conv.otherUser?.displayName || 'Unknown User'}</p>
                  <p className="text-[10px] font-mono text-[#666] truncate uppercase">
                    {conv.lastMessage || 'START_CONVERSATION'}
                  </p>
                </div>
                {conv.lastMessageAt && (
                  <span className="text-[8px] font-mono text-[#444]">
                    {formatDate(conv.lastMessageAt.toDate())}
                  </span>
                )}
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Chat Window */}
      <div className={`flex-1 flex flex-col ${!conversationId ? 'hidden md:flex' : 'flex'}`}>
        {conversationId ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-[#222] flex items-center justify-between bg-[#0d0d0d]">
              <div className="flex items-center gap-4">
                <button onClick={() => navigate('/messages')} className="md:hidden text-[#666]">
                  <ArrowLeft size={20} />
                </button>
                <img 
                  src={activeConversation?.otherUser?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${activeConversation?.id}`} 
                  className="w-10 h-10 border border-[#222]"
                  alt=""
                />
                <div>
                  <p className="font-bold text-sm">{activeConversation?.otherUser?.displayName}</p>
                  <div className="flex items-center gap-1">
                    <Lock size={10} className="text-[#00ff00]" />
                    <span className="text-[10px] font-mono text-[#00ff00] uppercase tracking-widest">End-to-End Encrypted</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Passphrase Prompt */}
            {!passphrase && (
              <div className="flex-1 flex items-center justify-center p-6 bg-[#0a0a0a]">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="max-w-md w-full p-8 border border-[#222] bg-[#0d0d0d] text-center"
                >
                  <ShieldAlert size={48} className="mx-auto text-yellow-500 mb-4" />
                  <h3 className="text-lg font-bold mb-2 uppercase tracking-tighter">Enter Secret Passphrase</h3>
                  <p className="text-xs font-mono text-[#666] mb-6 uppercase">
                    Messages are encrypted client-side. You need a shared passphrase to read and send messages.
                  </p>
                  <form onSubmit={savePassphrase} className="space-y-4">
                    <div className="relative">
                      <input
                        type={showPassphrase ? "text" : "password"}
                        value={passphrase}
                        onChange={(e) => setPassphrase(e.target.value)}
                        placeholder="SECRET_PASSPHRASE"
                        className="w-full bg-black border border-[#222] px-4 py-3 font-mono text-sm focus:border-[#00ff00] outline-none"
                        required
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassphrase(!showPassphrase)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#444] hover:text-white"
                      >
                        {showPassphrase ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <button className="w-full bg-[#00ff00] text-black font-black py-3 uppercase tracking-tighter hover:bg-[#00cc00] transition-all">
                      Unlock Conversation
                    </button>
                  </form>
                </motion.div>
              </div>
            )}

            {/* Messages Area */}
            {passphrase && (
              <>
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {messages.map((msg) => (
                    <div 
                      key={msg.id}
                      className={`flex ${msg.senderId === user.uid ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[80%] p-3 rounded-sm font-mono text-xs ${
                        msg.senderId === user.uid 
                          ? 'bg-[#00ff00] text-black' 
                          : 'bg-[#111] text-white border border-[#222]'
                      }`}>
                        {msg.decryptionError ? (
                          <div className="flex items-center gap-2 text-red-500 italic">
                            <ShieldAlert size={12} />
                            <span>DECRYPTION_FAILED</span>
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap">{msg.decryptedText || '...'}</p>
                        )}
                        <p className={`text-[8px] mt-1 text-right opacity-50`}>
                          {msg.createdAt ? formatDate(msg.createdAt.toDate()) : '...'}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <form onSubmit={handleSendMessage} className="p-4 border-t border-[#222] bg-[#0d0d0d]">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="TYPE_ENCRYPTED_MESSAGE..."
                      className="flex-1 bg-black border border-[#222] px-4 py-3 font-mono text-xs focus:border-[#00ff00] outline-none"
                    />
                    <button 
                      type="submit"
                      disabled={!newMessage.trim()}
                      className="bg-[#00ff00] text-black p-3 hover:bg-[#00cc00] transition-all disabled:opacity-50"
                    >
                      <Send size={20} />
                    </button>
                  </div>
                </form>
              </>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="p-6 border border-[#222] bg-[#0d0d0d] max-w-sm">
              <Shield size={64} className="mx-auto text-[#222] mb-6" />
              <h2 className="text-xl font-black italic tracking-tighter transform -skew-x-12 mb-2">SECURE_CHANNEL</h2>
              <p className="text-xs font-mono text-[#666] uppercase mb-6">
                Select a conversation to start messaging. All communications are end-to-end encrypted using AES-256-GCM.
              </p>
              <Link 
                to="/search" 
                className="inline-flex items-center gap-2 bg-[#111] border border-[#222] px-6 py-3 font-mono text-xs uppercase tracking-widest hover:bg-[#222] hover:text-[#00ff00] transition-all"
              >
                <Search size={14} />
                Find Developers
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
