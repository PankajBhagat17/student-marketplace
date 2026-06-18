import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import axios from 'axios';

// Connect to your live backend
const socket = io('https://student-marketplace-ho49.onrender.com');

export default function Messages() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<any | null>(null);
  const [currentMessage, setCurrentMessage] = useState('');
  const [messageList, setMessageList] = useState<any[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the bottom of the chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messageList]);

  // Fetch User & Conversations
  useEffect(() => {
    const fetchInbox = async () => {
      const token = localStorage.getItem('token');
      if (!token) { navigate('/login'); return; }
      try {
        const userRes = await axios.get('https://student-marketplace-ho49.onrender.com/api/dashboard-data', { headers: { Authorization: `Bearer ${token}` } });
        setUser(userRes.data.userThatRequestedThis);
        
        const inboxRes = await axios.get('https://student-marketplace-ho49.onrender.com/api/messages/inbox', { headers: { Authorization: `Bearer ${token}` } });
        setConversations(inboxRes.data);
      } catch (err) {
        console.error('Failed to load inbox');
      }
    };
    fetchInbox();
  }, [navigate]);

  // Handle Socket connections
  useEffect(() => {
    if (!activeChat || !user) return;

    const room = `listing_${activeChat.listing_id}_${activeChat.seller_email}`;
    socket.emit('join_room', room);

    const handleReceiveMessage = (data: any) => {
      setMessageList((list) => [...list, data]);
    };

    socket.on('receive_message', handleReceiveMessage);
    return () => { socket.off('receive_message', handleReceiveMessage); };
  }, [activeChat, user]);

  const sendMessage = async () => {
    if (currentMessage.trim() !== '' && activeChat && user) {
      const room = `listing_${activeChat.listing_id}_${activeChat.seller_email}`;
      const messageData = {
        room: room,
        listing_id: activeChat.listing_id,
        sender_email: user.email,
        receiver_email: activeChat.other_person_email, 
        content: currentMessage,
      };

      await socket.emit('send_message', messageData);
      setCurrentMessage('');
    }
  };

  // Helper to get initials for avatars
  const getInitials = (email: string) => {
    return email ? email.charAt(0).toUpperCase() : '?';
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#111b21', color: '#e9edef', fontFamily: 'Segoe UI, Helvetica Neue, Helvetica, Arial, sans-serif' }}>
      
      {/* LEFT PANEL: Chat List */}
      <div style={{ width: '30%', minWidth: '300px', borderRight: '1px solid #222d34', display: 'flex', flexDirection: 'column', backgroundColor: '#111b21' }}>
        
        {/* Sidebar Header */}
        <div style={{ height: '60px', backgroundColor: '#202c33', display: 'flex', alignItems: 'center', padding: '0 15px', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
              {user ? getInitials(user.email) : ''}
            </div>
            <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>Chats</span>
          </div>
          <button onClick={() => navigate('/dashboard')} style={{ background: 'transparent', border: 'none', color: '#00a884', cursor: 'pointer', fontWeight: 'bold' }}>
            Close ✕
          </button>
        </div>

        {/* Search Bar (Visual Only) */}
        <div style={{ padding: '10px', backgroundColor: '#111b21', borderBottom: '1px solid #222d34' }}>
          <div style={{ backgroundColor: '#202c33', borderRadius: '8px', padding: '8px 15px', display: 'flex', alignItems: 'center' }}>
            <span style={{ color: '#8696a0', marginRight: '10px' }}>🔍</span>
            <input type="text" placeholder="Search or start new chat" style={{ background: 'transparent', border: 'none', color: '#e9edef', width: '100%', outline: 'none' }} disabled />
          </div>
        </div>

        {/* Chat List Items */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {conversations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#8696a0' }}>No active chats yet.</div>
          ) : (
            conversations.map((chat, idx) => {
              const lastMsg = chat.past_messages[chat.past_messages.length - 1];
              const isActive = activeChat?.listing_id === chat.listing_id && activeChat?.other_person_email === chat.other_person_email;
              
              return (
                <div 
                  key={idx} 
                  onClick={() => {
                    setActiveChat(chat);
                    setMessageList(chat.past_messages || []);
                  }}
                  style={{ 
                    display: 'flex', alignItems: 'center', padding: '12px 15px', cursor: 'pointer', 
                    backgroundColor: isActive ? '#2a3942' : 'transparent',
                    borderBottom: '1px solid #222d34'
                  }}
                >
                  {/* Avatar */}
                  <div style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundColor: '#005c4b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 'bold', marginRight: '15px', flexShrink: 0 }}>
                    {getInitials(chat.other_person_email)}
                  </div>
                  
                  {/* Text Data */}
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                      <span style={{ fontWeight: '500', fontSize: '1.05rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {chat.other_person_email.split('@')[0]}
                      </span>
                    </div>
                    <div style={{ color: '#8696a0', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span style={{ fontSize: '0.75rem', color: '#febd69', border: '1px solid #febd69', padding: '1px 4px', borderRadius: '4px' }}>{chat.listing_title}</span>
                      {lastMsg?.content || 'Started a chat'}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT PANEL: Chat Window */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#0b141a', backgroundImage: 'radial-gradient(#111b21 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
        
        {activeChat ? (
          <>
            {/* Chat Header */}
            <div style={{ height: '60px', backgroundColor: '#202c33', display: 'flex', alignItems: 'center', padding: '0 20px', borderLeft: '1px solid #222d34' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#005c4b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', marginRight: '15px' }}>
                {getInitials(activeChat.other_person_email)}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: '500', fontSize: '1.1rem' }}>{activeChat.other_person_email.split('@')[0]}</span>
                <span style={{ color: '#8696a0', fontSize: '0.85rem' }}>Regarding: {activeChat.listing_title}</span>
              </div>
            </div>

            {/* Chat Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {messageList.map((msg, index) => {
                const isMe = msg.sender_email === user?.email;
                return (
                  <div key={index} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                    <div style={{ 
                      maxWidth: '65%', 
                      padding: '8px 12px', 
                      borderRadius: '8px', 
                      backgroundColor: isMe ? '#005c4b' : '#202c33', 
                      color: '#e9edef',
                      borderTopRightRadius: isMe ? '0' : '8px',
                      borderTopLeftRadius: isMe ? '8px' : '0',
                      boxShadow: '0 1px 0.5px rgba(11,20,26,.13)',
                      fontSize: '0.95rem',
                      lineHeight: '1.4'
                    }}>
                      {msg.content}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <div style={{ height: '65px', backgroundColor: '#202c33', padding: '10px 20px', display: 'flex', gap: '15px', alignItems: 'center' }}>
              <input
                type="text"
                value={currentMessage}
                placeholder="Type a message"
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                style={{ 
                  flex: 1, backgroundColor: '#2a3942', border: 'none', borderRadius: '8px', 
                  padding: '12px 15px', color: '#e9edef', outline: 'none', fontSize: '1rem' 
                }}
              />
              <button 
                onClick={sendMessage}
                style={{ 
                  backgroundColor: '#00a884', color: '#111b21', border: 'none', borderRadius: '50%', 
                  width: '45px', height: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', fontSize: '1.2rem', transition: 'transform 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                ➤
              </button>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#8696a0' }}>
            <div style={{ fontSize: '4rem', marginBottom: '20px' }}>💬</div>
            <h2 style={{ fontWeight: '300', margin: '0 0 10px 0' }}>Student Marketplace Messages</h2>
            <p style={{ margin: 0 }}>Select a chat from the sidebar to start messaging.</p>
          </div>
        )}
      </div>
    </div>
  );
}