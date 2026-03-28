import { useState } from "react"

function RoomList({ rooms, activeRoom, onlineUsers, user, onJoin, onCreate, onLogout, onDM, unreadDMs, onProfileClick, muted, onToggleMute }) {
  const [newRoom, setNewRoom] = useState("")
  const [showForm, setShowForm] = useState(false)

  const handleCreate = (e) => {
    e.preventDefault()
    if (!newRoom.trim()) return
    onCreate(newRoom.trim(), "")
    setNewRoom("")
    setShowForm(false)
  }

  return (
    <div style={styles.sidebar}>
      <div style={styles.header}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={styles.appName}>ChatApp</span>
          {Object.values(unreadDMs || {}).some(v => v > 0) && (
            <span style={{
              width: "8px", height: "8px",
              borderRadius: "50%", background: "#ef4444",
              display: "inline-block"
            }} />
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            style={{
              ...styles.muteBtn,
              opacity: muted ? 0.4 : 1
            }}
            onClick={onToggleMute}
            title={muted ? "Unmute sounds" : "Mute sounds"}
          >
            {muted ? "🔇" : "🔔"}
          </button>
          <button style={styles.logoutBtn} onClick={onLogout}>Logout</button>
        </div>
      </div>

      <div
        style={{ ...styles.userInfo, cursor: "pointer" }}
        onClick={onProfileClick}
        title="Edit profile"
      >
        {user.avatar ? (
          <img src={user.avatar} alt="avatar" style={{
            width: "34px", height: "34px",
            borderRadius: "50%", objectFit: "cover", flexShrink: 0
          }} />
        ) : (
          <div style={styles.avatar}>
            {user.username[0].toUpperCase()}
          </div>
        )}
        <span style={styles.username}>{user.username}</span>
        <span style={styles.onlineDot} />
      </div>

      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <span>Rooms</span>
          <button style={styles.addBtn} onClick={() => setShowForm(!showForm)}>+</button>
        </div>

        {showForm && (
          <form onSubmit={handleCreate} style={styles.form}>
            <input
              style={styles.input}
              placeholder="Room name"
              value={newRoom}
              onChange={(e) => setNewRoom(e.target.value)}
              autoFocus
            />
            <button style={styles.createBtn} type="submit">Create</button>
          </form>
        )}

        <div style={styles.roomList}>
          {rooms.map((room) => (
            <div
              key={room._id}
              style={{
                ...styles.roomItem,
                ...(activeRoom?._id === room._id ? styles.activeRoom : {})
              }}
              onClick={() => onJoin(room)}
            >
              <span style={styles.hash}>#</span> {room.name}
            </div>
          ))}
        </div>
      </div>

      <div style={styles.onlineSection}>
        <div style={styles.sectionHeader}>
          <span>Online — {onlineUsers.length}</span>
        </div>
        {onlineUsers.map((u, i) => {
          const unread = unreadDMs?.[u.userId] || 0
          const isMe = u.userId === user.id

          return (
            <div
              key={i}
              style={{
                ...styles.onlineUser,
                cursor: !isMe ? "pointer" : "default",
                borderRadius: "6px",
                transition: "background 0.15s"
              }}
              onClick={() => !isMe && onDM(u)}
              onMouseEnter={e => { if (!isMe) e.currentTarget.style.background = "#2d2f33" }}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <span style={styles.onlineDot} />
              <span style={{ flex: 1 }}>{u.username}</span>

              {!isMe && unread > 0 && (
                <span style={styles.badge}>{unread > 9 ? "9+" : unread}</span>
              )}
              {!isMe && unread === 0 && (
                <span style={{ fontSize: "11px", color: "#555" }}>DM</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
  
}

const styles = {
  sidebar: {
    width: "260px",
    background: "#1e1f22",
    color: "#fff",
    display: "flex",
    flexDirection: "column",
    height: "100vh"
  },
  header: {
    padding: "16px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #2d2f33",
    background: "#18191c"
  },
  appName: { fontWeight: "700", fontSize: "16px", color: "#fff" },
  muteBtn: {
    background: "none",
    border: "none",
    fontSize: "16px",
    cursor: "pointer",
    padding: "2px",
    borderRadius: "4px",
    transition: "opacity 0.2s"
  },
  logoutBtn: {
    background: "none",
    border: "1px solid #444",
    color: "#aaa",
    cursor: "pointer",
    fontSize: "11px",
    padding: "4px 10px",
    borderRadius: "6px",
    transition: "all 0.2s"
  },
  userInfo: {
    padding: "12px 16px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    borderBottom: "1px solid #2d2f33",
    background: "#18191c"
  },
  avatar: {
    width: "34px",
    height: "34px",
    borderRadius: "50%",
    background: "#4f46e5",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
    fontWeight: "700",
    flexShrink: 0
  },
  username: { fontSize: "14px", fontWeight: "500", flex: 1 },
  onlineDot: {
    width: "9px",
    height: "9px",
    borderRadius: "50%",
    background: "#22c55e",
    display: "inline-block",
    flexShrink: 0
  },
  section: { padding: "16px 0 8px", flex: 1, overflowY: "auto" },
  sectionHeader: {
    padding: "0 16px 8px",
    fontSize: "11px",
    color: "#72767d",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "0.07em",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  addBtn: {
    background: "none",
    border: "none",
    color: "#72767d",
    cursor: "pointer",
    fontSize: "20px",
    lineHeight: 1,
    padding: "0 2px",
    borderRadius: "4px",
    transition: "color 0.15s"
  },
  form: { padding: "0 12px 10px" },
  input: {
    width: "100%",
    padding: "8px 10px",
    borderRadius: "6px",
    border: "1px solid #3d3f44",
    background: "#2d2f33",
    color: "#fff",
    fontSize: "13px",
    boxSizing: "border-box",
    marginBottom: "6px",
    outline: "none"
  },
  createBtn: {
    width: "100%",
    padding: "7px",
    background: "#4f46e5",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "600"
  },
  roomList: { padding: "0 8px" },
  roomItem: {
    padding: "7px 10px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
    color: "#96989d",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    transition: "all 0.15s",
    marginBottom: "1px"
  },
  activeRoom: { background: "#4f46e5", color: "#fff" },
  hash: { opacity: 0.5, fontSize: "16px", fontWeight: "600" },
  onlineSection: { padding: "8px 0 16px", borderTop: "1px solid #2d2f33" },
  onlineUser: {
    padding: "5px 16px",
    fontSize: "13px",
    color: "#96989d",
    display: "flex",
    alignItems: "center",
    gap: "8px"
  },
  badge: {
    minWidth: "18px",
    height: "18px",
    borderRadius: "9px",
    background: "#ef4444",
    color: "#fff",
    fontSize: "11px",
    fontWeight: "700",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0 5px",
    animation: "pulse 1s ease-in-out"
  }
}

export default RoomList