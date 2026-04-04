import { createRoot } from 'react-dom/client'
import './index.css'

import App from './app/App.tsx'
import { Providers } from './app/Providers.tsx'

const rootElement = document.getElementById('root')
if (rootElement) {
  createRoot(rootElement).render(
    <Providers>
      <App />
    </Providers>
  )
} else {
  throw new Error("Root element with id 'root' not found.")
}
