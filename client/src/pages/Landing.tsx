// client/src/pages/Landing.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export default function Landing() {
  const navigate = useNavigate();
  const [modalType, setModalType] = useState<'rules' | 'support' | null>(null);

  return (
    <div style={{ position: 'relative', minHeight: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxSizing: 'border-box' }}>
      
      {/* FIXED VIDEO BACKGROUND */}
      <video
        src="/campus-bg.mp4.mp4"
        autoPlay loop muted playsInline
        style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', objectFit: 'cover', zIndex: 0 }}
      />
      {/* Dark Overlay */}
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(5, 15, 25, 0.45)', zIndex: 1 }} />

      {/* Responsive Navigation Bar */}
      <nav style={{ position: 'relative', zIndex: 10, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', padding: '20px 4vw', width: '100%', boxSizing: 'border-box', gap: '15px' }}>
        
        {/* Logo (Trademark '®' removed) */}
        <div style={{ fontSize: 'clamp(1.5rem, 2.5vw, 2rem)', letterSpacing: '-0.025em', color: 'hsl(var(--foreground))', fontFamily: "var(--font-display)", fontWeight: 'normal' }}>
          CampusTrade
        </div>

        {/* Links */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(1rem, 2vw, 2rem)', fontSize: '0.95rem', color: 'hsl(var(--muted-foreground))', alignItems: 'center' }}>
          <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: 'hsl(var(--foreground))', cursor: 'pointer', padding: 0 }}>Home</button>
          <button onClick={() => navigate('/dashboard')} style={{ background: 'none', border: 'none', color: 'hsl(var(--muted-foreground))', cursor: 'pointer', padding: 0 }}>Dashboard</button>
          <button onClick={() => navigate('/dashboard')} style={{ background: 'none', border: 'none', color: 'hsl(var(--muted-foreground))', cursor: 'pointer', padding: 0 }}>Categories</button>
          <button onClick={() => setModalType('rules')} style={{ background: 'none', border: 'none', color: 'hsl(var(--muted-foreground))', cursor: 'pointer', padding: 0 }}>Rules</button>
          <button onClick={() => setModalType('support')} style={{ background: 'none', border: 'none', color: 'hsl(var(--muted-foreground))', cursor: 'pointer', padding: 0 }}>Support</button>
        </div>

        <button 
          onClick={() => navigate('/dashboard')}
          className="liquid-glass"
          style={{ borderRadius: '9999px', padding: '0.6rem 1.5rem', fontSize: '0.9rem', color: 'hsl(var(--foreground))', cursor: 'pointer', whiteSpace: 'nowrap' }}
        >
          Enter Marketplace
        </button>
      </nav>

      {/* Responsive Hero Content */}
      <main style={{ position: 'relative', zIndex: 10, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 5vw', boxSizing: 'border-box' }}>
        <h1 
          className="animate-fade-rise"
          style={{ fontSize: 'clamp(2.5rem, 6vw, 5.5rem)', lineHeight: 1.05, letterSpacing: '-2px', maxWidth: '1100px', fontWeight: 400, color: 'hsl(var(--foreground))', fontFamily: "var(--font-display)", margin: 0 }}
        >
          Where <em style={{ fontStyle: 'normal', color: 'hsl(var(--muted-foreground))' }}>campus life</em> finds its <em style={{ fontStyle: 'normal', color: 'hsl(var(--muted-foreground))' }}>value.</em>
        </h1>
        
        <p className="animate-fade-rise-delay" style={{ color: 'hsl(var(--muted-foreground))', fontSize: 'clamp(0.95rem, 1.2vw, 1.2rem)', maxWidth: '40rem', marginTop: '2rem', lineHeight: 1.6 }}>
          The exclusive digital marketplace for our university. Buy textbooks, sell electronics, discover student services, and connect with your peers securely.
        </p>
        
        <button 
          onClick={() => navigate('/dashboard')}
          className="animate-fade-rise-delay-2 liquid-glass"
          style={{ borderRadius: '9999px', padding: '1rem 3rem', fontSize: '1rem', color: 'hsl(var(--foreground))', marginTop: '2.5rem', cursor: 'pointer' }}
        >
          Start Browsing
        </button>
      </main>

      {/* Interactive Rules & Support Modals */}
      <AnimatePresence>
        {modalType && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setModalType(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 999, backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="liquid-glass"
              style={{ width: '100%', maxWidth: '500px', padding: '30px', borderRadius: '20px', background: 'rgba(10, 25, 40, 0.75)', border: '1px solid rgba(255,255,255,0.15)', textAlign: 'left', boxSizing: 'border-box' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', margin: 0, fontWeight: 'normal', color: 'white' }}>
                  {modalType === 'rules' ? 'Marketplace Rules' : 'Campus Support'}
                </h2>
                <button onClick={() => setModalType(null)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
              </div>

              {modalType === 'rules' ? (
                <ul style={{ color: 'hsl(var(--muted-foreground))', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.95rem', lineHeight: '1.5' }}>
                  <li>Only verified university students can list or buy items.</li>
                  <li>No illegal items, prohibited substances, or academic dishonesty tools permitted.</li>
                  <li>Always meet in safe, public campus locations for hand-offs.</li>
                  <li>Mark items as "SOLD" once transaction is complete.</li>
                </ul>
              ) : (
                <div style={{ color: 'hsl(var(--muted-foreground))', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.95rem', lineHeight: '1.5' }}>
                  <p>Need help with your account or listing? Reach out directly to the platform administrators:</p>
                  <p style={{ color: 'white', fontWeight: '500' }}>📧 Email: support@campustrade.edu</p>
                  <p style={{ color: 'white', fontWeight: '500' }}>💬 WhatsApp Helpline: +91 98765 43210</p>
                </div>
              )}

              <button 
                onClick={() => setModalType(null)}
                className="liquid-glass"
                style={{ width: '100%', marginTop: '25px', padding: '12px', borderRadius: '10px', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Got it
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}