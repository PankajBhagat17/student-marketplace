// client/src/pages/Landing.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export default function Landing() {
  const navigate = useNavigate();
  const [modalType, setModalType] = useState<'about' | null>(null);

  return (
    <div style={{ position: 'relative', minHeight: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', overflowX: 'hidden', boxSizing: 'border-box' }}>
      
      {/* FIXED VIDEO BACKGROUND */}
      <video
        src="/campus-bg.mp4.mp4"
        autoPlay loop muted playsInline
        style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', objectFit: 'cover', zIndex: 0 }}
      />
      {/* Dark Overlay */}
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(5, 15, 25, 0.45)', zIndex: 1 }} />

      {/* Modern Single-Row Desktop / Responsive Navbar */}
      <nav style={{ position: 'relative', zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '25px 4vw', width: '100%', boxSizing: 'border-box' }}>
        
        {/* Logo */}
        <div style={{ fontSize: 'clamp(1.8rem, 2.5vw, 2.3rem)', letterSpacing: '-0.03em', color: 'hsl(var(--foreground))', fontFamily: "var(--font-display)", fontWeight: 500 }}>
          CampusTrade
        </div>

        {/* Center Links (Home, Dashboard, About) */}
        <div style={{ display: 'flex', gap: '2.5rem', fontSize: '1rem', color: 'hsl(var(--muted-foreground))', alignItems: 'center' }}>
          <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: 'hsl(var(--foreground))', cursor: 'pointer', padding: 0, fontWeight: 500, fontSize: '1rem' }}>Home</button>
          <button onClick={() => navigate('/dashboard')} style={{ background: 'none', border: 'none', color: 'hsl(var(--muted-foreground))', cursor: 'pointer', padding: 0, fontSize: '1rem' }}>Dashboard</button>
          <button onClick={() => setModalType('about')} style={{ background: 'none', border: 'none', color: 'hsl(var(--muted-foreground))', cursor: 'pointer', padding: 0, fontSize: '1rem' }}>About</button>
        </div>

        {/* Right Action Button */}
        <button 
          onClick={() => navigate('/login')}
          className="liquid-glass"
          style={{ borderRadius: '9999px', padding: '0.6rem 1.6rem', fontSize: '0.95rem', color: 'hsl(var(--foreground))', cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: 'bold' }}
        >
          Sign In ›
        </button>
      </nav>

      {/* Perfectly Centered Hero Content */}
      <main style={{ position: 'relative', zIndex: 10, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 5vw', boxSizing: 'border-box', marginTop: '-40px' }}>
        <h1 
          className="animate-fade-rise"
          style={{ fontSize: 'clamp(2.5rem, 6vw, 5.2rem)', lineHeight: 1.08, letterSpacing: '-1.5px', maxWidth: '1050px', fontWeight: 400, color: 'hsl(var(--foreground))', fontFamily: "var(--font-display)", margin: 0 }}
        >
          Where <em style={{ fontStyle: 'normal', color: 'hsl(var(--muted-foreground))' }}>campus life</em> finds its <em style={{ fontStyle: 'normal', color: 'hsl(var(--muted-foreground))' }}>value.</em>
        </h1>
        
        <p className="animate-fade-rise-delay" style={{ color: 'hsl(var(--muted-foreground))', fontSize: 'clamp(1rem, 1.2vw, 1.15rem)', maxWidth: '38rem', marginTop: '1.75rem', lineHeight: 1.6 }}>
          The exclusive digital marketplace for our university. Buy textbooks, sell electronics, discover student services, and connect with your peers securely.
        </p>
        
        <button 
          onClick={() => navigate('/dashboard')}
          className="animate-fade-rise-delay-2 liquid-glass"
          style={{ borderRadius: '9999px', padding: '1rem 3rem', fontSize: '1rem', color: 'hsl(var(--foreground))', marginTop: '2.5rem', cursor: 'pointer', fontWeight: 'bold' }}
        >
          Start Browsing
        </button>
      </main>

      {/* About Modal */}
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
              style={{ width: '100%', maxWidth: '450px', padding: '25px', borderRadius: '20px', background: 'rgba(10, 25, 40, 0.85)', border: '1px solid rgba(255,255,255,0.15)', textAlign: 'left', boxSizing: 'border-box' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', margin: 0, fontWeight: 'normal', color: 'white' }}>
                  About CampusTrade
                </h2>
                <button onClick={() => setModalType(null)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
              </div>

              <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.9rem', lineHeight: '1.6', margin: '0 0 20px 0' }}>
                CampusTrade is built exclusively for students to safely buy and sell textbooks, electronics, and dorm essentials within their university ecosystem. Secure, fast, and student-run.
              </p>

              <button 
                onClick={() => setModalType(null)}
                className="liquid-glass"
                style={{ width: '100%', padding: '12px', borderRadius: '10px', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}