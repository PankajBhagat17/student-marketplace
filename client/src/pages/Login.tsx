// client/src/pages/Login.tsx
import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast'; // <-- NEW: Import Toast

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false); // <-- NEW: Loading state
  
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); 
    setIsLoading(true); // Disable the button

    // 1. Instantly show a loading popup
    const toastId = toast.loading('Verifying credentials, please wait...');

    try {
      const response = await axios.post('https://student-marketplace-ho49.onrender.com/api/auth/login', {
        email,
        password,
      });

      localStorage.setItem('token', response.data.token);
      
      // 2. Turn the loading popup into a success message
      toast.success('Welcome back to the marketplace!', { id: toastId });
      
      navigate('/dashboard');
      
    } catch (err: any) {
      setIsLoading(false); // Re-enable the button
      let errorMessage = 'Something went wrong trying to connect to the server.';
      
      if (err.response && err.response.data && err.response.data.error) {
        errorMessage = err.response.data.error;
      }
      
      setError(errorMessage);
      
      // 3. Turn the loading popup into an error message
      toast.error('Login failed.', { id: toastId });
    }
  };

  return (
    <div className="login-container">
      {/* --- NEW: Toaster Component for UI popups --- */}
      <Toaster position="bottom-right" toastOptions={{ style: { background: '#333', color: '#fff', borderRadius: '8px' } }} />
      
      <div className="login-card">
        <h2>Student Marketplace</h2>
        <p>Please log in with your email address.</p>
        
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input 
              type="email" 
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@university.edu" 
              required 
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input 
              type="password" 
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" 
              required 
            />
          </div>

          {error && <div className="alert-error">{error}</div>}

          {/* --- NEW: Dynamic Loading Button --- */}
          <button type="submit" className="btn-primary" disabled={isLoading} style={{ opacity: isLoading ? 0.7 : 1, cursor: isLoading ? 'not-allowed' : 'pointer' }}>
            {isLoading ? '⏳ Logging in...' : 'Log In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#a0a0b0' }}>
          Don't have an account? <Link to="/register" style={{ color: '#b185ff', textDecoration: 'none' }}>Sign Up</Link>
        </p>
        
      </div>
    </div>
  );
}