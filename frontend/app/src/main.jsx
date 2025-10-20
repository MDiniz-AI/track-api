import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// 1. Importe o nosso AuthProvider
import { AuthProvider } from './contexts/AuthContext.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* 2. "Abrace" o <App /> com o <AuthProvider> */}
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
)