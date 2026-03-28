import { useState, useRef } from "react"
import axios from "axios"
import { useAuth } from "../context/AuthContext"
import uploadFile from "../utils/uploadFile"

const CLOUD_NAME = "dz3lqqoxb"
const UPLOAD_PRESET = "chatapp-preset"

function ProfileModal({ onClose }) {
  const { user, token, updateUser } = useAuth()
  const [username, setUsername] = useState(user.username)
  const [avatarPreview, setAvatarPreview] = useState(user.avatar || null)
  const [avatarFile, setAvatarFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const fileRef = useRef()

  const handleAvatarSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      let avatarUrl = user.avatar || ""

      // upload new avatar if selected
      if (avatarFile) {
        const uploaded = await uploadFile(avatarFile, CLOUD_NAME, UPLOAD_PRESET)
        avatarUrl = uploaded.fileUrl
      }

      const res = await axios.put(
        "http://localhost:5000/api/users/me",
        { username, avatar: avatarUrl },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      updateUser({
        username: res.data.username,
        avatar: res.data.avatar
      })

      setSuccess(true)
      setTimeout(() => { setSuccess(false); onClose() }, 1200)
    } catch (err) {
      setError(err.response?.data?.error || "Update failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>

        <div style={styles.modalHeader}>
          <span style={styles.modalTitle}>Your profile</span>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSave}>
          {/* Avatar upload */}
          <div style={styles.avatarSection}>
            <div
              style={styles.avatarWrapper}
              onClick={() => fileRef.current.click()}
              onMouseEnter={e => e.currentTarget.querySelector('[data-overlay]').style.opacity = 1}
              onMouseLeave={e => e.currentTarget.querySelector('[data-overlay]').style.opacity = 0}
            >
              {avatarPreview ? (
                <img src={avatarPreview} alt="avatar" style={styles.avatarImg} />
              ) : (
                <div style={styles.avatarPlaceholder}>
                  {username[0].toUpperCase()}
                </div>
              )}
              <div style={styles.avatarOverlay} data-overlay="true">change</div>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleAvatarSelect}
            />
            <p style={styles.avatarHint}>Click to upload photo</p>
          </div>

          {/* Username */}
          <div style={styles.field}>
            <label style={styles.label}>Username</label>
            <input
              style={styles.input}
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Enter username"
              required
              minLength={3}
            />
          </div>

          {/* Email (read only) */}
          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              style={{ ...styles.input, opacity: 0.6 }}
              value={user.email}
              readOnly
            />
          </div>

          {error && <p style={styles.error}>{error}</p>}
          {success && <p style={styles.successMsg}>Profile updated!</p>}

          <button
            style={{
              ...styles.saveBtn,
              opacity: loading ? 0.7 : 1
            }}
            type="submit"
            disabled={loading}
          >
            {loading ? "Saving..." : "Save changes"}
          </button>
        </form>
      </div>
    </div>
  )
}

const styles = {
  overlay: {
    position: "absolute",
    inset: 0,
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000
  },
  modal: {
    background: "#fff",
    borderRadius: "16px",
    width: "100%",
    maxWidth: "400px",
    padding: "24px",
    boxShadow: "0 8px 32px rgba(0,0,0,0.18)"
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px"
  },
  modalTitle: { fontSize: "17px", fontWeight: "600", color: "#1a1a1a" },
  closeBtn: {
    background: "none",
    border: "none",
    fontSize: "18px",
    cursor: "pointer",
    color: "#888",
    padding: "2px 6px",
    borderRadius: "6px"
  },
  avatarSection: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    marginBottom: "20px",
    gap: "8px"
  },
  avatarWrapper: {
    position: "relative",
    width: "88px",
    height: "88px",
    borderRadius: "50%",
    cursor: "pointer",
    overflow: "hidden"
  },
  avatarImg: {
    width: "88px",
    height: "88px",
    borderRadius: "50%",
    objectFit: "cover"
  },
  avatarPlaceholder: {
    width: "88px",
    height: "88px",
    borderRadius: "50%",
    background: "#4f46e5",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "32px",
    fontWeight: "700"
  },
  avatarOverlay: {
    position: "absolute",
    inset: 0,
    background: "rgba(0,0,0,0.45)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "13px",
    fontWeight: "500",
    opacity: 0,
    transition: "opacity 0.2s",
    borderRadius: "50%"
  },
  avatarHint: { fontSize: "12px", color: "#999", margin: 0 },
  field: { marginBottom: "14px" },
  label: {
    display: "block",
    fontSize: "12px",
    fontWeight: "600",
    color: "#555",
    marginBottom: "5px",
    textTransform: "uppercase",
    letterSpacing: "0.05em"
  },
  input: {
    width: "100%",
    padding: "10px 14px",
    borderRadius: "8px",
    border: "1px solid #e0e0e0",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
    background: "#fafafa"
  },
  error: { color: "#dc2626", fontSize: "13px", marginBottom: "10px" },
  successMsg: { color: "#16a34a", fontSize: "13px", marginBottom: "10px" },
  saveBtn: {
    width: "100%",
    padding: "11px",
    background: "#4f46e5",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    marginTop: "4px"
  }
}

export default ProfileModal
