import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider, useAuth } from "./context/AuthContext"
import Login from "./components/Login"
import Chat from "./components/Chat"
import "./App.css"

// unlock Web Audio API on first user interaction
const unlockAudio = () => {
  const AudioContext = window.AudioContext || window.webkitAudioContext
  if (AudioContext) {
    const ctx = new AudioContext()
    ctx.resume()
  }
  document.removeEventListener("click", unlockAudio)
}
document.addEventListener("click", unlockAudio)

const PrivateRoute = ({ children }) => {
  const { token } = useAuth()
  return token ? children : <Navigate to="/login" />
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Chat />
              </PrivateRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App