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

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
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
      const res = await axios.get(`https://student-marketplace-ho49.onrender.com/api/listings?${query.toString()}`);
      setListings(res.data);
      toast.success('Search applied!'); 
    } catch (err) {
      toast.error('Failed to search.'); 
    } finally {
      setIsSearching(false); 
    }
  };

  useEffect(() => { if (!isLoading) applyAdvancedFilters(); }, [filterCategory]);

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
      toast.success('Posted!', { id: toastId }); 
    } catch (err) {
      toast.error('Failed.', { id: toastId });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null); setFavorites([]); setIsSidebarOpen(false);
    toast.success('Logged out.');
  };

  const getDisplayName = () => {
    if (!user || !user.email) return '';
    const prefix = user.email.split('@')[0].replace(/[0-9]/g, '');
    return prefix.charAt(0).toUpperCase() + prefix.slice(1);
  };

  if (isLoading) return <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#1e1e24', color: 'white' }}><h2>Loading...</h2></div>;

  return (
    <div className="dashboard-wrapper">
      <Toaster position="bottom-right" />
      <div className="amz-header-container">
        <div className="amz-top-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <button className="amz-icon-btn" onClick={() => setIsSidebarOpen(true)}>☰</button>
            <h2 className="amz-brand">Student<span style={{ color: '#febd69' }}>Marketplace</span></h2>
          </div>
          <div className="amz-actions">
            {/* --- ADMIN EXPORT BUTTON --- */}
            {user && user.email === 'bhagatpankaj7249@gmail.com' && (
              <button onClick={() => window.open('https://student-marketplace-ho49.onrender.com/api/admin/export-data')} style={{ background: '#2563eb', color: 'white', padding: '5px 10px', fontSize: '0.8rem', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '10px' }}>📊 Export</button>
            )}
            {user ? <Link to="/profile" className="amz-profile"><span className="amz-text-small">Hello,</span><span className="amz-text-bold">{getDisplayName()} 👤</span></Link> : <Link to="/login" className="amz-profile"><span className="amz-text-bold">Sign in ›</span></Link>}
            <button onClick={() => { if(checkAuth()) setViewMode('Wishlist') }} className="amz-cart"><span className="amz-cart-count">{favorites.length}</span>🛒</button>
          </div>
        </div>
        <div className="amz-search-row">
          <input type="text" placeholder="Search Marketplace" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && applyAdvancedFilters()} />
          <button onClick={applyAdvancedFilters}>🔍</button>
        </div>
        <div className="amz-nav-row" style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '15px', overflowX: 'auto', flex: 1, scrollbarWidth: 'none' }}>
            <button onClick={() => setFilterCategory('All')}>Shop By Category</button>
            <button onClick={() => setFilterCategory('Textbooks')}>Textbooks</button>
            <button onClick={() => setFilterCategory('Electronics')}>Electronics</button>
            <button onClick={() => setFilterCategory('Lost & Found')}>Lost & Found</button>
          </div>
          <a href="#sell-section" style={{ background: '#febd69', color: '#111', padding: '6px 12px', borderRadius: '4px', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.9rem', whiteSpace: 'nowrap', marginLeft: '10px' }}>+ Sell Item</a>
        </div>
      </div>
      
      {/* (Dashboard Body & Sidebar Logic remains as you had it previously...) */}
    </div>
  );
}