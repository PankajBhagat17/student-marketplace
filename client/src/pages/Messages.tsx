// client/src/pages/Messages.tsx
import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { io } from 'socket.io-client';
import axios from 'axios';
import { motion } from 'framer-motion';

const socket = io('https://student-marketplace-ho49.onrender.com');

export default function Messages() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [user, setUser] = useState<any>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<any | null>(null);
  const [currentMessage, setCurrentMessage] = useState('');
  const [messageList, setMessageList] = useState<any[]>([]);
  
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messageList]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  }, []);

  const fetchInbox = useCallback(async (currentUserEmail: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const inboxRes = await axios.get(`https://student-marketplace-ho49.onrender.com/api/messages/inbox?t=${new Date().getTime()}`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      setConversations(inboxRes.data);
    } catch (err) {
      console.error('Failed to load inbox');
    }
  }, []);

  useEffect(() => {
    const initializePage = async () => {
      const token = localStorage.getItem('token');
      if (!token) { navigate('/login'); return; }
      try {
        const userRes = await axios.get('https://student-marketplace-ho49.onrender.com/api/dashboard-data', { headers: { Authorization: `Bearer ${token}` } });
        const loggedInUser = userRes.data.userThatRequestedThis;
        setUser(loggedInUser);
        
        socket.emit('setup_user', loggedInUser.email);
        await fetchInbox(loggedInUser.email);

        if (location.state && location.state.newChat) {
          const item = location.state.newChat;
          const inboxRes = await axios.get(`https://student-marketplace-ho49.onrender.com/api/messages/inbox?t=${new Date().getTime()}`, { headers: { Authorization: `Bearer ${token}` } });
          const existingChat = inboxRes.data.find((c: any) => c.listing_id === item.id && c.other_person_email === item.seller_email);
          
          if (existingChat) {
            setActiveChat(existingChat);
            setMessageList(existingChat.past_messages || []);
          } else {
            setActiveChat({
              listing_id: item.id,
              listing_title: item.title,
              seller_email: item.seller_email,
              other_person_email: item.seller_email,
              past_messages: []
            });
            setMessageList([]);
          }
          window.history.replaceState({}, document.title);
        }
      } catch (err) {
        console.error('Failed to initialize user data');
      }
    };
    initializePage();
  }, [navigate, location.state, fetchInbox]);

  useEffect(() => {
    if (!user) return;
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchInbox(user.email);
        socket.emit('setup_user', user.email);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const handleSocketReconnect = () => {
      fetchInbox(user.email);
      socket.emit('setup_user', user.email);
    };
    socket.on('connect', handleSocketReconnect);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      socket.off('connect', handleSocketReconnect);
    };
  }, [user, fetchInbox]);

  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchInbox(user.email);
      }
    }, 10000); 
    return () => clearInterval(interval);
  }, [user, fetchInbox]);

  useEffect(() => {
    if (!user) return;
    const handleGlobalNotification = (newMsg: any) => {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(`New message from ${newMsg.sender_email.split('@')[0]}`, {
          body: newMsg.content,
          icon: '/favicon.ico'
        });
      }
      fetchInbox(user.email);
    };
    socket.on('global_notification', handleGlobalNotification);
    return () => { socket.off('global_notification', handleGlobalNotification); };
  }, [user, fetchInbox]);

  useEffect(() => {
    if (!activeChat || !user) return;

    const room = `listing_${activeChat.listing_id}_${activeChat.seller_email}`;
    socket.emit('join_room', room);
    socket.emit('mark_read', { room, user_email: user.email });

    const handleReceiveMessage = (data: any) => {
      setMessageList((list) => [...list, data]);
      if (data.sender_email !== user.email) {
        socket.emit('mark_read', { room, user_email: user.email });
      }
    };

    const handleMessagesRead = (data: any) => {
      if (data.user_email !== user.email) {
        setMessageList((list) => list.map(msg => ({ ...msg, is_read: true })));
      }
    };

    const handleMessageEdited = (editedMsg: any) => {
      setMessageList((list) => list.map(msg => msg.id === editedMsg.id ? editedMsg : msg));
      fetchInbox(user.email); 
    };

    const handleMessageDeleted = (data: any) => {
      setMessageList((list) => list.filter(msg => msg.id !== data.message_id));
      fetchInbox(user.email); 
    };

    socket.on('receive_message', handleReceiveMessage);
    socket.on('messages_read', handleMessagesRead);
    socket.on('message_edited', handleMessageEdited);
    socket.on('message_deleted', handleMessageDeleted);

    return () => { 
      socket.off('receive_message', handleReceiveMessage); 
      socket.off('messages_read', handleMessagesRead);
      socket.off('message_edited', handleMessageEdited);
      socket.off('message_deleted', handleMessageDeleted);
    };
  }, [activeChat, user, fetchInbox]);

  const sendMessage = async () => {
    if (currentMessage.trim() === '' || !activeChat || !user) return;
    const room = `listing_${activeChat.listing_id}_${activeChat.seller_email}`;

    if (editingMessageId) {
      socket.emit('edit_message', {
        room,
        message_id: editingMessageId,
        sender_email: user.email,
        new_content: currentMessage
      });
      setEditingMessageId(null);
    } else {
      socket.emit('send_message', {
        room,
        listing_id: activeChat.listing_id,
        sender_email: user.email,
        receiver_email: activeChat.other_person_email, 
        content: currentMessage,
      });
    }
    setCurrentMessage('');
    setTimeout(() => fetchInbox(user.email), 100); 
  };

  const deleteMessage = (id: number) => {
    if (!window.confirm("Delete message for everyone?")) return;
    const room = `listing_${activeChat.listing_id}_${activeChat.seller_email}`;
    socket.emit('delete_message', { room, message_id: id, sender_email: user.email });
  };

  const startEditing = (msg: any) => {
    setEditingMessageId(msg.id);
    setCurrentMessage(msg.content);
  };

  const getInitials = (email: string) => {
    return email ? email.charAt(0).toUpperCase() : '?';
  };

  const showSidebar = !isMobile || !activeChat;
  const showChatWindow = !isMobile || activeChat;

  return (
    <div style={{ position: 'relative', display: 'flex', height: '100vh', width: '100vw', color: 'hsl(var(--foreground))', fontFamily: 'var(--font-body)', overflow: 'hidden' }}>
      
      {/* PERFECTLY FIXED LOCAL VIDEO BACKGROUND */}
      <video
        src="/campus-bg.mp4.mp4"
        autoPlay loop muted playsInline
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }}
      />
      {/* Dark Overlay */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(5, 15, 25, 0.4)', zIndex: 1 }} />

      {/* --- SIDEBAR --- */}
      {showSidebar && (
        <div style={{ position: 'relative', zIndex: 10, width: isMobile ? '100%' : '30%', minWidth: isMobile ? '100%' : '320px', borderRight: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', background: 'rgba(0, 0, 0, 0.2)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
          
          <div style={{ height: '70px', background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', padding: '0 20px', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                {user ? getInitials(user.email) : ''}
              </div>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', letterSpacing: '-0.5px' }}>Inbox</span>
            </div>
            <button onClick={() => navigate('/dashboard')} className="liquid-glass" style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}>
              Close ✕
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {conversations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'hsl(var(--muted-foreground))' }}>No active chats yet.</div>
            ) : (
              conversations.map((chat, idx) => {
                const lastMsg = chat.past_messages[chat.past_messages.length - 1];
                const isActive = activeChat?.listing_id === chat.listing_id && activeChat?.other_person_email === chat.other_person_email;
                
                return (
                  <div key={idx} onClick={() => { setActiveChat(chat); setMessageList(chat.past_messages || []); setEditingMessageId(null); setCurrentMessage(''); }} style={{ display: 'flex', alignItems: 'center', padding: '15px 20px', cursor: 'pointer', background: isActive && !isMobile ? 'rgba(255,255,255,0.1)' : 'transparent', borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }}>
                    <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 'bold', marginRight: '15px', flexShrink: 0 }}>
                      {getInitials(chat.other_person_email)}
                    </div>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontWeight: '500', fontSize: '1.05rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{chat.other_person_email.split('@')[0]}</span>
                      </div>
                      <div style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.7rem', color: '#febd69', border: '1px solid rgba(254,189,105,0.5)', background: 'rgba(254,189,105,0.1)', padding: '2px 6px', borderRadius: '4px' }}>{chat.listing_title}</span>
                        {lastMsg?.content || 'Started a chat'}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* --- CHAT WINDOW --- */}
      {showChatWindow && (
        <div style={{ position: 'relative', zIndex: 10, flex: 1, width: isMobile ? '100%' : '70%', display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.1)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
          
          {activeChat ? (
            <>
              {/* Chat Header */}
              <div style={{ height: '70px', background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', padding: '0 20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                {isMobile && (
                  <button onClick={() => { setActiveChat(null); setEditingMessageId(null); setCurrentMessage(''); }} style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '1.5rem', marginRight: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>←</button>
                )}
                <div style={{ width: '45px', height: '45px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', marginRight: '15px' }}>
                  {getInitials(activeChat.other_person_email)}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontWeight: '500', fontSize: '1.1rem' }}>{activeChat.other_person_email.split('@')[0]}</span>
                  <span style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.85rem' }}>Regarding: {activeChat.listing_title}</span>
                </div>
              </div>

              {/* Message List */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '25px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {messageList.map((msg, index) => {
                  const isMe = msg.sender_email === user?.email;
                  const timeString = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                  return (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} key={index} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                      
                      {isMe && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '10px', opacity: 0.6 }}>
                          {!msg.is_read && (
                            <button onClick={() => startEditing(msg)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem' }} title="Edit Message">✏️</button>
                          )}
                          <button onClick={() => deleteMessage(msg.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem' }} title="Delete Message">🗑️</button>
                        </div>
                      )}
                      
                      {/* Glass Message Bubble */}
                      <div style={{ 
                        maxWidth: '75%', 
                        padding: '10px 15px', 
                        borderRadius: '16px', 
                        background: isMe ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.4)', 
                        backdropFilter: 'blur(10px)',
                        WebkitBackdropFilter: 'blur(10px)',
                        border: isMe ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.05)',
                        color: 'white', 
                        borderTopRightRadius: isMe ? '4px' : '16px', 
                        borderTopLeftRadius: isMe ? '16px' : '4px', 
                        boxShadow: '0 4px 15px rgba(0,0,0,0.1)', 
                        fontSize: '1rem', 
                        lineHeight: '1.5', 
                        wordBreak: 'break-word', 
                        display: 'flex', 
                        flexDirection: 'column' 
                      }}>
                        <span style={{ paddingBottom: '6px' }}>{msg.content}</span>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                          {msg.is_edited && <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', fontStyle: 'italic', marginRight: '4px' }}>Edited</span>}
                          <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)' }}>{timeString}</span>
                          {isMe && (
                            <span style={{ fontSize: '0.75rem', color: msg.is_read ? '#60a5fa' : 'rgba(255,255,255,0.5)' }}>
                              {msg.is_read ? '✓✓' : '✓'}
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Box */}
              <div style={{ minHeight: '80px', background: 'rgba(0,0,0,0.3)', padding: '15px 20px', display: 'flex', gap: '15px', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                {editingMessageId && (
                  <button onClick={() => { setEditingMessageId(null); setCurrentMessage(''); }} className="liquid-glass" style={{ color: '#ef4444', padding: '10px 15px', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.3)', cursor: 'pointer', fontWeight: 'bold' }}>✕ Cancel</button>
                )}
                <input
                  type="text"
                  value={currentMessage}
                  placeholder="Type your message..."
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: '15px 20px', color: 'white', outline: 'none', fontSize: '1rem', transition: 'border-color 0.2s' }}
                  onFocus={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
                />
                <button onClick={sendMessage} className="liquid-glass" style={{ width: '50px', height: '50px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '1.2rem', flexShrink: 0, transition: 'transform 0.2s' }} onMouseEnter={(e)=>e.currentTarget.style.transform='scale(1.05)'} onMouseLeave={(e)=>e.currentTarget.style.transform='scale(1)'}>
                  {editingMessageId ? '💾' : '➤'}
                </button>
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: 'hsl(var(--muted-foreground))', padding: '20px', textAlign: 'center' }}>
              <div style={{ fontSize: '4rem', marginBottom: '20px', opacity: 0.5 }}>💬</div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 'normal', margin: '0 0 10px 0', color: 'hsl(var(--foreground))' }}>Silence the noise.</h2>
              <p style={{ margin: 0, fontSize: '1.1rem' }}>Select a chat from the sidebar to begin.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}