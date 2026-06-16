import { createRoot } from 'react-dom/client';
import { DevHarness } from './DevHarness';

// No StrictMode: the harness attaches real shadow roots in an effect, which
// must not run twice.
const root = document.getElementById('root');
if (root) createRoot(root).render(<DevHarness />);
