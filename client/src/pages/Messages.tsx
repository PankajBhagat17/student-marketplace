import { useEffect, useState } from 'react';
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

  // 1. Fetch User & Conversations on load
  useEffect(() => {
    const fetchInbox = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      try {
        const userRes = await axios.get('https://student-marketplace-ho49.onrender.com/api/dashboard-data', { headers: { Authorization: `Bearer ${token}` } });
        setUser(userRes.data.userThatRequestedThis);
        
        // We will build this backend route next!
        const inboxRes = await axios.get('https://student-marketplace-ho49.onrender.com/api/messages/inbox', { headers: { Authorization: `Bearer ${token}` } });
        setConversations(inboxRes.data);
      } catch (err) {
        console.error('Failed to load inbox');
      }
    };
    fetchInbox();
  }, [navigate]);

  // 2. Handle Socket connections when a chat is clicked
  useEffect(() => {
    if (!activeChat || !user) return;

    const room = `listing_${activeChat.listing_id}_${activeChat.seller_email}`;
    socket.emit('join_room', room);

    const handleReceiveMessage = (data: any) => {
      setMessageList((list) => [...list, data]);
    };

    socket.on('receive_message', handleReceiveMessage);

    return () => {
      socket.off('receive_message', handleReceiveMessage);
    };
  }, [activeChat, user]);

  const sendMessage = async () => {
    if (currentMessage !== '' && activeChat && user) {
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

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden" style={{ height: 'calc(100vh - 70px)' }}>
      {/* LEFT PANEL: Chat List (The WhatsApp Sidebar) */}
      <div className="w-1/3 bg-white border-r flex flex-col">
        <div className="p-4 bg-gray-50 border-b font-bold text-lg text-gray-800">
          Chats
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <p className="text-gray-500 p-4 text-center">No active chats.</p>
          ) : (
            conversations.map((chat, idx) => (
              <div 
                key={idx} 
                onClick={() => {
                  setActiveChat(chat);
                  setMessageList(chat.past_messages || []);
                }}
                className={`p-4 border-b cursor-pointer transition-colors ${activeChat?.listing_id === chat.listing_id ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
              >
                <div className="font-bold text-gray-800 truncate">{chat.listing_title}</div>
                <div className="text-sm text-gray-500 truncate">Chat with: {chat.other_person_email}</div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* RIGHT PANEL: Active Chat Window */}
      <div className="w-2/3 flex flex-col bg-gray-50">
        {activeChat ? (
          <>
            {/* Chat Header */}
            <div className="p-4 bg-white border-b shadow-sm flex items-center justify-between">
              <div className="font-bold text-gray-800">{activeChat.listing_title}</div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
              {messageList.map((msg, index) => {
                const isMe = msg.sender_email === user?.email;
                return (
                  <div key={index} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`rounded-lg px-4 py-2 max-w-[70%] shadow-sm ${isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white text-gray-800 border rounded-bl-none'}`}>
                      {msg.content}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Chat Input */}
            <div className="p-4 bg-white border-t flex gap-2">
              <input
                type="text"
                value={currentMessage}
                placeholder="Type a message..."
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                className="flex-1 border border-gray-300 rounded-full px-4 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <button 
                onClick={sendMessage}
                className="bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 font-medium transition-colors"
              >
                Send
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 bg-gray-100">
            Select a chat to start messaging
          </div>
        )}
      </div>
    </div>
  );
}