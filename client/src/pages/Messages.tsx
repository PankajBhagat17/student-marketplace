import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; // --- NEW: Added useLocation
import { io } from 'socket.io-client';
import axios from 'axios';

// Connect to your live backend
const socket = io('https://student-marketplace-ho49.onrender.com');

export default function Messages() {
  const navigate = useNavigate();
  const location = useLocation(); // --- NEW: To catch data from Dashboard
  
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
    const fetchInbox = async () => {
      const token = localStorage.getItem('token');
      if (!token) { navigate('/login'); return; }
      try {
        const userRes = await axios.get('https://student-marketplace-ho49.onrender.com/api/dashboard-data', { headers: { Authorization: `Bearer ${token}` } });
        setUser(userRes.data.userThatRequestedThis);
        
        const inboxRes = await axios.get('https://student-marketplace-ho49.onrender.com/api/messages/inbox', { headers: { Authorization: `Bearer ${token}` } });
        setConversations(inboxRes.data);

        // --- NEW: Magic Logic to open a blank chat if coming from Dashboard ---
        if (location.state && location.state.newChat) {
          const item = location.state.newChat;
          
          // Check if you already have history with this item
          const existingChat = inboxRes.data.find((c: any) => c.listing_id === item.id && c.other_person_email === item.seller_email);
          
          if (existingChat) {
            setActiveChat(existingChat);
            setMessageList(existingChat.past_messages || []);
          } else {
            // No history? Create a brand new blank chat window!
            setActiveChat({
              listing_id: item.id,
              listing_title: item.title,
              seller_email: item.seller_email,
              other_person_email: item.seller_email,
              past_messages: []
            });
            setMessageList([]);
          }
          // Clear the "newChat" memory so it doesn't accidentally reopen if you refresh the page
          window.history.replaceState({}, document.title);
        }

      } catch (err) {
        console.error('Failed to load inbox');
      }
    };
    fetchInbox();
  }, [navigate, location.state]);

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
    };

    const handleMessageDeleted = (data: any) => {
      setMessageList((list) => list.filter(msg => msg.id !== data.message_id));
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
  }, [activeChat, user]);

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
    <div style={{ display: 'flex', height: '100vh', width: '100vw', backgroundColor: '#111b21', color: '#e9edef', fontFamily: 'Segoe UI, Helvetica Neue, Helvetica, Arial, sans-serif', overflow: 'hidden' }}>
      
      {/* LEFT PANEL: Chat List */}
      {showSidebar && (
        <div style={{ width: isMobile ? '100%' : '30%', minWidth: isMobile ? '100%' : '300px', borderRight: '1px solid #222d34', display: 'flex', flexDirection: 'column', backgroundColor: '#111b21' }}>
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

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {conversations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#8696a0' }}>No active chats yet.</div>
            ) : (
              conversations.map((chat, idx) => {
                const lastMsg = chat.past_messages[chat.past_messages.length - 1];
                const isActive = activeChat?.listing_id === chat.listing_id && activeChat?.other_person_email === chat.other_person_email;
                return (
                  <div key={idx} onClick={() => { setActiveChat(chat); setMessageList(chat.past_messages || []); setEditingMessageId(null); setCurrentMessage(''); }} style={{ display: 'flex', alignItems: 'center', padding: '12px 15px', cursor: 'pointer', backgroundColor: isActive && !isMobile ? '#2a3942' : 'transparent', borderBottom: '1px solid #222d34' }}>
                    <div style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundColor: '#005c4b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 'bold', marginRight: '15px', flexShrink: 0 }}>
                      {getInitials(chat.other_person_email)}
                    </div>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                        <span style={{ fontWeight: '500', fontSize: '1.05rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{chat.other_person_email.split('@')[0]}</span>
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
      )}

      {/* RIGHT PANEL: Chat Window */}
      {showChatWindow && (
        <div style={{ flex: 1, width: isMobile ? '100%' : '70%', display: 'flex', flexDirection: 'column', backgroundColor: '#0b141a', backgroundImage: 'radial-gradient(#111b21 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
          
          {activeChat ? (
            <>
              <div style={{ height: '60px', backgroundColor: '#202c33', display: 'flex', alignItems: 'center', padding: '0 20px', borderLeft: '1px solid #222d34' }}>
                {isMobile && (
                  <button onClick={() => { setActiveChat(null); setEditingMessageId(null); setCurrentMessage(''); }} style={{ background: 'transparent', border: 'none', color: '#00a884', fontSize: '1.5rem', marginRight: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>←</button>
                )}
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#005c4b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', marginRight: '15px' }}>
                  {getInitials(activeChat.other_person_email)}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontWeight: '500', fontSize: '1.1rem' }}>{activeChat.other_person_email.split('@')[0]}</span>
                  <span style={{ color: '#8696a0', fontSize: '0.85rem' }}>Regarding: {activeChat.listing_title}</span>
                </div>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {messageList.map((msg, index) => {
                  const isMe = msg.sender_email === user?.email;
                  const timeString = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                  return (
                    <div key={index} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', group: 'hover' }}>
                      {isMe && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '10px', opacity: 0.8 }}>
                          {!msg.is_read && (
                            <button onClick={() => startEditing(msg)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem' }} title="Edit Message">✏️</button>
                          )}
                          <button onClick={() => deleteMessage(msg.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem' }} title="Delete Message">🗑️</button>
                        </div>
                      )}
                      <div style={{ maxWidth: '75%', padding: '6px 8px 6px 12px', borderRadius: '8px', backgroundColor: isMe ? '#005c4b' : '#202c33', color: '#e9edef', borderTopRightRadius: isMe ? '0' : '8px', borderTopLeftRadius: isMe ? '8px' : '0', boxShadow: '0 1px 0.5px rgba(11,20,26,.13)', fontSize: '0.95rem', lineHeight: '1.4', wordBreak: 'break-word', display: 'flex', flexDirection: 'column' }}>
                        <span style={{ paddingBottom: '4px' }}>{msg.content}</span>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '4px', marginTop: '-4px' }}>
                          {msg.is_edited && <span style={{ fontSize: '0.65rem', color: '#8696a0', fontStyle: 'italic', marginRight: '4px' }}>Edited</span>}
                          <span style={{ fontSize: '0.65rem', color: isMe ? '#87aca3' : '#8696a0' }}>{timeString}</span>
                          {isMe && (
                            <span style={{ fontSize: '0.7rem', color: msg.is_read ? '#53bdeb' : '#8696a0' }}>
                              {msg.is_read ? '✓✓' : '✓'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <div style={{ minHeight: '65px', backgroundColor: '#202c33', padding: '10px 15px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                {editingMessageId && (
                  <button onClick={() => { setEditingMessageId(null); setCurrentMessage(''); }} style={{ color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>✕ Cancel Edit</button>
                )}
                <input
                  type="text"
                  value={currentMessage}
                  placeholder="Type a message"
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  style={{ flex: 1, backgroundColor: '#2a3942', border: 'none', borderRadius: '24px', padding: '12px 15px', color: '#e9edef', outline: 'none', fontSize: '1rem' }}
                />
                <button onClick={sendMessage} style={{ backgroundColor: '#00a884', color: '#111b21', border: 'none', borderRadius: '50%', width: '45px', height: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '1.2rem', flexShrink: 0 }}>
                  {editingMessageId ? '💾' : '➤'}
                </button>
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#8696a0', padding: '20px', textAlign: 'center' }}>
              <div style={{ fontSize: '4rem', marginBottom: '20px' }}>💬</div>
              <h2 style={{ fontWeight: '300', margin: '0 0 10px 0' }}>Student Marketplace Messages</h2>
              <p style={{ margin: 0 }}>Select a chat from the sidebar to start messaging.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}