// client/src/pages/Register.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [agreedToPolicy, setAgreedToPolicy] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedToPolicy) {
      setError('You must agree to the CampusTrade Safety & Privacy Policy to register.');
      return;
    }

    try {
      const res = await axios.post('https://student-marketplace-ho49.onrender.com/api/auth/register', { 
        name, 
        email, 
        password, 
        phone 
      });
      localStorage.setItem('token', res.data.token);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please check your details.');
    }
  };

  return (
    <div style={{ position: 'relative', minHeight: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', boxSizing: 'border-box' }}>
      
      {/* FIXED LOCAL VIDEO BACKGROUND */}
      <video
        src="/campus-bg.mp4.mp4"
        autoPlay loop muted playsInline
        style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', objectFit: 'cover', zIndex: 0 }}
      />
      {/* Dark Overlay */}
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(5, 15, 25, 0.4)', zIndex: 1 }} />

      {/* Cinematic Animated Form Card */}
      <motion.div 
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="liquid-glass"
        style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '420px', padding: '2.5rem 2rem', borderRadius: '24px', margin: '20px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', boxSizing: 'border-box' }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.8rem', fontWeight: 'normal', margin: '0 0 0.4rem 0', letterSpacing: '-1px', color: 'hsl(var(--foreground))' }}>Join the campus.</h1>
          <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.9rem', margin: 0 }}>Create your account to start trading.</p>
        </div>

        {error && (
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.25rem', fontSize: '0.85rem', textAlign: 'center' }}>
            {error}
          </motion.div>
        )}

        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label style={{ fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))', marginLeft: '0.25rem' }}>Full Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="First Last" style={{ width: '100%', padding: '0.85rem 1rem', backgroundColor: 'rgba(0, 0, 0, 0.4)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '10px', color: 'hsl(var(--foreground))', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label style={{ fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))', marginLeft: '0.25rem' }}>University Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="student@university.edu" style={{ width: '100%', padding: '0.85rem 1rem', backgroundColor: 'rgba(0, 0, 0, 0.4)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '10px', color: 'hsl(var(--foreground))', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label style={{ fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))', marginLeft: '0.25rem' }}>Phone Number (for WhatsApp)</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="0123456789" style={{ width: '100%', padding: '0.85rem 1rem', backgroundColor: 'rgba(0, 0, 0, 0.4)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '10px', color: 'hsl(var(--foreground))', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label style={{ fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))', marginLeft: '0.25rem' }}>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" style={{ width: '100%', padding: '0.85rem 1rem', backgroundColor: 'rgba(0, 0, 0, 0.4)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '10px', color: 'hsl(var(--foreground))', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }} />
          </div>

          {/* Policy Agreement Checkbox */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginTop: '5px', fontSize: '0.85rem', color: 'hsl(var(--muted-foreground))', lineHeight: '1.4' }}>
            <input 
              type="checkbox" 
              id="policy" 
              checked={agreedToPolicy} 
              onChange={(e) => setAgreedToPolicy(e.target.checked)} 
              style={{ marginTop: '3px', cursor: 'pointer', accentColor: '#c084fc' }}
            />
            <label htmlFor="policy" style={{ cursor: 'pointer' }}>
              I agree to the <span onClick={(e) => { e.preventDefault(); setShowPolicyModal(true); }} style={{ color: '#febd69', textDecoration: 'underline' }}>Terms, Safety Rules & Privacy Policy</span>.
            </label>
          </div>

          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" style={{ width: '100%', padding: '1rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '10px', color: 'hsl(var(--foreground))', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', marginTop: '0.5rem', transition: 'background 0.2s' }}>
            Create Account
          </motion.button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem', color: 'hsl(var(--muted-foreground))' }}>
          Already have an account? <span onClick={() => navigate('/login')} style={{ color: 'hsl(var(--foreground))', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: '4px' }}>Sign in</span>
        </div>
      </motion.div>

      {/* Policy Details Modal */}
      <AnimatePresence>
        {showPolicyModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowPolicyModal(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 999, backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="liquid-glass"
              style={{ width: '100%', maxWidth: '500px', padding: '30px', borderRadius: '20px', background: 'rgba(10, 25, 40, 0.85)', border: '1px solid rgba(255,255,255,0.15)', textAlign: 'left', boxSizing: 'border-box' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', margin: 0, fontWeight: 'normal', color: 'white' }}>Terms & Safety Policy</h2>
                <button onClick={() => setShowPolicyModal(false)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
              </div>
              <div style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.9rem', lineHeight: '1.6', display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '50vh', overflowY: 'auto' }}>
                <p><strong>1. Campus Verification:</strong> CampusTrade is intended exclusively for verified university students to buy, sell, or trade personal items.</p>
                <p><strong>2. Safe Meetups:</strong> Users agree to conduct all cash or item exchanges in secure, well-lit, public areas on campus (e.g., student union or library lobbies).</p>
                <p><strong>3. Prohibited Goods:</strong> Listing illegal items, weapons, alcohol, or unauthorized academic materials will result in immediate account termination.</p>
                <p><strong>4. Privacy:</strong> Your phone number and email are shared only with peers when connecting over specific marketplace listings.</p>
              </div>
              <button onClick={() => { setAgreedToPolicy(true); setShowPolicyModal(false); }} className="liquid-glass" style={{ width: '100%', marginTop: '20px', padding: '12px', borderRadius: '10px', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>
                Agree & Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}