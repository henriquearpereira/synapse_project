import React from 'react';
import { motion } from 'framer-motion';

const Loader: React.FC = () => (
  <motion.div
    animate={{ rotate: 360 }}
    transition={{ repeat: Infinity, duration: 1 }}
    style={{
      width: '40px',
      height: '40px',
      border: '4px solid #007bff',
      borderTop: '4px solid transparent',
      borderRadius: '50%',
      margin: '20px auto'
    }}
  />
);

export default Loader;