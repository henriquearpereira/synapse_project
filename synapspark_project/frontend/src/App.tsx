import React, { useState, useEffect } from 'react';
import axios from 'axios';
import useDarkMode from 'use-dark-mode';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { motion } from 'framer-motion';
import StepDisplay from './components/StepDisplay';
import History from './components/History';
import Loader from './components/Loader';
import './App.css';

interface ReformulationResult {
  intent: string;
  context: string;
  emotion: string;
  expanded: string;
  final_prompt: string;
}

interface HistoryItem {
  prompt: string;
  final_prompt: string;
}

const App: React.FC = () => {
  const darkMode = useDarkMode(false);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState('deepseek');
  const [params, setParams] = useState({ temperature: 0.7, top_p: 0.9, max_tokens: 150 });
  const [result, setResult] = useState<ReformulationResult | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [score, setScore] = useState<number | null>(null);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (result && step < 5) {
      const timer = setTimeout(() => setStep(step + 1), 500);
      return () => clearTimeout(timer);
    }
  }, [result, step]);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/login', { username, password });
      localStorage.setItem('token', response.data.token);
      setToken(response.data.token);
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
      setToken(response.data.token);
    } catch (error) {
      console.error('Registration failed:', error);
      alert('Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  const handleReformulate = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        'http://localhost:5000/reformulate',
        { prompt, model, params },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResult(response.data);
      setHistory([...history, { prompt, final_prompt: response.data.final_prompt }]);
      setStep(0);
    } catch (error) {
      console.error('Error reformulating prompt:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async () => {
    if (!result || score === null) return;
    setLoading(true);
    try {
      await axios.post(
        'http://localhost:5000/feedback',
        { prompt, final_prompt: result.final_prompt, score },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Feedback enviado!');
    } catch (error) {
      console.error('Error sending feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className={`App ${darkMode.value ? 'dark-mode' : ''}`}>
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
  }

  return (
    <div className={`App ${darkMode.value ? 'dark-mode' : ''}`}>
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        SynapSpark
      </motion.h1>
      <motion.button whileHover={{ scale: 1.05 }} onClick={darkMode.toggle}>Toggle Dark Mode</motion.button>
      <motion.button whileHover={{ scale: 1.05 }} onClick={handleLogout}>Logout</motion.button>
      <div>
        <motion.textarea
          whileHover={{ scale: 1.01 }}
          placeholder="Digite seu prompt..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={5}
          cols={50}
        />
      </div>
      <div>
        <label>Modelo: </label>
        <motion.select
          whileHover={{ scale: 1.02 }}
          value={model}
          onChange={(e) => setModel(e.target.value)}
        >
          <option value="deepseek">DeepSeek-Coder-V2</option>
          <option value="llama">LLaMA 3.1</option>
          <option value="gemma">Gemma 2</option>
          <option value="claude">Claude 3.5</option>
          <option value="openai">OpenAI GPT-3.5</option>
          <option value="o1-mini">o1-mini (Simulado)</option>
        </motion.select>
      </div>
      <div>
        <label>Temperatura: {params.temperature}</label>
        <motion.input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={params.temperature}
          onChange={(e) => setParams({ ...params, temperature: Number(e.target.value) })}
          whileHover={{ scale: 1.02 }}
        />
      </div>
      <div>
        <label>Top P: {params.top_p}</label>
        <motion.input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={params.top_p}
          onChange={(e) => setParams({ ...params, top_p: Number(e.target.value) })}
          whileHover={{ scale: 1.02 }}
        />
      </div>
      <div>
        <label>Max Tokens: {params.max_tokens}</label>
        <motion.input
          type="range"
          min="50"
          max="500"
          step="10"
          value={params.max_tokens}
          onChange={(e) => setParams({ ...params, max_tokens: Number(e.target.value) })}
          whileHover={{ scale: 1.02 }}
        />
      </div>
      <motion.button whileHover={{ scale: 1.05 }} onClick={handleReformulate}>Reformular Prompt</motion.button>

      {loading && <Loader />}
      {result && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h2>Resultado</h2>
          {step >= 1 && <StepDisplay label="Intenção" value={result.intent} delay={0} />}
          {step >= 2 && <StepDisplay label="Contexto" value={result.context} delay={0.5} />}
          {step >= 3 && <StepDisplay label="Emoção" value={result.emotion} delay={1} />}
          {step >= 4 && <StepDisplay label="Expansão" value={result.expanded} delay={1.5} />}
          {step >= 5 && (
            <>
              <StepDisplay label="Prompt Final" value={result.final_prompt} delay={2} />
              <CopyToClipboard text={result.final_prompt}>
                <motion.button whileHover={{ scale: 1.05 }}>Copiar Prompt Final</motion.button>
              </CopyToClipboard>
            </>
          )}

          {step >= 5 && (
            <div>
              <h3>Feedback</h3>
              <motion.select
                whileHover={{ scale: 1.02 }}
                onChange={(e) => setScore(Number(e.target.value))}
                defaultValue=""
              >
                <option value="" disabled>Selecione uma nota (1-5)</option>
                {[1, 2, 3, 4, 5].map((num) => (
                  <option key={num} value={num}>{num}</option>
                ))}
              </motion.select>
              <motion.button
                whileHover={{ scale: 1.05 }}
                onClick={handleFeedback}
                disabled={score === null}
              >
                Enviar Feedback
              </motion.button>
            </div>
          )}
        </motion.div>
      )}

      <History history={history} />
    </div>
  );
};

export default App;