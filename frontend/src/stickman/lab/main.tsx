// Owner: agent/stickman. Entry for the dev-only lab page (frontend/stickman-lab.html).
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/instrument-serif/400.css';
import '@fontsource/instrument-serif/400-italic.css';
import '@fontsource-variable/manrope';
import '../../styles/tokens.css';
import { Lab } from './Lab';

const root = document.getElementById('root');
if (!root) throw new Error('#root missing from stickman-lab.html');
createRoot(root).render(
  <StrictMode>
    <Lab />
  </StrictMode>,
);
