// client/src/pages/Profile.tsx
import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import ChatBox from '../components/ChatBox'; // --- NEW: Imported your ChatBox!

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [myListings, setMyListings] = useState<any[]>([]);
  const [error, setError] = useState('');

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editPrice, setEditPrice] = useState<string>('');
  
  // --- NEW: Track which chat room the seller has open
  const [activeChat, setActiveChat] = useState<number | null>(null);

  useEffect(() => {
    const fetchProfileData = async () => {
      const token = localStorage.getItem('token');
      if (!token) { navigate('/login'); return; }
      
      try {
        const userRes = await axios.get('https://student-marketplace-ho49.onrender.com/api/dashboard-data', { headers: { Authorization: `Bearer ${token}` } });
        setUser(userRes.data.userThatRequestedThis);
        
        const listingsRes = await axios.get('https://student-marketplace-ho49.onrender.com/api/profile/listings', { headers: { Authorization: `Bearer ${token}` } });
        setMyListings(listingsRes.data);
      } catch (err) {
        setError('Failed to load profile data.');
      }
    };
    fetchProfileData();
  }, [navigate]);

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this listing?")) return;
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`https://student-marketplace-ho49.onrender.com/api/listings/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setMyListings(myListings.filter(item => item.id !== id));
    } catch (err) {
      alert("Failed to delete listing.");
    }
  };

  const handleMarkSold = async (id: number) => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.put(`https://student-marketplace-ho49.onrender.com/api/listings/${id}/status`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setMyListings(myListings.map(item => item.id === id ? response.data : item));
    } catch (err) {
      alert("Failed to update status.");
    }
  };

  const handleStartEdit = (id: number, currentPrice: number) => {
    setEditingId(id);
    setEditPrice(currentPrice.toString());
  };

  const handleSavePrice = async (id: number) => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.put(
        `https://student-marketplace-ho49.onrender.com/api/listings/${id}/price`, 
        { newPrice: editPrice }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMyListings(myListings.map(item => item.id === id ? response.data : item));
      setEditingId(null); 
    } catch (err) {
      alert("Failed to update price.");
    }
  };

  const totalItems = myListings.length;
  const soldItems = myListings.filter(item => item.status === 'sold').length;
  const activeItems = totalItems - soldItems;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="dashboard-wrapper">
      <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>My Profile Dashboard</h2>
        <Link to="/dashboard" style={{ color: 'white', textDecoration: 'none', background: '#b185ff', padding: '8px 16px', borderRadius: '4px', fontWeight: 'bold' }}>
          ← Back to Marketplace
        </Link>
      </div>

      {error && <div className="alert-error">{error}</div>}

      <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
        <div style={{ flex: 1, background: '#1e1e24', padding: '20px', borderRadius: '8px', color: 'white' }}>
          <h3 style={{ borderBottom: '1px solid #333', paddingBottom: '10px' }}>Account Details</h3>
          <p><strong>Name:</strong> {user?.first_name} {user?.last_name}</p>
          <p><strong>Email:</strong> {user?.email}</p>
          <p><strong>College Domain:</strong> {user?.college_domain}</p>
        </div>

        <div style={{ flex: 1, background: '#1e1e24', padding: '20px', borderRadius: '8px', color: 'white', display: 'flex', justifyContent: 'space-around', alignItems: 'center', textAlign: 'center' }}>
          <div>
            <h1 style={{ color: '#b185ff', margin: '0' }}>{totalItems}</h1>
            <p style={{ margin: '5px 0 0 0', color: '#a0a0b0' }}>Total Posts</p>
          </div>
          <div>
            <h1 style={{ color: '#51cf66', margin: '0' }}>{activeItems}</h1>
            <p style={{ margin: '5px 0 0 0', color: '#a0a0b0' }}>Active Items</p>
          </div>
          <div>
            <h1 style={{ color: '#ff6b6b', margin: '0' }}>{soldItems}</h1>
            <p style={{ margin: '5px 0 0 0', color: '#a0a0b0' }}>Items Sold</p>
          </div>
        </div>
      </div>

      <h3 style={{ marginTop: '30px', color: 'white' }}>Manage My Listings</h3>
      
      <div className="listings-grid" style={{ marginTop: '15px' }}>
        {myListings.length === 0 ? (
          <p style={{ color: 'var(--text)' }}>You haven't posted any items yet.</p>
        ) : (
          myListings.map((item, index) => (
            <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} className="item-card" style={{ opacity: item.status === 'sold' ? 0.6 : 1 }}>
              {item.status === 'sold' && (
                <div style={{ position: 'absolute', top: '10px', right: '10px', background: '#ff6b6b', color: 'white', padding: '5px 10px', borderRadius: '4px', fontWeight: 'bold', zIndex: 10 }}>SOLD</div>
              )}
              {item.imageUrl ? (
                <img src={item.imageUrl.startsWith('http') ? item.imageUrl : `https://student-marketplace-ho49.onrender.com${item.imageUrl}`} alt={item.title} style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '8px', marginBottom: '15px' }} />
              ) : (
                <div className="item-image-empty">No Image</div>
              )}
              
              <h4 style={{ margin: '10px 0', color: 'var(--text-h)' }}>{item.title}</h4>
              
              {editingId === item.id ? (
                <div style={{ display: 'flex', gap: '5px', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ color: 'white' }}>₹</span>
                  <input 
                    type="number" 
                    value={editPrice} 
                    onChange={(e) => setEditPrice(e.target.value)}
                    style={{ padding: '5px', borderRadius: '4px', border: '1px solid #b185ff', background: '#2b2b36', color: 'white', width: '80px' }}
                  />
                  <button onClick={() => handleSavePrice(item.id)} style={{ padding: '5px 10px', background: '#51cf66', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Save</button>
                  <button onClick={() => setEditingId(null)} style={{ padding: '5px 10px', background: '#3b1f1f', color: '#ff6b6b', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>X</button>
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p className="item-price" style={{ margin: '0' }}>₹{item.price}</p>
                  {item.status !== 'sold' && (
                    <button onClick={() => handleStartEdit(item.id, item.price)} style={{ padding: '4px 8px', background: 'transparent', color: '#b185ff', border: '1px solid #b185ff', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}>
                      ✎ Edit Price
                    </button>
                  )}
                </div>
              )}

              {/* --- NEW: The Live Chat Room Toggle for the Seller --- */}
              {item.status !== 'sold' && (
                <div style={{ marginTop: '15px', paddingTop: '10px', borderTop: '1px solid #333' }}>
                  <button 
                    onClick={() => setActiveChat(activeChat === item.id ? null : item.id)} 
                    style={{ width: '100%', padding: '10px', background: activeChat === item.id ? '#444' : '#febd69', color: activeChat === item.id ? '#fff' : '#111', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    {activeChat === item.id ? 'Close Chat Room ✕' : '💬 Open Live Chat Room'}
                  </button>
                  
                  {activeChat === item.id && user && (
                    <div style={{ marginTop: '15px' }}>
                      <ChatBox 
                        listingId={item.id} 
                        currentUserEmail={user.email} 
                        sellerEmail={user.email} 
                      />
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px', marginTop: '15px' }}>
                {item.status !== 'sold' && (
                  <button onClick={() => handleMarkSold(item.id)} style={{ flex: 1, padding: '8px', background: '#51cf66', color: '#1e1e24', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Mark Sold</button>
                )}
                <button onClick={() => handleDelete(item.id)} className="btn-danger" style={{ flex: 1, padding: '8px' }}>Delete</button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
}