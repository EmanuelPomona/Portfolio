// Owner: agent/frontend. Entry point.
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Latin subsets only (TASK-101). Each @font-face uses font-display: swap.
import '@fontsource/instrument-serif/latin-400.css';
import '@fontsource/instrument-serif/latin-400-italic.css';
import './styles/fonts.css';
import './styles/tokens.css';
import './styles/global.css';
import { App } from './app/App';

const root = document.getElementById('root');
if (!root) throw new Error('#root missing from index.html');
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
