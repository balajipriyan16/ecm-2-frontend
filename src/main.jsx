import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import LoginPage from "./components/LoginPage.jsx"
import { BrowserRouter, Routes, Route } from "react-router-dom"


createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
)
