import { createRoot, hydrateRoot } from 'react-dom/client'
import App from './App'
import './index.css'

// The production build is prerendered (scripts/prerender.mjs), so hydrate when there is markup.
// No StrictMode: its double-run of effects in development would end the intro before it plays.
const root = document.getElementById('root')!
if (root.firstElementChild) hydrateRoot(root, <App />)
else createRoot(root).render(<App />)
