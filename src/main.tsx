import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Bundle the Inter weights the UI uses so it renders identically offline.
import '@fontsource/inter/400.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import '@fontsource/inter/800.css'
import './index.css'
import App from '@/App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
