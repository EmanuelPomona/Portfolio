// Owner: agent/frontend. Entry point.
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Latin subsets only (TASK-101). Each @font-face uses font-display: swap.
import '@fontsource/instrument-serif/latin-400.css';
import '@fontsource/instrument-serif/latin-400-italic.css';
import './styles/fonts.css';
import './styles/tokens.css';
import './styles/global.css';
import { preload } from 'react-dom';
// The same file instrument-serif's latin-400.css points at, so Vite gives both one hashed URL.
import nameFontUrl from '@fontsource/instrument-serif/files/instrument-serif-latin-400-normal.woff2?url';
import { App } from './app/App';
import { site } from './content';
import { preloadHeroImage } from './sections/Hero/Hero';

// Start the two things the first screen waits on before React renders: the face the name is set
// in (otherwise discovered only when the name is laid out) and the hero photograph.
preload(nameFontUrl, { as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' });
preloadHeroImage(site);

const root = document.getElementById('root');
if (!root) throw new Error('#root missing from index.html');
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
