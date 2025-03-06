import React from 'react';
import { motion } from 'framer-motion';

interface HistoryItem {
  prompt: string;
  final_prompt: string;
}

interface HistoryProps {
  history: HistoryItem[];
}

const History: React.FC<HistoryProps> = ({ history }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    style={{ marginTop: '20px' }}
  >
    <h3>Histórico</h3>
    {history.length === 0 ? (
      <p>Nenhum prompt reformulado ainda.</p>
    ) : (
      history.map((item, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          style={{ margin: '10px 0', padding: '10px', border: '1px solid #ccc' }}
        >
          <p><strong>Prompt Original:</strong> {item.prompt}</p>
          <p><strong>Prompt Final:</strong> {item.final_prompt}</p>
        </motion.div>
      ))
    )}
  </motion.div>
);

export default History;