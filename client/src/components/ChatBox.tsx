import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

// 🔌 Connect to your live Render backend
// Make sure this is your EXACT Render URL!
const socket = io('https://student-marketplace-ho49.onrender.com'); 

const ChatBox = ({ listingId, currentUserEmail, sellerEmail }) => {
  const [currentMessage, setCurrentMessage] = useState('');
  const [messageList, setMessageList] = useState([]);

  // Create a unique "room" name based on the listing and the two users
  const room = `listing_${listingId}_${sellerEmail}`;

  useEffect(() => {
    // 1. Tell the backend we want to join this specific chat room
    socket.emit('join_room', room);

    // 2. Listen for incoming messages from the backend
    socket.on('receive_message', (data) => {
      setMessageList((list) => [...list, data]);
    });

    // Cleanup listener when component unmounts
    return () => socket.off('receive_message');
  }, [room]);

  const sendMessage = async () => {
    if (currentMessage !== '') {
      const messageData = {
        room: room,
        listing_id: listingId,
        sender_email: currentUserEmail,
        receiver_email: sellerEmail,
        content: currentMessage,
      };

      // 1. Send the message to the backend
      await socket.emit('send_message', messageData);
      
      // 2. Add it to our own screen immediately
      setMessageList((list) => [...list, messageData]);
      setCurrentMessage('');
    }
  };

  return (
    <div className="chat-window border rounded-lg shadow-md p-4 max-w-md bg-white">
      <div className="chat-header border-b pb-2 mb-4 font-bold text-lg">
        Chat with Seller
      </div>
      
      <div className="chat-body h-64 overflow-y-auto mb-4 flex flex-col gap-2">
        {messageList.map((msg, index) => {
          const isMe = msg.sender_email === currentUserEmail;
          return (
            <div key={index} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`rounded px-3 py-2 text-sm max-w-[80%] ${
                isMe ? 'bg-blue-500 text-white' : 'bg-gray-200 text-black'
              }`}>
                {msg.content}
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="chat-footer flex gap-2">
        <input
          type="text"
          value={currentMessage}
          placeholder="Type a message..."
          onChange={(event) => setCurrentMessage(event.target.value)}
          onKeyPress={(event) => event.key === 'Enter' && sendMessage()}
          className="flex-1 border rounded px-3 py-2 outline-none focus:border-blue-500"
        />
        <button 
          onClick={sendMessage}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-medium"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatBox;