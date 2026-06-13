// client/src/pages/Dashboard.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const navigate = useNavigate();
  
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState('');
  const [listings, setListings] = useState<any[]>([]);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');

  // Form State
  const [newTitle, setNewTitle] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newPostCategory, setNewPostCategory] = useState('Textbooks');
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      try {
        const userResponse = await axios.get('http://localhost:5001/api/dashboard-data', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(userResponse.data.userThatRequestedThis);

        const listingsResponse = await axios.get('http://localhost:5001/api/listings', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setListings(listingsResponse.data);
      } catch (err) {
        setError('Your session expired or was denied. Please log in again.');
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
      if (imageFile) {
        formData.append('image', imageFile); 
      }

      const response = await axios.post('http://localhost:5001/api/listings', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setListings([response.data, ...listings]);
      setNewTitle('');
      setNewPrice('');
      setNewPostCategory('Textbooks');
      setImageFile(null); 
      
      const fileInput = document.getElementById('image-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

    } catch (err) {
      console.error("Failed to create listing", err);
      alert("Failed to create listing. Make sure the server is running.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this listing?")) return;
    
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`http://localhost:5001/api/listings/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setListings(listings.filter(item => item.id !== id));
    } catch (err) {
      console.error("Failed to delete", err);
      alert("Failed to delete listing. You might not have permission.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  // The Magic Filter Logic
  const filteredListings = listings.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'All' || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="dashboard-wrapper"
    >
      <div className="dashboard-header">
        <h2>Student Marketplace | PCCOE</h2>
        <div className="user-info">
          {user && <span>Logged in: <strong>{user.college_domain}</strong></span>}
          <button onClick={handleLogout} className="btn-danger">
            Log Out
          </button>
        </div>
      </div>

      {error && <div className="alert-error" style={{ marginTop: '20px' }}>{error}</div>}

      <div className="dashboard-body">
        
        {/* Create Listing Form */}
        <div className="create-listing-panel">
          <h3>Post an Item</h3>
          <form onSubmit={handleCreateListing}>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Item Title" 
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              required 
            />
            <input 
              type="number" 
              className="form-input" 
              placeholder="Price (₹)" 
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              required 
            />
            <select 
              className="form-input"
              value={newPostCategory}
              onChange={(e) => setNewPostCategory(e.target.value)}
            >
              <option value="Textbooks">Textbooks</option>
              <option value="Electronics">Electronics</option>
              <option value="Dorm Essentials">Dorm Essentials</option>
            </select>
            
            <input 
              type="file" 
              id="image-upload"
              accept="image/*" 
              className="form-input" 
              onChange={(e) => setImageFile(e.target.files ? e.target.files[0] : null)}
              style={{ padding: '8px', cursor: 'pointer' }}
            />

            {/* --- NEW: Live Image Preview --- */}
            {imageFile && (
              <div style={{ marginTop: '10px', textAlign: 'center', marginBottom: '15px' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text)', marginBottom: '5px' }}>Image Preview:</p>
                <img 
                  src={URL.createObjectURL(imageFile)} 
                  alt="Preview" 
                  style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '8px', border: '2px dashed var(--primary)' }}
                />
              </div>
            )}
            {/* ------------------------------- */}

            <button type="submit" className="btn-primary">
              Create Listing
            </button>
          </form>
        </div>

        {/* Marketplace Grid Area */}
        <div className="listings-panel">
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 style={{ margin: 0 }}>Recent Listings</h3>
            
            {/* Search & Filter Bar UI */}
            <div style={{ display: 'flex', gap: '10px', width: '60%' }}>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Search items..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ margin: 0, flex: 1 }}
              />
              <select 
                className="form-input"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                style={{ margin: 0, width: '160px' }}
              >
                <option value="All">All Categories</option>
                <option value="Textbooks">Textbooks</option>
                <option value="Electronics">Electronics</option>
                <option value="Dorm Essentials">Dorm Essentials</option>
              </select>
            </div>
          </div>

          <div className="listings-grid">
            
            {filteredListings.length === 0 ? (
              <p style={{ color: 'var(--text)' }}>No items found matching your search.</p>
            ) : (
              // --- NEW: Added 'index' to the map function for staggered animations ---
              filteredListings.map((item, index) => (
                <motion.div 
                  key={item.id} 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    duration: 0.4, 
                    delay: index * 0.1, // Stagger effect based on item position
                    type: "spring", 
                    stiffness: 300 
                  }}
                  whileHover={{ y: -5, scale: 1.02, boxShadow: "0px 10px 20px rgba(0,0,0,0.2)" }}
                  className="item-card"
                >
                  {item.imageUrl ? (
                    <img 
                      src={`http://localhost:5001${item.imageUrl}`} 
                      alt={item.title} 
                      style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '8px', marginBottom: '15px' }}
                    />
                  ) : (
                    <div className="item-image-empty">
                      No Image
                    </div>
                  )}

                  <h4 style={{ margin: '10px 0', color: 'var(--text-h)' }}>{item.title}</h4>
                  <p className="item-price">₹{item.price}</p>
                  <span className="item-badge">
                    {item.category}
                  </span>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text)', marginTop: '10px' }}>
                    Seller: {item.seller_email}
                  </p>

                  {user && user.email === item.seller_email && (
                    <button 
                      onClick={() => handleDelete(item.id)}
                      className="btn-danger"
                      style={{ marginTop: '15px', width: '100%', fontSize: '0.85rem' }}
                    >
                      Delete Item
                    </button>
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