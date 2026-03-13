import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

// Init dark mode from localStorage or system preference
const stored = localStorage.getItem('sidequest-dark');
const dark =
  stored !== null
    ? stored === 'true'
    : false;
document.documentElement.classList.toggle('dark', dark);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
