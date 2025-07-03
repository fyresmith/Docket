import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Initialize timer service worker for background timer management
import { timerServiceWorker } from './services/timerServiceWorker'

// The service worker manager will handle registration and initialization
console.log('Timer service worker manager initialized:', timerServiceWorker.isSupported())

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
