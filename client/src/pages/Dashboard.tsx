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

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  
  const [showFilters, setShowFilters] = useState(false);
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
      toast.success('Filters applied!'); 
    } catch (err) {
      toast.error('Failed to search database.'); 
    } finally {
      setIsSearching(false); 
    }
  };

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
    toast.success('Logged out safely.');
  };

  const handleWhatsAppContact = (sellerPhone: string, itemTitle: string) => {
    if (!checkAuth()) return; 
    const message = encodeURIComponent(`Hi! I saw your listing for "${itemTitle}" on the PCCOE Student Marketplace. Is it still available?`);
    window.open(`https://wa.me/${sellerPhone}?text=${message}`, '_blank');
  };

  const handleEmailContact = (sellerEmail: string, itemTitle: string) => {
    if (!checkAuth()) return; 
    const subject = encodeURIComponent(`Interested in buying: ${itemTitle}`);
    const body = encodeURIComponent(`Hi!\n\nI saw your listing for "${itemTitle}" on the Student Marketplace and I am interested in buying it. Let me know when and where we can meet up!`);
    window.location.href = `mailto:${sellerEmail}?subject=${subject}&body=${body}`;
  };

  const finalDisplayListings = listings.filter(item => {
    if (viewMode === 'Mine') return user && item.seller_email === user.email;
    if (viewMode === 'Wishlist') return favorites.includes(item.id);
    return true; 
  });

  if (isLoading) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#1e1e24', color: 'white' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} style={{ width: '40px', height: '40px', border: '4px solid rgba(255,255,255,0.1)', borderTop: '4px solid #b185ff', borderRadius: '50%', marginBottom: '20px' }} />
        <h2>Loading PCCOE Marketplace...</h2>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="dashboard-wrapper">
      <Toaster position="bottom-right" toastOptions={{ style: { background: '#333', color: '#fff', borderRadius: '8px' } }} />

      <div className="dashboard-header">
        <h2>Student Marketplace | PCCOE</h2>
        <div className="user-info" style={{ display: 'flex', alignItems: 'center' }}>
          {user ? (
            <>
              <span style={{ marginRight: '15px' }}>Logged in: <strong>{user.college_domain}</strong></span>
              <Link to="/profile" style={{ color: 'white', textDecoration: 'none', marginRight: '15px', fontWeight: 'bold', background: '#2b2b36', padding: '8px 12px', borderRadius: '4px' }}>
                👤 My Profile
              </Link>
              <button onClick={handleLogout} className="btn-danger">Log Out</button>
            </>
          ) : (
            <button onClick={() => navigate('/login')} className="btn-primary" style={{ padding: '8px 20px' }}>
              Log In / Sign Up
            </button>
          )}
        </div>
      </div>

      <div className="dashboard-body">
        
        {/* 1. POST AN ITEM ALWAYS FIRST IN HTML (Left side on Desktop) */}
        {user ? (
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
        ) : (
          <div className="create-listing-panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '40px 20px' }}>
            <h3 style={{ marginBottom: '15px' }}>Have something to sell?</h3>
            <p style={{ color: 'var(--text)', marginBottom: '20px' }}>Join the PCCOE marketplace to post your items instantly.</p>
            <button onClick={() => navigate('/login')} className="btn-primary">Create an Account</button>
          </div>
        )}

        {/* 2. LISTINGS GRID SECOND IN HTML (Right side on Desktop) */}
        <div className="listings-panel">
          <div style={{ background: '#2b2b36', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input type="text" className="form-input" placeholder="Search items..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ margin: 0, flex: 1 }} />
              <select className="form-input" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} style={{ margin: 0, width: '150px' }}>
                <option value="All">All Categories</option>
                <option value="Textbooks">Textbooks</option>
                <option value="Electronics">Electronics</option>
                <option value="Dorm Essentials">Dorm Essentials</option>
              </select>
              <button onClick={applyAdvancedFilters} className="btn-primary" style={{ padding: '8px 20px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }} disabled={isSearching}>
                {isSearching ? '⏳ Searching...' : '🔍 Search'}
              </button>
              <button onClick={() => setShowFilters(!showFilters)} style={{ padding: '8px 15px', background: 'transparent', border: '1px solid #b185ff', color: '#b185ff', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                {showFilters ? 'Hide Filters ⬆️' : 'Advanced Filters ⚙️'}
              </button>
            </div>
            
            {showFilters && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #444', flexWrap: 'wrap' }}>
                <span style={{ color: '#a0a0b0', fontWeight: 'bold', fontSize: '0.9rem' }}>Price Range:</span>
                <input type="number" placeholder="Min ₹" className="form-input" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} style={{ margin: 0, width: '90px', padding: '6px' }} />
                <span style={{ color: '#a0a0b0' }}>-</span>
                <input type="number" placeholder="Max ₹" className="form-input" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} style={{ margin: 0, width: '90px', padding: '6px' }} />
                <span style={{ color: '#a0a0b0', fontWeight: 'bold', fontSize: '0.9rem', marginLeft: '15px' }}>Sort By:</span>
                <select className="form-input" value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ margin: 0, width: '150px', padding: '6px' }}>
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                </select>
              </motion.div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <button onClick={() => setViewMode('All')} style={{ padding: '8px 15px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontWeight: 'bold', background: viewMode === 'All' ? '#b185ff' : '#2b2b36', color: 'white' }}>All Results</button>
            
            {user && (
              <>
                <button onClick={() => setViewMode('Mine')} style={{ padding: '8px 15px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontWeight: 'bold', background: viewMode === 'Mine' ? '#b185ff' : '#2b2b36', color: 'white' }}>My Items</button>
                <button onClick={() => setViewMode('Wishlist')} style={{ padding: '8px 15px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontWeight: 'bold', background: viewMode === 'Wishlist' ? '#ff6b6b' : '#2b2b36', color: 'white' }}>❤️ Wishlist</button>
              </>
            )}
          </div>

          <div className="listings-grid">
            {finalDisplayListings.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', background: '#2b2b36', borderRadius: '8px', width: '100%', gridColumn: '1 / -1' }}>
                <h3 style={{ color: '#a0a0b0' }}>No items found</h3>
                <p style={{ color: 'var(--text)', fontSize: '0.9rem' }}>Try adjusting your filters or search terms.</p>
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
                     <div style={{ position: 'absolute', top: '10px', right: '10px', background: '#ff6b6b', color: 'white', padding: '5px 10px', borderRadius: '4px', fontWeight: 'bold', zIndex: 10 }}>SOLD</div>
                   )}
 
                   {item.imageUrl ? (
                     <img 
                       src={`https://student-marketplace-ho49.onrender.com${item.imageUrl}`} 
                       alt={item.title} 
                       onClick={() => setSelectedImage(item.imageUrl)}
                       style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '8px', marginBottom: '15px', cursor: 'zoom-in' }} 
                     />
                   ) : (
                     <div className="item-image-empty">No Image</div>
                   )}
 
                   <h4 style={{ margin: '10px 0', color: 'var(--text-h)', textDecoration: item.status === 'sold' ? 'line-through' : 'none' }}>{item.title}</h4>
                   <p className="item-price">₹{item.price}</p>
                   <span className="item-badge">{item.category}</span>
                   
                   <p style={{ fontSize: '0.75rem', color: 'var(--text)', marginTop: '10px' }}>
                     Seller: {user ? item.seller_email : 'Log in to view'}
                   </p>
 
                   {user && user.email === item.seller_email && (
                     <div style={{ display: 'flex', gap: '8px', marginTop: '15px' }}>
                       {item.status !== 'sold' && <button onClick={() => handleMarkSold(item.id)} style={{ flex: 1, padding: '8px', background: '#51cf66', color: '#1e1e24', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}>Mark Sold</button>}
                       <button onClick={() => handleDelete(item.id)} className="btn-danger" style={{ flex: 1, padding: '8px', fontSize: '0.8rem' }}>Delete</button>
                     </div>
                   )}
 
                   {(!user || (user && user.email !== item.seller_email)) && item.status !== 'sold' && (
                     <div style={{ marginTop: '15px', borderTop: '1px solid #333', paddingTop: '10px' }}>
                       <p style={{ fontSize: '0.8rem', color: '#a0a0b0', marginBottom: '10px', textAlign: 'center' }}>
                         📞 <strong>{user ? (item.seller_phone || '919876543210') : '🔒 Hidden'}</strong>
                       </p>
                       <div style={{ display: 'flex', gap: '8px' }}>
                         <button onClick={() => handleWhatsAppContact(item.seller_phone || '919876543210', item.title)} style={{ flex: 1, padding: '8px', background: '#25D366', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}>💬 WhatsApp</button>
                         <button onClick={() => handleEmailContact(item.seller_email, item.title)} style={{ flex: 1, padding: '8px', background: '#b185ff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}>✉️ Email</button>
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
        {selectedImage && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            onClick={() => setSelectedImage(null)}
            style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'zoom-out' }}
          >
            <motion.img 
              initial={{ scale: 0.8 }} 
              animate={{ scale: 1 }} 
              exit={{ scale: 0.8 }} 
              src={`https://student-marketplace-ho49.onrender.com${selectedImage}`} 
              alt="Full screen preview" 
              onClick={(e) => e.stopPropagation()} 
              style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain', borderRadius: '8px', boxShadow: '0px 0px 30px rgba(0,0,0,0.5)', cursor: 'default' }}
            />
            <button 
              onClick={() => setSelectedImage(null)} 
              style={{ position: 'absolute', top: '20px', right: '30px', background: 'transparent', border: 'none', color: 'white', fontSize: '2.5rem', cursor: 'pointer' }}
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}