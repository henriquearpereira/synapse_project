import React, { useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import Loader from './components/Loader';

const Auth: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/login', { username, password });
      localStorage.setItem('token', response.data.token);
      window.location.href = '/';
    } catch (error) {
      console.error('Login failed:', error);
      alert('Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/register', { username, password });
      localStorage.setItem('token', response.data.token);
      window.location.href = '/';
    } catch (error) {
      console.error('Registration failed:', error);
      alert('Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="Auth">
      <h1>SynapSpark - Login</h1>
      <motion.input
        whileHover={{ scale: 1.02 }}
        whileFocus={{ scale: 1.02 }}
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <motion.input
        whileHover={{ scale: 1.02 }}
        whileFocus={{ scale: 1.02 }}
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <motion.button whileHover={{ scale: 1.05 }} onClick={handleLogin}>Login</motion.button>
      <motion.button whileHover={{ scale: 1.05 }} onClick={handleRegister}>Register</motion.button>
      {loading && <Loader />}
    </div>
  );
};

export default Auth;
