// client/src/pages/Register.tsx
import React, { useState } from 'react';

const Register = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState(''); // <-- NEW STATE
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await fetch('https://student-marketplace-ho49.onrender.com/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          email: email,
          password: password,
          phone_number: phoneNumber, // <-- SEND TO BACKEND
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed.');
      }

      setSuccess('Account created successfully! You can now go log in.');
      
      // Clear the form
      setFirstName('');
      setLastName('');
      setEmail('');
      setPassword('');
      setPhoneNumber(''); // <-- CLEAR FIELD

    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '50px' }}>
      <div style={{ background: '#1e1e24', padding: '40px', borderRadius: '8px', color: 'white', width: '350px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Sign Up</h2>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label>First Name</label>
            <input type="text" required value={firstName} onChange={(e) => setFirstName(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: '5px', borderRadius: '4px', border: 'none', background: '#2b2b36', color: 'white' }} />
          </div>

          <div>
            <label>Last Name</label>
            <input type="text" required value={lastName} onChange={(e) => setLastName(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: '5px', borderRadius: '4px', border: 'none', background: '#2b2b36', color: 'white' }} />
          </div>

          {/* --- NEW PHONE NUMBER INPUT --- */}
          <div>
            <label>WhatsApp Number (with Country Code)</label>
            <input 
              type="text" 
              required
              placeholder="e.g. 919876543210"
              value={phoneNumber} 
              onChange={(e) => setPhoneNumber(e.target.value)} 
              style={{ width: '100%', padding: '8px', marginTop: '5px', borderRadius: '4px', border: 'none', background: '#2b2b36', color: 'white' }}
            />
          </div>

          <div>
            <label>Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: '5px', borderRadius: '4px', border: 'none', background: '#2b2b36', color: 'white' }} />
          </div>

          <div>
            <label>Password</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: '5px', borderRadius: '4px', border: 'none', background: '#2b2b36', color: 'white' }} />
          </div>

          {error && <div style={{ color: '#ff6b6b', background: '#3b1f1f', padding: '10px', borderRadius: '4px', textAlign: 'center' }}>{error}</div>}
          {success && <div style={{ color: '#51cf66', background: '#1f3b24', padding: '10px', borderRadius: '4px', textAlign: 'center' }}>{success}</div>}

          <button type="submit" style={{ padding: '12px', background: '#b185ff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', marginTop: '10px' }}>
            Create Account
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px' }}>
          Already have an account? <a href="/login" style={{ color: '#b185ff', textDecoration: 'none' }}>Log In</a>
        </p>
      </div>
    </div>
  );
};

export default Register;