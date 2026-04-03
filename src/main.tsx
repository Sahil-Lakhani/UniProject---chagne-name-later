import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

// StrictMode removed: html5-qrcode is not compatible with the double-mount
// behaviour React StrictMode uses in development.
createRoot(document.getElementById('root')!).render(<App />)
