// client/src/pages/Profile.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';

export default function Profile() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      try {
        // Fetching user data via the existing dashboard data route
        const res = await axios.get('https://student-marketplace-ho49.onrender.com/api/dashboard-data', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const userData = res.data.userThatRequestedThis;
        setFormData({
          name: userData.name || '',
          email: userData.email || '',
          phone: userData.phone || ''
        });
      } catch (err) {
        toast.error('Session expired. Please log in again.');
        localStorage.removeItem('token');
        navigate('/login');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [navigate]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const toastId = toast.loading('Updating profile...');
    try {
      // Assuming your backend has a PUT route for profile updates. 
      // If not, it will just show the error toast, but the UI is ready for it!
      await axios.put('https://student-marketplace-ho49.onrender.com/api/auth/profile', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Profile updated successfully!', { id: toastId });
      setIsEditing(false);
    } catch (err) {
      toast.error('Could not update profile (Endpoint might not exist yet)', { id: toastId });
      setIsEditing(false); 
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    toast.success('Logged out successfully.');
    navigate('/login');
  };

  if (isLoading) {
    return (
      <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'hsl(var(--background))', color: 'hsl(var(--foreground))' }}>
         <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} style={{ width: '40px', height: '40px', border: '4px solid rgba(255,255,255,0.1)', borderTop: '4px solid #b185ff', borderRadius: '50%' }} />
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', minHeight: '100vh', width: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Toaster position="bottom-right" toastOptions={{ style: { background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' } }} />

      {/* PERFECTLY FIXED LOCAL VIDEO BACKGROUND */}
      <video
        src="/campus-bg.mp4.mp4"
        autoPlay loop muted playsInline
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: -1 }}
      />
      {/* Dark Overlay */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(5, 15, 25, 0.5)', zIndex: 0 }} />

      {/* Simple Navigation */}
      <nav style={{ position: 'relative', zIndex: 10, display: 'flex', justifyContent: 'space-between', padding: '20px 4vw' }}>
        <button onClick={() => navigate('/dashboard')} className="liquid-glass" style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
          ← Back to Marketplace
        </button>
        <button onClick={handleLogout} className="liquid-glass" style={{ padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
          Log Out
        </button>
      </nav>

      {/* Profile Card */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', position: 'relative', zIndex: 10 }}>
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="liquid-glass"
          style={{ width: '100%', maxWidth: '500px', padding: '3rem', borderRadius: '24px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}
        >
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', margin: '0 auto 1.5rem auto', border: '1px solid rgba(255,255,255,0.2)' }}>
              👤
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', fontWeight: 'normal', margin: '0 0 0.5rem 0', color: 'hsl(var(--foreground))' }}>
              {formData.name || 'Your Profile'}
            </h1>
            <p style={{ color: 'hsl(var(--muted-foreground))', margin: 0 }}>Manage your campus identity.</p>
          </div>

          {!isEditing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '15px 20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <label style={{ fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '1px' }}>Full Name</label>
                <div style={{ fontSize: '1.1rem', color: 'white', marginTop: '4px' }}>{formData.name || 'Not provided'}</div>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '15px 20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <label style={{ fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '1px' }}>University Email</label>
                <div style={{ fontSize: '1.1rem', color: 'white', marginTop: '4px' }}>{formData.email || 'Not provided'}</div>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '15px 20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <label style={{ fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '1px' }}>WhatsApp Number</label>
                <div style={{ fontSize: '1.1rem', color: 'white', marginTop: '4px' }}>{formData.phone || 'Not provided'}</div>
              </div>
              
              <button onClick={() => setIsEditing(true)} className="liquid-glass" style={{ width: '100%', padding: '1rem', borderRadius: '12px', color: 'white', fontWeight: 'bold', marginTop: '1.5rem', cursor: 'pointer', transition: 'transform 0.2s' }} onMouseEnter={(e)=>e.currentTarget.style.transform='translateY(-2px)'} onMouseLeave={(e)=>e.currentTarget.style.transform='translateY(0)'}>
                Edit Details
              </button>
            </div>
          ) : (
            <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.85rem', color: 'hsl(var(--muted-foreground))', marginLeft: '0.25rem' }}>Full Name</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} style={{ width: '100%', padding: '1rem', background: 'rgba(0, 0, 0, 0.4)', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '12px', color: 'white', fontSize: '1rem', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.85rem', color: 'hsl(var(--muted-foreground))', marginLeft: '0.25rem' }}>University Email (Cannot be changed)</label>
                <input type="email" value={formData.email} disabled style={{ width: '100%', padding: '1rem', background: 'rgba(0, 0, 0, 0.2)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '12px', color: 'rgba(255,255,255,0.5)', fontSize: '1rem', outline: 'none', cursor: 'not-allowed', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.85rem', color: 'hsl(var(--muted-foreground))', marginLeft: '0.25rem' }}>WhatsApp Number</label>
                <input type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} style={{ width: '100%', padding: '1rem', background: 'rgba(0, 0, 0, 0.4)', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '12px', color: 'white', fontSize: '1rem', outline: 'none', boxSizing: 'border-box' }} />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setIsEditing(false)} style={{ flex: 1, padding: '1rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '12px', color: 'white', fontWeight: 'bold', cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={(e)=>e.currentTarget.style.background='rgba(255,255,255,0.05)'} onMouseLeave={(e)=>e.currentTarget.style.background='transparent'}>Cancel</button>
                <button type="submit" className="liquid-glass" style={{ flex: 2, padding: '1rem', borderRadius: '12px', color: 'white', fontWeight: 'bold', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.3)' }}>Save Changes</button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
}