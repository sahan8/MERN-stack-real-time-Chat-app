import { useState } from "react"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

function Login() {
  const [isRegister, setIsRegister] = useState(false)
  const [form, setForm] = useState({ username: "", email: "", password: "" })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const endpoint = isRegister
  ? "http://localhost:5000/api/auth/register"
  : "http://localhost:5000/api/auth/login"
      const payload = isRegister
        ? { username: form.username, email: form.email, password: form.password }
        : { email: form.email, password: form.password }

      const res = await axios.post(endpoint, payload)
      login(res.data.user, res.data.token)
      navigate("/")
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>
          {isRegister ? "Create account" : "Welcome back"}
        </h2>

        {error && <p style={styles.error}>{error}</p>}

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <input
              style={styles.input}
              name="username"
              placeholder="Username"
              value={form.username}
              onChange={handleChange}
              required
            />
          )}
          <input
            style={styles.input}
            name="email"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            required
          />
          <input
            style={styles.input}
            name="password"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
          />
          <button style={styles.button} type="submit" disabled={loading}>
            {loading ? "Please wait..." : isRegister ? "Register" : "Login"}
          </button>
        </form>

        <p style={styles.toggle}>
          {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
          <span
            style={styles.link}
            onClick={() => { setIsRegister(!isRegister); setError("") }}
          >
            {isRegister ? "Login" : "Register"}
          </span>
        </p>
      </div>
    </div>
  )
}

const styles = {
  container: {
    minHeight: "100vh", display: "flex",
    alignItems: "center", justifyContent: "center",
    backgroundColor: "#f0f2f5"
  },
  card: {
    background: "#fff", padding: "2rem",
    borderRadius: "12px", width: "100%",
    maxWidth: "400px", boxShadow: "0 2px 16px rgba(0,0,0,0.08)"
  },
  title: { margin: "0 0 1.5rem", fontSize: "22px", fontWeight: "500" },
  input: {
    display: "block", width: "100%", padding: "10px 14px",
    marginBottom: "12px", borderRadius: "8px",
    border: "1px solid #ddd", fontSize: "14px",
    boxSizing: "border-box", outline: "none"
  },
  button: {
    width: "100%", padding: "11px",
    background: "#4f46e5", color: "#fff",
    border: "none", borderRadius: "8px",
    fontSize: "14px", fontWeight: "500",
    cursor: "pointer", marginTop: "4px"
  },
  error: { color: "#dc2626", fontSize: "13px", marginBottom: "12px" },
  toggle: { textAlign: "center", fontSize: "13px", marginTop: "1rem", color: "#666" },
  link: { color: "#4f46e5", cursor: "pointer", fontWeight: "500" }
}

export default Login