import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { CartProvider } from './context/CartProvider.jsx'
import { ChatbotProvider } from './context/ChatbotProvider.jsx'
import { WishlistProvider } from './context/WishlistProvider.jsx'
import { AuthProvider } from './context/AuthProvider.jsx'
import { ProductCatalogProvider } from './context/ProductCatalogProvider.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ProductCatalogProvider>
          <WishlistProvider>
            <CartProvider>
              <ChatbotProvider>
                <App />
              </ChatbotProvider>
            </CartProvider>
          </WishlistProvider>
        </ProductCatalogProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
