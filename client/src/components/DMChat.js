import { useState, useEffect, useRef } from "react"
import axios from "axios"

function DMChat({ dmUser, socket, user, token }) {
  const [messages, setMessages] = useState([])
  const [text, setText] = useState("")
  const [typing, setTyping] = useState("")
  const bottomRef = useRef(null)
  let typingTimer

  useEffect(() => {
    if (!socket || !dmUser) return

    const loadHistory = async () => {
      if (!token || !dmUser) return
      try {
        const res = await axios.get(
          `http://localhost:5000/api/dm/${dmUser.userId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
        setMessages(res.data)
      } catch (err) {
        console.log("DM history error:", err)
      }
    }

    loadHistory()

    socket.on("receive_dm", (msg) => {
      const myConvId = [user.id, dmUser.userId].sort().join("_")
      if (msg.conversationId === myConvId) {
        setMessages((prev) => [...prev, msg])
      }
    })

    socket.on("dm_typing", ({ fromId, username }) => {
      if (fromId === dmUser.userId) setTyping(`${username} is typing...`)
    })
    socket.on("dm_stop_typing", ({ fromId }) => {
      if (fromId === dmUser.userId) setTyping("")
    })

    return () => {
      socket.off("receive_dm")
      socket.off("dm_typing")
      socket.off("dm_stop_typing")
    }
  }, [dmUser, socket, user, token])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const sendDM = (e) => {
    e.preventDefault()
    if (!text.trim() || !socket) return

    socket.emit("send_dm", {
      senderId: user.id,
      senderName: user.username,
      receiverId: dmUser.userId,
      text: text.trim()
    })

    socket.emit("dm_stop_typing", {
      toId: dmUser.userId,
      fromId: user.id
    })
    setText("")
  }

  const handleTyping = (e) => {
    setText(e.target.value)
    if (!socket) return
    socket.emit("dm_typing", {
      toId: dmUser.userId,
      fromId: user.id,
      username: user.username
    })
    clearTimeout(typingTimer)
    typingTimer = setTimeout(() => {
      socket.emit("dm_stop_typing", { toId: dmUser.userId, fromId: user.id })
    }, 1500)
  }

  const isMe = (msg) =>
    msg.sender._id === user.id || msg.sender === user.id

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.dmAvatar}>
          {dmUser.username[0].toUpperCase()}
        </div>
        <div>
          <div style={styles.dmName}>{dmUser.username}</div>
          <div style={styles.dmSubtitle}>Direct message</div>
        </div>
      </div>

      <div style={styles.messages}>
        {messages.length === 0 && (
          <div style={styles.emptyState}>
            <div style={styles.bigAvatar}>
              {dmUser.username[0].toUpperCase()}
            </div>
            <p style={styles.emptyTitle}>
              This is the beginning of your DM with {dmUser.username}
            </p>
            <p style={styles.emptySubtitle}>Say hello!</p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg._id}
            style={{
              ...styles.msgRow,
              justifyContent: isMe(msg) ? "flex-end" : "flex-start"
            }}
          >
            <div
              style={{
                ...styles.bubble,
                ...(isMe(msg) ? styles.myBubble : styles.theirBubble)
              }}
            >
              {!isMe(msg) && (
                <div style={styles.senderName}>{dmUser.username}</div>
              )}
              {msg.text}
              <div style={styles.time}>
                {new Date(msg.createdAt).toLocaleTimeString([], {
                  hour: "2-digit", minute: "2-digit"
                })}
              </div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {typing && (
        <div style={styles.typingWrapper}>
          <span style={styles.typingText}>{typing}</span>
        </div>
      )}

      <form onSubmit={sendDM} style={styles.inputArea}>
        <input
          style={styles.input}
          placeholder={`Message ${dmUser.username}`}
          value={text}
          onChange={handleTyping}
        />
        <button style={styles.sendBtn} type="submit">Send</button>
      </form>
    </div>
  )
}

const styles = {
  container: { flex: 1, display: "flex", flexDirection: "column", background: "#fff", height: "100vh" },
  header: {
    padding: "14px 20px", borderBottom: "1px solid #eee",
    display: "flex", alignItems: "center", gap: "12px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
  },
  dmAvatar: {
    width: "38px", height: "38px", borderRadius: "50%",
    background: "#4f46e5", color: "#fff", display: "flex",
    alignItems: "center", justifyContent: "center",
    fontWeight: "700", fontSize: "16px"
  },
  dmName: { fontWeight: "600", fontSize: "15px" },
  dmSubtitle: { fontSize: "11px", color: "#999" },
  messages: { flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: "4px" },
  emptyState: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, gap: "10px", paddingTop: "60px" },
  bigAvatar: {
    width: "72px", height: "72px", borderRadius: "50%",
    background: "#4f46e5", color: "#fff", display: "flex",
    alignItems: "center", justifyContent: "center",
    fontWeight: "700", fontSize: "28px"
  },
  emptyTitle: { fontSize: "15px", fontWeight: "600", color: "#333", margin: 0, textAlign: "center" },
  emptySubtitle: { fontSize: "13px", color: "#999", margin: 0 },
  msgRow: { display: "flex", marginBottom: "2px" },
  bubble: { maxWidth: "65%", padding: "10px 14px", borderRadius: "18px", fontSize: "14px", lineHeight: 1.5, wordBreak: "break-word" },
  myBubble: { background: "#4f46e5", color: "#fff", borderBottomRightRadius: "4px" },
  theirBubble: { background: "#f0f2f5", color: "#1a1a1a", borderBottomLeftRadius: "4px" },
  senderName: { fontSize: "11px", fontWeight: "600", color: "#4f46e5", marginBottom: "3px" },
  time: { fontSize: "10px", opacity: 0.55, marginTop: "4px", textAlign: "right" },
  typingWrapper: { padding: "0 20px 8px", fontSize: "12px", color: "#888", fontStyle: "italic" },
  typingText: {},
  inputArea: { padding: "16px 20px", borderTop: "1px solid #eee", display: "flex", gap: "10px" },
  input: { flex: 1, padding: "11px 16px", borderRadius: "24px", border: "1.5px solid #e0e0e0", fontSize: "14px", outline: "none", background: "#fafafa" },
  sendBtn: { padding: "11px 22px", background: "#4f46e5", color: "#fff", border: "none", borderRadius: "24px", cursor: "pointer", fontWeight: "600", fontSize: "14px" }
}

export default DMChat
