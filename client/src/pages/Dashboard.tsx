// client/src/pages/Dashboard.tsx
import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast'; 
import ChatBox from '../components/ChatBox'; // --- NEW: Imported your ChatBox!

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null); 
  const [listings, setListings] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<number[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showSellForm, setShowSellForm] = useState(false); 

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  
  const [viewMode, setViewMode] = useState<'All' | 'Mine' | 'Wishlist'>('All');

  const [newTitle, setNewTitle] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newPostCategory, setNewPostCategory] = useState('Textbooks');
  const [imageFile, setImageFile] = useState<File | null>(null);

  // --- NEW: Tracks which item's chatbox is currently open
  const [activeChat, setActiveChat] = useState<number | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const listingsRes = await axios.get('https://student-marketplace-ho49.onrender.com/api/listings');
        setListings(listingsRes.data);

        const token = localStorage.getItem('token');
        if (token) {
          const userRes = await axios.get('https://student-marketplace-ho49.onrender.com/api/dashboard-data', { headers: { Authorization: `Bearer ${token}` } });
          setUser(userRes.data.userThatRequestedThis);
          
          const favRes = await axios.get('https://student-marketplace-ho49.onrender.com/api/favorites', { headers: { Authorization: `Bearer ${token}` } });
          setFavorites(favRes.data.favoriteIds || []);
        } else {
          setUser(null); 
        }
      } catch (err: any) {
        localStorage.removeItem('token');
        setUser(null);
      } finally {
        setIsLoading(false); 
      }
    };
    fetchDashboardData();
  }, []);

  const checkAuth = () => {
    if (!user) {
      toast('Please log in or sign up to do this!', { icon: '🔒' });
      navigate('/login');
      return false; 
    }
    return true; 
  };

  const applyAdvancedFilters = async () => {
    setIsSearching(true); 
    try {
      const query = new URLSearchParams();
      if (searchTerm) query.append('search', searchTerm);
      if (filterCategory !== 'All') query.append('category', filterCategory);
      if (minPrice) query.append('minPrice', minPrice);
      if (maxPrice) query.append('maxPrice', maxPrice);
      if (sortBy) query.append('sortBy', sortBy);

      const res = await axios.get(`https://student-marketplace-ho49.onrender.com/api/listings?${query.toString()}`);
      
      setListings(res.data);
      toast.success('Search applied!'); 
    } catch (err) {
      toast.error('Failed to search database.'); 
    } finally {
      setIsSearching(false); 
    }
  };

  useEffect(() => {
    if (!isLoading) applyAdvancedFilters();
  }, [filterCategory]);

  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkAuth()) return;

    const token = localStorage.getItem('token');
    const toastId = toast.loading('Compressing & Posting...'); 

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
      
      setShowSellForm(false); 
      
      toast.success('Item posted successfully!', { id: toastId }); 
    } catch (err) {
      toast.error('Failed to create listing.', { id: toastId });
    }
  };

  const handleDelete = async (id: number) => {
    if (!checkAuth()) return;
    if (!window.confirm("Are you sure you want to delete this listing?")) return;
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`https://student-marketplace-ho49.onrender.com/api/listings/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setListings(listings.filter(item => item.id !== id));
      toast.success('Item deleted.');
    } catch (err) {
      toast.error('Failed to delete item.');
    }
  };

  const handleMarkSold = async (id: number) => {
    if (!checkAuth()) return;
    const token = localStorage.getItem('token');
    try {
      const response = await axios.put(`https://student-marketplace-ho49.onrender.com/api/listings/${id}/status`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setListings(listings.map(item => item.id === id ? response.data : item));
      toast.success('Item marked as SOLD! 🎉');
    } catch (err) {
      toast.error('Failed to update status.');
    }
  };

  const handleToggleFavorite = async (listingId: number) => {
    if (!checkAuth()) return; 
    
    const token = localStorage.getItem('token');
    const isFavorited = favorites.includes(listingId);
    try {
      if (isFavorited) {
        await axios.delete(`https://student-marketplace-ho49.onrender.com/api/favorites/${listingId}`, { headers: { Authorization: `Bearer ${token}` } });
        setFavorites(favorites.filter(id => id !== listingId));
        toast('Removed from wishlist', { icon: '💔' });
      } else {
        await axios.post(`https://student-marketplace-ho49.onrender.com/api/favorites`, { listing_id: listingId }, { headers: { Authorization: `Bearer ${token}` } });
        setFavorites([...favorites, listingId]);
        toast.success('Added to wishlist!');
      }
    } catch (err) {
      toast.error('Failed to update wishlist.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null); 
    setFavorites([]);
    setIsSidebarOpen(false);
    toast.success('Logged out safely.');
  };

  const handleWhatsAppContact = (sellerPhone: string, itemTitle: string) => {
    if (!checkAuth()) return; 
    const message = encodeURIComponent(`Hi! I saw your listing for "${itemTitle}" on the PCCOE Student Marketplace. Is it still available?`);
    window.open(`https://wa.me/${sellerPhone}?text=${message}`, '_blank');
  };

  const finalDisplayListings = listings.filter(item => {
    if (viewMode === 'Mine') return user && item.seller_email === user.email;
    if (viewMode === 'Wishlist') return favorites.includes(item.id);
    return true; 
  });

  const handleSidebarCategoryClick = (category: string) => {
    setFilterCategory(category);
    setIsSidebarOpen(false); 
  };

  const getDisplayName = () => {
    if (!user || !user.email) return '';
    if (user.name) return user.name;
    const prefix = user.email.split('@')[0].replace(/[0-9]/g, ''); 
    return prefix.charAt(0).toUpperCase() + prefix.slice(1); 
  };

  if (isLoading) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#1e1e24', color: 'white' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} style={{ width: '40px', height: '40px', border: '4px solid rgba(255,255,255,0.1)', borderTop: '4px solid #b185ff', borderRadius: '50%', marginBottom: '20px' }} />
        <h2>Loading Student Marketplace...</h2>
      </div>
    );
  }

  return (
    <div className="dashboard-wrapper">
      <Toaster position="bottom-right" toastOptions={{ style: { background: '#333', color: '#fff', borderRadius: '8px' } }} />

      <div className="amz-header-container">
        <div className="amz-top-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <button className="amz-icon-btn" onClick={() => setIsSidebarOpen(true)}>☰</button>
            <h2 className="amz-brand">Student<span style={{ color: '#febd69' }}>Marketplace</span></h2>
          </div>
          
          <div className="amz-actions">
            {user && user.email === 'bhagatpankaj7249@gmail.com' && (
              <button onClick={() => window.open('https://student-marketplace-ho49.onrender.com/api/admin/export-data')} 
                      style={{ background: '#2563eb', color: 'white', padding: '5px 10px', fontSize: '0.8rem', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '10px' }}>
                📊 Export Excel
              </button>
            )}

            {user ? (
              <Link to="/profile" className="amz-profile">
                <span className="amz-text-small">Hello,</span>
                <span className="amz-text-bold">{getDisplayName()} 👤</span>
              </Link>
            ) : (
              <Link to="/login" className="amz-profile">
                <span className="amz-text-small">Sign in ›</span>
                <span className="amz-text-bold">👤</span>
              </Link>
            )}
            <button onClick={() => { if(checkAuth()) setViewMode('Wishlist') }} className="amz-cart">
              <span className="amz-cart-count">{favorites.length}</span>
              🛒
            </button>
          </div>
        </div>

        <div className="amz-search-row">
          <input 
            type="text" 
            placeholder="Search Marketplace" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            onKeyDown={(e) => e.key === 'Enter' && applyAdvancedFilters()}
          />
          <button onClick={applyAdvancedFilters}>🔍</button>
        </div>

        <div className="amz-nav-row" style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '15px', overflowX: 'auto', flex: 1, scrollbarWidth: 'none' }}>
            <button className={filterCategory === 'All' ? 'active' : ''} onClick={() => setFilterCategory('All')}>Shop By Category</button>
            <button className={filterCategory === 'Textbooks' ? 'active' : ''} onClick={() => setFilterCategory('Textbooks')}>Textbooks</button>
            <button className={filterCategory === 'Electronics' ? 'active' : ''} onClick={() => setFilterCategory('Electronics')}>Electronics</button>
            <button className={filterCategory === 'Dorm Essentials' ? 'active' : ''} onClick={() => setFilterCategory('Dorm Essentials')}>Dorm Essentials</button>
            <button className={filterCategory === 'Lost & Found' ? 'active' : ''} onClick={() => setFilterCategory('Lost & Found')}>Lost & Found</button>
          </div>
          
          <button 
            onClick={() => { if(checkAuth()) setShowSellForm(!showSellForm); }} 
            style={{ background: '#febd69', color: '#111', padding: '6px 12px', borderRadius: '4px', border: 'none', fontWeight: 'bold', fontSize: '0.9rem', whiteSpace: 'nowrap', marginLeft: '10px', cursor: 'pointer' }}
          >
            {showSellForm ? 'Close Form ✕' : '+ Sell Item'}
          </button>
        </div>
      </div>

      <div className="dashboard-body" style={{ marginTop: '0' }}>
        
        <AnimatePresence>
          {showSellForm && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }} 
              animate={{ opacity: 1, height: 'auto' }} 
              exit={{ opacity: 0, height: 0 }} 
              style={{ overflow: 'hidden', marginBottom: '20px' }}
            >
              <div className="create-listing-panel" style={{ margin: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <h3 style={{ margin: 0 }}>Post a New Item</h3>
                </div>
                <form onSubmit={handleCreateListing}>
                  <input type="text" className="form-input" placeholder="Item Title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} required />
                  <input type="number" className="form-input" placeholder="Price (₹)" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} required />
                  <select className="form-input" value={newPostCategory} onChange={(e) => setNewPostCategory(e.target.value)}>
                    <option value="Textbooks">Textbooks</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Dorm Essentials">Dorm Essentials</option>
                    <option value="Lost & Found">Lost & Found 🔍</option>
                    <option value="Skills & Services">Skills & Services 🤝</option>
                  </select>
                  <input type="file" id="image-upload" accept="image/*" className="form-input" onChange={(e) => setImageFile(e.target.files ? e.target.files[0] : null)} style={{ padding: '8px', cursor: 'pointer' }} />
                  {imageFile && (
                    <div style={{ marginTop: '10px', textAlign: 'center', marginBottom: '15px' }}>
                      <img src={URL.createObjectURL(imageFile)} alt="Preview" style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '8px', border: '2px dashed var(--primary)' }} />
                    </div>
                  )}
                  <button type="submit" className="btn-primary" style={{ background: '#febd69', color: '#111' }}>Create Listing</button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="listings-panel">
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', padding: '0 10px' }}>
            <button onClick={() => setViewMode('All')} style={{ padding: '8px 15px', borderRadius: '20px', border: '1px solid #444', cursor: 'pointer', fontWeight: 'bold', background: viewMode === 'All' ? '#febd69' : '#2b2b36', color: viewMode === 'All' ? '#000' : 'white' }}>All Results</button>
            {user && (
              <>
                <button onClick={() => setViewMode('Mine')} style={{ padding: '8px 15px', borderRadius: '20px', border: '1px solid #444', cursor: 'pointer', fontWeight: 'bold', background: viewMode === 'Mine' ? '#febd69' : '#2b2b36', color: viewMode === 'Mine' ? '#000' : 'white' }}>My Items</button>
              </>
            )}
          </div>

          <div className="listings-grid">
            {finalDisplayListings.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', background: '#2b2b36', borderRadius: '8px', width: '100%', gridColumn: '1 / -1' }}>
                <h3 style={{ color: '#a0a0b0' }}>No items found</h3>
              </div>
            ) : (
              finalDisplayListings.map((item, index) => {
                 const isFavorited = favorites.includes(item.id);
                 return (
                 <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: index * 0.1 }} className="item-card" style={{ opacity: item.status === 'sold' ? 0.6 : 1, position: 'relative' }}>
                   
                   <button onClick={() => handleToggleFavorite(item.id)} style={{ position: 'absolute', top: '10px', left: '10px', background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', padding: '8px', cursor: 'pointer', zIndex: 10, fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                     {isFavorited ? '❤️' : '🤍'}
                   </button>
                   
                   {item.status === 'sold' && (
                     <div style={{ position: 'absolute', top: '10px', right: '10px', background: '#ef4444', color: 'white', padding: '5px 10px', borderRadius: '4px', fontWeight: 'bold', zIndex: 10 }}>SOLD</div>
                   )}
 
                   {item.imageUrl ? (
                     <img 
                       src={item.imageUrl.startsWith('http') ? item.imageUrl : `https://student-marketplace-ho49.onrender.com${item.imageUrl}`} 
                       alt={item.title} 
                       onClick={() => setSelectedImage(item.imageUrl)}
                       style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '8px', marginBottom: '15px', cursor: 'zoom-in' }} 
                     />
                   ) : (
                     <div className="item-image-empty">No Image</div>
                   )}
 
                   <h4 style={{ margin: '10px 0', color: 'var(--text-h)', textDecoration: item.status === 'sold' ? 'line-through' : 'none' }}>{item.title}</h4>
                   <p className="item-price">
                     {item.category === 'Lost & Found' ? 'Reward / N/A' : 
                      item.category === 'Skills & Services' && item.price == 0 ? 'Free / Negotiable' : 
                      `₹${item.price}`}
                   </p>
                   <span className="item-badge" style={{
                     backgroundColor: item.category === 'Lost & Found' ? 'rgba(239, 68, 68, 0.1)' : item.category === 'Skills & Services' ? 'rgba(59, 130, 246, 0.1)' : 'var(--accent-bg)',
                     color: item.category === 'Lost & Found' ? '#ef4444' : item.category === 'Skills & Services' ? '#3b82f6' : 'var(--accent)',
                     borderColor: item.category === 'Lost & Found' ? 'rgba(239, 68, 68, 0.5)' : item.category === 'Skills & Services' ? 'rgba(59, 130, 246, 0.5)' : 'var(--accent-border)'
                   }}>
                     {item.category}
                   </span>
                   
                   <p style={{ fontSize: '0.75rem', color: 'var(--text)', marginTop: '10px' }}>
                     Seller: {user ? item.seller_email : 'Log in to view'}
                   </p>
 
                   {user && user.email === item.seller_email && (
                     <div style={{ display: 'flex', gap: '8px', marginTop: '15px' }}>
                       {item.status !== 'sold' && <button onClick={() => handleMarkSold(item.id)} style={{ flex: 1, padding: '8px', background: '#51cf66', color: '#1e1e24', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}>Mark Sold</button>}
                       <button onClick={() => handleDelete(item.id)} className="btn-danger" style={{ flex: 1, padding: '8px', fontSize: '0.8rem' }}>Delete</button>
                     </div>
                   )}
 
                   {/* --- UPDATED: The Buyer Actions Section (WhatsApp + Live Chat) --- */}
                   {(!user || (user && user.email !== item.seller_email)) && item.status !== 'sold' && (
                     <div style={{ marginTop: '15px', borderTop: '1px solid #333', paddingTop: '10px' }}>
                       <div style={{ display: 'flex', gap: '10px' }}>
                         <button 
                           onClick={() => handleWhatsAppContact(item.seller_phone || '919876543210', item.title)} 
                           style={{ flex: 1, padding: '10px', background: '#25D366', color: '#fff', border: 'none', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' }}
                         >
                           WhatsApp
                         </button>
                         <button 
                           onClick={() => {
                             if(checkAuth()) setActiveChat(activeChat === item.id ? null : item.id);
                           }} 
                           style={{ flex: 1, padding: '10px', background: activeChat === item.id ? '#444' : '#febd69', color: activeChat === item.id ? '#fff' : '#111', border: 'none', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' }}
                         >
                           {activeChat === item.id ? 'Close Chat ✕' : 'Live Chat 💬'}
                         </button>
                       </div>

                       {/* --- NEW: The Hidden ChatBox that reveals when clicked --- */}
                       {activeChat === item.id && user && (
                         <div style={{ marginTop: '15px' }}>
                           <ChatBox 
                             listingId={item.id} 
                             currentUserEmail={user.email} 
                             sellerEmail={item.seller_email} 
                           />
                         </div>
                       )}
                     </div>
                   )}
                 </motion.div>
                 );
               })
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
              onClick={() => setIsSidebarOpen(false)}
              className="amz-sidebar-overlay"
            />
            
            <motion.div 
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'tween', duration: 0.3 }}
              className="amz-sidebar-drawer"
            >
              <div className="amz-sidebar-header">
                <h3>{user ? `Hello, ${getDisplayName()}` : 'Hello, Sign In'}</h3>
                <button onClick={() => setIsSidebarOpen(false)} style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
              </div>

              <div className="amz-sidebar-content">
                <h4>Trending Categories</h4>
                <button onClick={() => handleSidebarCategoryClick('All')}>All Items</button>
                <button onClick={() => handleSidebarCategoryClick('Textbooks')}>Textbooks</button>
                <button onClick={() => handleSidebarCategoryClick('Electronics')}>Electronics</button>
                <button onClick={() => handleSidebarCategoryClick('Dorm Essentials')}>Dorm Essentials</button>
                
                <hr style={{ borderColor: '#333', margin: '15px 0' }} />
                
                <h4>Campus Community</h4>
                <button onClick={() => handleSidebarCategoryClick('Lost & Found')}>Lost & Found 🔍</button>

                <hr style={{ borderColor: '#333', margin: '15px 0' }} />

                <h4>My Account</h4>
                {user ? (
                  <>
                    <button onClick={() => { setIsSidebarOpen(false); navigate('/profile'); }}>My Profile</button>
                    <button onClick={() => { setIsSidebarOpen(false); setViewMode('Wishlist'); }}>My Wishlist</button>
                    <button onClick={() => { setIsSidebarOpen(false); setViewMode('Mine'); }}>My Listings</button>
                    <button onClick={handleLogout} style={{ color: '#ef4444' }}>Log Out</button>
                  </>
                ) : (
                  <button onClick={() => navigate('/login')} style={{ color: '#febd69', fontWeight: 'bold' }}>Sign In / Register</button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedImage && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedImage(null)}
            style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'zoom-out' }}
          >
            <motion.img 
              initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }} src={selectedImage.startsWith('http') ? selectedImage : `https://student-marketplace-ho49.onrender.com${selectedImage}`} alt="Full screen preview" onClick={(e) => e.stopPropagation()} 
              style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain', borderRadius: '8px', boxShadow: '0px 0px 30px rgba(0,0,0,0.5)', cursor: 'default' }}
            />
            <button onClick={() => setSelectedImage(null)} style={{ position: 'absolute', top: '20px', right: '30px', background: 'transparent', border: 'none', color: 'white', fontSize: '2.5rem', cursor: 'pointer' }}>×</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}