import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import ViewerPage from './pages/ViewerPage'
import EditorPage from './pages/EditorPage'
import ToastContainer from './components/ui/ToastContainer'

function App() {
  return (
    <>
      <Routes>
        {/* Ana sayfa */}
        <Route path="/" element={<HomePage />} />
        
        {/* Proje Viewer modu - /:projectId */}
        <Route path="/:projectId" element={<ViewerPage />} />
        
        {/* Proje Editor modu - /:projectId/editor */}
        <Route path="/:projectId/editor" element={<EditorPage />} />
      </Routes>
      
      {/* Global Toast Notifications */}
      <ToastContainer />
    </>
  )
}

export default App
