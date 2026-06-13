// client/src/pages/Dashboard.tsx
import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // <-- NEW: Imported Link
import axios from 'axios';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState('');
  const [listings, setListings] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  
  const [viewMode, setViewMode] = useState<'All' | 'Mine'>('All');

  const [newTitle, setNewTitle] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newPostCategory, setNewPostCategory] = useState('Textbooks');
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      const token = localStorage.getItem('token');
      if (!token) { navigate('/login'); return; }
      try {
        const userRes = await axios.get('https://student-marketplace-ho49.onrender.com/api/dashboard-data', { headers: { Authorization: `Bearer ${token}` } });
        setUser(userRes.data.userThatRequestedThis);
        const listingsRes = await axios.get('https://student-marketplace-ho49.onrender.com/api/listings', { headers: { Authorization: `Bearer ${token}` } });
        setListings(listingsRes.data);
      } catch (err) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    };
    fetchDashboardData();
  }, [navigate]);

  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      const formData = new FormData();
      formData.append('title', newTitle);
      formData.append('price', newPrice);
      formData.append('category', newPostCategory);
      if (imageFile) formData.append('image', imageFile); 

      const response = await axios.post('https://student-marketplace-ho49.onrender.com/api/listings', formData, { headers: { Authorization: `Bearer ${token}` } });
      setListings([response.data, ...listings]);
      setNewTitle(''); setNewPrice(''); setNewPostCategory('Textbooks'); setImageFile(null); 
      const fileInput = document.getElementById('image-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (err) {
      alert("Failed to create listing.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this listing?")) return;
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`https://student-marketplace-ho49.onrender.com/api/listings/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setListings(listings.filter(item => item.id !== id));
    } catch (err) {
      alert("Failed to delete listing.");
    }
  };

  const handleMarkSold = async (id: number) => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.put(`https://student-marketplace-ho49.onrender.com/api/listings/${id}/status`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setListings(listings.map(item => item.id === id ? response.data : item));
    } catch (err) {
      alert("Failed to update status.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleWhatsAppContact = (sellerPhone: string, itemTitle: string) => {
    const message = encodeURIComponent(`Hi! I saw your listing for "${itemTitle}" on the PCCOE Student Marketplace. Is it still available?`);
    window.open(`https://wa.me/${sellerPhone}?text=${message}`, '_blank');
  };

  const handleEmailContact = (sellerEmail: string, itemTitle: string) => {
    const subject = encodeURIComponent(`Interested in buying: ${itemTitle}`);
    const body = encodeURIComponent(`Hi!\n\nI saw your listing for "${itemTitle}" on the Student Marketplace and I am interested in buying it. Let me know when and where we can meet up!`);
    window.location.href = `mailto:${sellerEmail}?subject=${subject}&body=${body}`;
  };

  const filteredListings = listings.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'All' || item.category === filterCategory;
    const matchesViewMode = viewMode === 'All' || (user && item.seller_email === user.email);
    return matchesSearch && matchesCategory && matchesViewMode;
  });

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="dashboard-wrapper">
      <div className="dashboard-header">
        <h2>Student Marketplace | PCCOE</h2>
        <div className="user-info" style={{ display: 'flex', alignItems: 'center' }}>
          {user && <span style={{ marginRight: '15px' }}>Logged in: <strong>{user.college_domain}</strong></span>}
          
          {/* --- NEW: Link to Profile Page --- */}
          <Link to="/profile" style={{ color: 'white', textDecoration: 'none', marginRight: '15px', fontWeight: 'bold', background: '#2b2b36', padding: '8px 12px', borderRadius: '4px' }}>
            👤 My Profile
          </Link>
          {/* --------------------------------- */}

          <button onClick={handleLogout} className="btn-danger">Log Out</button>
        </div>
      </div>

      <div className="dashboard-body">
        
        <div className="create-listing-panel">
          <h3>Post an Item</h3>
          <form onSubmit={handleCreateListing}>
            <input type="text" className="form-input" placeholder="Item Title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} required />
            <input type="number" className="form-input" placeholder="Price (₹)" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} required />
            <select className="form-input" value={newPostCategory} onChange={(e) => setNewPostCategory(e.target.value)}>
              <option value="Textbooks">Textbooks</option>
              <option value="Electronics">Electronics</option>
              <option value="Dorm Essentials">Dorm Essentials</option>
            </select>
            <input type="file" id="image-upload" accept="image/*" className="form-input" onChange={(e) => setImageFile(e.target.files ? e.target.files[0] : null)} style={{ padding: '8px', cursor: 'pointer' }} />
            {imageFile && (
              <div style={{ marginTop: '10px', textAlign: 'center', marginBottom: '15px' }}>
                <img src={URL.createObjectURL(imageFile)} alt="Preview" style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '8px', border: '2px dashed var(--primary)' }} />
              </div>
            )}
            <button type="submit" className="btn-primary">Create Listing</button>
          </form>
        </div>

        <div className="listings-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={() => setViewMode('All')} 
                style={{ padding: '8px 15px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontWeight: 'bold', background: viewMode === 'All' ? '#b185ff' : '#2b2b36', color: 'white' }}
              >
                All Items
              </button>
              <button 
                onClick={() => setViewMode('Mine')} 
                style={{ padding: '8px 15px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontWeight: 'bold', background: viewMode === 'Mine' ? '#b185ff' : '#2b2b36', color: 'white' }}
              >
                My Items
              </button>
            </div>
            
            <div style={{ display: 'flex', gap: '10px', width: '50%' }}>
              <input type="text" className="form-input" placeholder="Search items..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ margin: 0, flex: 1 }} />
              <select className="form-input" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} style={{ margin: 0, width: '150px' }}>
                <option value="All">All Categories</option>
                <option value="Textbooks">Textbooks</option>
                <option value="Electronics">Electronics</option>
                <option value="Dorm Essentials">Dorm Essentials</option>
              </select>
            </div>
          </div>

          <div className="listings-grid">
            {filteredListings.length === 0 ? (
              <p style={{ color: 'var(--text)' }}>No items found.</p>
            ) : (
              filteredListings.map((item, index) => (
                <motion.div 
                  key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="item-card"
                  style={{ opacity: item.status === 'sold' ? 0.6 : 1 }}
                >
                  
                  {item.status === 'sold' && (
                    <div style={{ position: 'absolute', top: '10px', right: '10px', background: '#ff6b6b', color: 'white', padding: '5px 10px', borderRadius: '4px', fontWeight: 'bold', zIndex: 10 }}>
                      SOLD
                    </div>
                  )}

                  {item.imageUrl ? (
                    <img src={`https://student-marketplace-ho49.onrender.com${item.imageUrl}`} alt={item.title} style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '8px', marginBottom: '15px' }} />
                  ) : (
                    <div className="item-image-empty">No Image</div>
                  )}

                  <h4 style={{ margin: '10px 0', color: 'var(--text-h)', textDecoration: item.status === 'sold' ? 'line-through' : 'none' }}>{item.title}</h4>
                  <p className="item-price">₹{item.price}</p>
                  <span className="item-badge">{item.category}</span>
                  
                  <p style={{ fontSize: '0.75rem', color: 'var(--text)', marginTop: '10px' }}>Seller: {item.seller_email}</p>

                  {user && user.email === item.seller_email && (
                    <div style={{ display: 'flex', gap: '8px', marginTop: '15px' }}>
                      {item.status !== 'sold' && (
                        <button onClick={() => handleMarkSold(item.id)} style={{ flex: 1, padding: '8px', background: '#51cf66', color: '#1e1e24', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}>
                          Mark Sold
                        </button>
                      )}
                      <button onClick={() => handleDelete(item.id)} className="btn-danger" style={{ flex: 1, padding: '8px', fontSize: '0.8rem' }}>
                        Delete
                      </button>
                    </div>
                  )}

                  {user && user.email !== item.seller_email && item.status !== 'sold' && (
                    <div style={{ marginTop: '15px', borderTop: '1px solid #333', paddingTop: '10px' }}>
                      <p style={{ fontSize: '0.8rem', color: '#a0a0b0', marginBottom: '10px', textAlign: 'center' }}>
                        📞 <strong>{item.seller_phone || '919876543210'}</strong>
                      </p>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => handleWhatsAppContact(item.seller_phone || '919876543210', item.title)} style={{ flex: 1, padding: '8px', background: '#25D366', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}>
                          💬 WhatsApp
                        </button>
                        <button onClick={() => handleEmailContact(item.seller_email, item.title)} style={{ flex: 1, padding: '8px', background: '#b185ff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}>
                          ✉️ Email
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}