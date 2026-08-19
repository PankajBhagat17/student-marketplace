// client/src/pages/Dashboard.tsx
import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast'; 

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

    // --- CAMPUS SAFETY POLICY FILTER FOR ILLEGAL ITEMS ---
    const forbiddenKeywords = ['alcohol', 'beer', 'wine', 'drug', 'weed', 'cannabis', 'vape', 'cigarette', 'tobacco', 'pill', 'weapon', 'gun', 'knife'];
    const lowerTitle = newTitle.toLowerCase();
    const hasForbiddenWord = forbiddenKeywords.some(word => lowerTitle.includes(word));

    if (hasForbiddenWord) {
      toast.error('Listing rejected: Items involving alcohol, drugs, or weapons violate campus safety rules.');
      return; 
    }

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
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: 'hsl(var(--background))', color: 'hsl(var(--foreground))' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} style={{ width: '40px', height: '40px', border: '4px solid rgba(255,255,255,0.1)', borderTop: '4px solid #b185ff', borderRadius: '50%', marginBottom: '20px' }} />
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 'normal' }}>Loading Marketplace...</h2>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      style={{ position: 'relative', width: '100%', minHeight: '100vh', overflowX: 'hidden' }}
    >
      {/* PERFECTLY FIXED LOCAL VIDEO BACKGROUND */}
      <video
        src="/campus-bg.mp4.mp4"
        autoPlay loop muted playsInline
        style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', objectFit: 'cover', zIndex: 0 }}
      />
      {/* Dark Overlay */}
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(5, 15, 25, 0.4)', zIndex: 1 }} />

      {/* DASHBOARD CONTENT */}
      <div className="dashboard-wrapper" style={{ position: 'relative', zIndex: 10 }}>
        <Toaster position="bottom-right" toastOptions={{ style: { background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' } }} />

        <div className="amz-header-container">
          <div className="amz-top-row" style={{ padding: '20px 4vw' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <button className="liquid-glass" style={{ padding: '8px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer' }} onClick={() => setIsSidebarOpen(true)}>☰</button>
              <h2 className="amz-brand">Campus<span style={{ color: '#febd69', fontStyle: 'italic' }}>Trade</span></h2>
            </div>
            
            <div className="amz-actions">
              {user && user.email === 'bhagatpankaj7249@gmail.com' && (
                <button className="liquid-glass" onClick={() => window.open('https://student-marketplace-ho49.onrender.com/api/admin/export-data')} 
                        style={{ padding: '8px 15px', borderRadius: '8px', fontSize: '0.85rem', cursor: 'pointer' }}>
                  📊 Export Data
                </button>
              )}

              {user ? (
                <Link to="/profile" className="liquid-glass" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 15px', borderRadius: '8px', textDecoration: 'none' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{getDisplayName()} 👤</span>
                </Link>
              ) : (
                <Link to="/login" className="liquid-glass" style={{ padding: '8px 15px', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.9rem' }}>
                  Sign in 👤
                </Link>
              )}
              
              {user && (
                <button onClick={() => navigate('/messages')} className="liquid-glass" style={{ padding: '8px 15px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' }}>
                  💬 Inbox
                </button>
              )}

              <button onClick={() => { if(checkAuth()) setViewMode('Wishlist') }} className="liquid-glass" style={{ padding: '8px 15px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' }}>
                🛒 Favorites ({favorites.length})
              </button>
            </div>
          </div>

          <div className="amz-search-row" style={{ padding: '0 4vw 15px 4vw' }}>
            <input 
              type="text" 
              placeholder="Search Marketplace..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && applyAdvancedFilters()}
            />
            <button onClick={applyAdvancedFilters}>🔍</button>
          </div>

          <div className="amz-nav-row" style={{ padding: '10px 4vw', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ display: 'flex', gap: '25px', overflowX: 'auto', flex: 1, scrollbarWidth: 'none', alignItems: 'center' }}>
              <button className={filterCategory === 'All' ? 'active' : ''} onClick={() => setFilterCategory('All')}>Shop By Category</button>
              <button className={filterCategory === 'Textbooks' ? 'active' : ''} onClick={() => setFilterCategory('Textbooks')}>Textbooks</button>
              <button className={filterCategory === 'Electronics' ? 'active' : ''} onClick={() => setFilterCategory('Electronics')}>Electronics</button>
              <button className={filterCategory === 'Dorm Essentials' ? 'active' : ''} onClick={() => setFilterCategory('Dorm Essentials')}>Dorm Essentials</button>
              <button className={filterCategory === 'Lost & Found' ? 'active' : ''} onClick={() => setFilterCategory('Lost & Found')}>Lost & Found</button>
            </div>
            
            <button 
              onClick={() => { if(checkAuth()) setShowSellForm(!showSellForm); }} 
              className="liquid-glass"
              style={{ borderRadius: '9999px', padding: '8px 25px', fontWeight: 'bold', fontSize: '0.9rem', whiteSpace: 'nowrap', marginLeft: '10px', cursor: 'pointer' }}
            >
              {showSellForm ? 'Close Form ✕' : '+ Sell Item'}
            </button>
          </div>
        </div>

        <div className="dashboard-body" style={{ padding: '30px 4vw' }}>
          
          <AnimatePresence>
            {showSellForm && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} 
                style={{ overflow: 'hidden', marginBottom: '30px' }}
              >
                <div className="item-card" style={{ margin: 0, maxWidth: '800px', marginLeft: 'auto', marginRight: 'auto', textAlign: 'left' }}>
                  <h3 style={{ margin: '0 0 20px 0', color: 'hsl(var(--foreground))', fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: 'normal' }}>Post a New Item</h3>
                  <form onSubmit={handleCreateListing}>
                    <input type="text" style={{width: '100%', padding: '15px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white', marginBottom: '15px'}} placeholder="Item Title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} required />
                    <input type="number" style={{width: '100%', padding: '15px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white', marginBottom: '15px'}} placeholder="Price (₹)" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} required />
                    <select style={{width: '100%', padding: '15px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white', marginBottom: '15px'}} value={newPostCategory} onChange={(e) => setNewPostCategory(e.target.value)}>
                      <option value="Textbooks" style={{color: 'black'}}>Textbooks</option>
                      <option value="Electronics" style={{color: 'black'}}>Electronics</option>
                      <option value="Dorm Essentials" style={{color: 'black'}}>Dorm Essentials</option>
                      <option value="Lost & Found" style={{color: 'black'}}>Lost & Found 🔍</option>
                      <option value="Skills & Services" style={{color: 'black'}}>Skills & Services 🤝</option>
                    </select>
                    <input type="file" accept="image/*" style={{width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white', marginBottom: '15px'}} onChange={(e) => setImageFile(e.target.files ? e.target.files[0] : null)} />
                    {imageFile && (
                      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                        <img src={URL.createObjectURL(imageFile)} alt="Preview" style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '12px', border: '2px dashed rgba(255,255,255,0.2)' }} />
                      </div>
                    )}
                    <button type="submit" className="liquid-glass" style={{ width: '100%', padding: '15px', borderRadius: '12px', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer' }}>Publish Listing</button>
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="listings-panel">
            <div style={{ display: 'flex', gap: '15px', marginBottom: '30px' }}>
              <button onClick={() => setViewMode('All')} className="liquid-glass" style={{ padding: '10px 25px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold', background: viewMode === 'All' ? 'rgba(255,255,255,0.15)' : 'transparent' }}>All Results</button>
              {user && (
                <button onClick={() => setViewMode('Mine')} className="liquid-glass" style={{ padding: '10px 25px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold', background: viewMode === 'Mine' ? 'rgba(255,255,255,0.15)' : 'transparent' }}>My Items</button>
              )}
            </div>

            <div className="listings-grid">
              {finalDisplayListings.length === 0 ? (
                <div className="item-card" style={{ padding: '80px 20px', gridColumn: '1 / -1' }}>
                  <h3 style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 'normal', margin: 0 }}>Silence.</h3>
                  <p style={{ color: 'hsl(var(--muted-foreground))', marginTop: '10px', fontSize: '1.1rem' }}>No items found matching your criteria.</p>
                </div>
              ) : (
                finalDisplayListings.map((item, index) => {
                   const isFavorited = favorites.includes(item.id);
                   return (
                   <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: index * 0.05 }} className="item-card" style={{ opacity: item.status === 'sold' ? 0.6 : 1, position: 'relative' }}>
                     
                     <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => handleToggleFavorite(item.id)} className="liquid-glass" style={{ position: 'absolute', top: '15px', left: '15px', borderRadius: '50%', padding: '10px', cursor: 'pointer', zIndex: 10, fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                       {isFavorited ? '❤️' : '🤍'}
                     </motion.button>
                     
                     {item.status === 'sold' && (
                       <div style={{ position: 'absolute', top: '15px', right: '15px', background: '#ef4444', color: 'white', padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold', zIndex: 10 }}>SOLD</div>
                     )}

                     {item.imageUrl ? (
                       <img 
                         src={item.imageUrl.startsWith('http') ? item.imageUrl : `https://student-marketplace-ho49.onrender.com${item.imageUrl}`} 
                         alt={item.title} 
                         onClick={() => setSelectedImage(item.imageUrl)}
                         style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: '12px', marginBottom: '20px', cursor: 'zoom-in', border: '1px solid rgba(255,255,255,0.05)' }} 
                       />
                     ) : (
                       <div style={{ height: '180px', background: 'rgba(0,0,0,0.2)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', color: 'rgba(255,255,255,0.5)' }}>No Image</div>
                     )}

                     <h4 style={{ margin: '10px 0', color: 'hsl(var(--foreground))', fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 'normal', textDecoration: item.status === 'sold' ? 'line-through' : 'none' }}>{item.title}</h4>
                     <p style={{ color: 'white', fontWeight: 'bold', fontSize: '1.4rem', margin: '5px 0' }}>
                       {item.category === 'Lost & Found' ? 'Reward / N/A' : 
                        item.category === 'Skills & Services' && item.price == 0 ? 'Free / Negotiable' : 
                        `₹${item.price}`}
                     </p>
                     <span style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: 'hsl(var(--muted-foreground))', border: '1px solid rgba(255,255,255,0.1)', padding: '6px 15px', borderRadius: '20px', fontSize: '0.85rem', display: 'inline-block', marginTop: '10px' }}>
                       {item.category}
                     </span>
                     
                     <p style={{ fontSize: '0.85rem', color: 'hsl(var(--muted-foreground))', marginTop: '20px' }}>
                       Seller: {user ? item.seller_email.split('@')[0] : 'Log in to view'}
                     </p>

                     {user && user.email === item.seller_email && (
                       <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                         {item.status !== 'sold' && <button onClick={() => handleMarkSold(item.id)} className="liquid-glass" style={{ flex: 1, padding: '10px', color: '#51cf66', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}>Mark Sold</button>}
                         <button onClick={() => handleDelete(item.id)} className="liquid-glass" style={{ flex: 1, padding: '10px', color: '#ef4444', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}>Delete</button>
                       </div>
                     )}

                     {(!user || (user && user.email !== item.seller_email)) && item.status !== 'sold' && (
                       <div style={{ marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px' }}>
                         <div style={{ display: 'flex', gap: '10px' }}>
                           <button 
                             onClick={() => handleWhatsAppContact(item.seller_phone || '919876543210', item.title)} 
                             className="liquid-glass"
                             style={{ flex: 1, padding: '12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' }}
                           >
                             WhatsApp
                           </button>
                           <button 
                             onClick={() => { if(checkAuth()) navigate('/messages', { state: { newChat: item } }); }} 
                             className="liquid-glass"
                             style={{ flex: 1, padding: '12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' }}
                           >
                             Message
                           </button>
                         </div>
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
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSidebarOpen(false)} className="amz-sidebar-overlay" />
              <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'tween', duration: 0.3 }} className="amz-sidebar-drawer">
                <div className="amz-sidebar-header">
                  <h3>{user ? `Hello, ${getDisplayName()}` : 'Hello, Sign In'}</h3>
                  <button onClick={() => setIsSidebarOpen(false)} style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                </div>
                <div className="amz-sidebar-content">
                  <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 'normal', fontSize: '1.8rem', color: 'white' }}>Categories</h4>
                  <button onClick={() => handleSidebarCategoryClick('All')}>All Items</button>
                  <button onClick={() => handleSidebarCategoryClick('Textbooks')}>Textbooks</button>
                  <button onClick={() => handleSidebarCategoryClick('Electronics')}>Electronics</button>
                  <button onClick={() => handleSidebarCategoryClick('Dorm Essentials')}>Dorm Essentials</button>
                  <hr style={{ borderColor: 'rgba(255,255,255,0.05)', margin: '20px 0' }} />
                  <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 'normal', fontSize: '1.8rem', color: 'white' }}>Community</h4>
                  <button onClick={() => handleSidebarCategoryClick('Lost & Found')}>Lost & Found 🔍</button>
                  <hr style={{ borderColor: 'rgba(255,255,255,0.05)', margin: '20px 0' }} />
                  <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 'normal', fontSize: '1.8rem', color: 'white' }}>My Account</h4>
                  {user ? (
                    <>
                      <button onClick={() => { setIsSidebarOpen(false); navigate('/profile'); }}>My Profile</button>
                      <button onClick={() => { setIsSidebarOpen(false); setViewMode('Wishlist'); }}>My Wishlist</button>
                      <button onClick={() => { setIsSidebarOpen(false); setViewMode('Mine'); }}>My Listings</button>
                      <button onClick={() => { setIsSidebarOpen(false); navigate('/messages'); }}>My Inbox</button>
                      <button onClick={handleLogout} style={{ color: '#ef4444' }}>Log Out</button>
                    </>
                  ) : (
                    <button onClick={() => navigate('/login')} style={{ color: '#c084fc', fontWeight: 'bold' }}>Sign In / Register</button>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {selectedImage && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedImage(null)} style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'zoom-out' }}>
              <motion.img initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }} src={selectedImage.startsWith('http') ? selectedImage : `https://student-marketplace-ho49.onrender.com${selectedImage}`} alt="Full screen preview" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain', borderRadius: '12px', boxShadow: '0px 0px 40px rgba(0,0,0,0.8)', cursor: 'default' }} />
              <button onClick={() => setSelectedImage(null)} style={{ position: 'absolute', top: '25px', right: '35px', background: 'transparent', border: 'none', color: 'white', fontSize: '3rem', cursor: 'pointer' }}>×</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}