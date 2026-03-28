import "./ChatRoom.css"
import { useState, useEffect, useRef } from "react"
import axios from "axios"
import FileMessage from "./FileMessage"
import uploadFile from "../utils/uploadFile"
import { playMessageSound, playReactionSound } from "../utils/sounds"

// Cloudinary config — paste your own credentials here
const CLOUD_NAME = "dz3lqqoxb"
const UPLOAD_PRESET = "chatapp-preset"

function ChatRoom({ room, socket, user, token, muted }) {
  const [messages, setMessages] = useState([])
  const [text, setText] = useState("")
  const [typing, setTyping] = useState("")
  const [hoveredMsg, setHoveredMsg] = useState(null)
  const [showPicker, setShowPicker] = useState(null)
  const [filePreview, setFilePreview] = useState(null)  // { file, previewUrl, fileName, fileType }
  const [uploading, setUploading] = useState(false)
  const bottomRef = useRef(null)
  let typingTimer

  useEffect(() => {
    if (!socket || !room._id) return

    const fetchMessagesInternal = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/chat/rooms/${room._id}/messages`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setMessages(res.data)
      } catch (err) {
        console.log("Error fetching messages:", err)
      }
    }

    // load previous messages every time room changes
    fetchMessagesInternal()

    socket.on("receive_message", (msg) => {
      setMessages((prev) => [...prev, msg])

      // play sound only if message is from someone else
      const senderId = msg.sender._id || msg.sender
      if (senderId !== user.id && !muted) {
        playMessageSound()
      }
    })

    socket.on("user_typing", ({ username }) => {
      setTyping(`${username} is typing...`)
    })
    socket.on("user_stop_typing", () => setTyping(""))

    socket.on("reaction_updated", ({ messageId, reactions }) => {
      setMessages(prev =>
        prev.map(msg => {
          if (msg._id === messageId) {
            // check if this message belongs to current user
            const isMyMsg = msg.sender._id === user.id || msg.sender === user.id
            if (isMyMsg && !muted) playReactionSound()
            return { ...msg, reactions }
          }
          return msg
        })
      )
    })

    return () => {
      socket.off("receive_message")
      socket.off("user_typing")
      socket.off("user_stop_typing")
      socket.off("reaction_updated")
    }
  }, [room._id, socket, token])

  // auto scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const isImage = file.type.startsWith("image/")
    const previewUrl = isImage ? URL.createObjectURL(file) : null

    setFilePreview({
      file,
      previewUrl,
      fileName: file.name,
      fileType: isImage ? "image" : "file"
    })
  }

  const removeFilePreview = () => {
    setFilePreview(null)
  }

  const sendMessage = async (e) => {
    e.preventDefault()
    if ((!text.trim() && !filePreview) || !socket) return

    setUploading(true)

    try {
      let fileData = {}

      if (filePreview) {
        fileData = await uploadFile(filePreview.file, CLOUD_NAME, UPLOAD_PRESET)
      }

      socket.emit("send_message", {
        roomId: room._id,
        senderId: user.id,
        senderName: user.username,
        text: text.trim(),
        ...fileData
      })

      socket.emit("stop_typing", { roomId: room._id })
      setText("")
      setFilePreview(null)
    } catch (err) {
      console.log("Upload error:", err)
      alert("File upload failed. Check your Cloudinary settings.")
    } finally {
      setUploading(false)
    }
  }

  const handleTyping = (e) => {
  setText(e.target.value)
  if (!socket) return
  socket.emit("typing", { roomId: room._id, username: user.username })
  clearTimeout(typingTimer)
  typingTimer = setTimeout(() => {
    if (!socket) return
    socket.emit("stop_typing", { roomId: room._id })
  }, 1500)
}

  const isMyMessage = (msg) => msg.sender._id === user.id || msg.sender === user.id

  const handleReaction = (messageId, emoji) => {
    if (!socket) return
    socket.emit("add_reaction", {
      messageId,
      emoji,
      userId: user.id,
      roomId: room._id
    })
    setShowPicker(null)
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.roomName}># {room.name}</span>
        {room.description && <span style={styles.desc}>{room.description}</span>}
      </div><div style={styles.header}>
  <div style={styles.headerLeft}>
    <span style={styles.hashIcon}>#</span>
    <span style={styles.roomName}>{room.name}</span>
    {room.description && (
      <span style={styles.desc}>— {room.description}</span>
    )}
  </div>
</div>

      <div style={styles.messages}>
        {messages.length === 0 && (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>💬</div>
            <p style={styles.emptyTitle}>No messages yet</p>
            <p style={styles.emptySubtitle}>Be the first to say something in #{room.name}!</p>
          </div>
        )}

        {messages.length > 0 && (
          <div style={styles.dateSeparator}>
            <div style={styles.dateLine} />
            <span style={styles.dateLabel}>Today</span>
            <div style={styles.dateLine} />
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg._id}
            style={{
              ...styles.msgRow,
              justifyContent: isMyMessage(msg) ? "flex-end" : "flex-start",
              alignItems: "flex-end",
              gap: "8px"
            }}
            onMouseEnter={() => setHoveredMsg(msg._id)}
            onMouseLeave={() => { setHoveredMsg(null); setShowPicker(null) }}
          >
            {/* Avatar for other people's messages */}
            {!isMyMessage(msg) && (
              <div style={styles.msgAvatar}>
                {msg.sender.avatar ? (
                  <img src={msg.sender.avatar} alt="" style={styles.msgAvatarImg} />
                ) : (
                  <div style={styles.msgAvatarPlaceholder}>
                    {(msg.sender.username || "?")[0].toUpperCase()}
                  </div>
                )}
              </div>
            )}

            <div style={{ position: "relative", maxWidth: "65%" }}>

              {/* Reaction button — shows on hover */}
              {hoveredMsg === msg._id && (
                <button
                  style={{
                    ...styles.reactBtn,
                    ...(isMyMessage(msg) ? { left: "-36px", right: "auto" } : { right: "-36px", left: "auto" })
                  }}
                  onClick={() => setShowPicker(showPicker === msg._id ? null : msg._id)}
                >
                  +
                </button>
              )}

              {/* Emoji picker */}
              {showPicker === msg._id && (
                <div
                  style={{
                    ...styles.picker,
                    ...(isMyMessage(msg) ? { right: "0" } : { left: "0" })
                  }}
                >
                  {["👍","❤️","😂","😮","😢","🔥","🎉","👏"].map(emoji => (
                    <span
                      key={emoji}
                      style={styles.pickerEmoji}
                      onClick={() => handleReaction(msg._id, emoji)}
                    >
                      {emoji}
                    </span>
                  ))}
                </div>
              )}

              {/* Message bubble */}
              <div
                style={{
                  ...styles.bubble,
                  ...(isMyMessage(msg) ? styles.myBubble : styles.theirBubble)
                }}
              >
                {!isMyMessage(msg) && (
                  <div style={styles.senderName}>
                    {msg.sender.username || msg.sender}
                  </div>
                )}

                {/* Text */}
                {msg.text && <div>{msg.text}</div>}

                {/* File / image */}
                {msg.fileUrl && (
                  <FileMessage
                    fileUrl={msg.fileUrl}
                    fileName={msg.fileName}
                    fileType={msg.fileType}
                  />
                )}

                <div style={styles.time}>
                  {new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: "2-digit", minute: "2-digit"
                  })}
                </div>
              </div>

              {/* Reactions display */}
              {msg.reactions && msg.reactions.length > 0 && (
                <div style={styles.reactionsRow}>
                  {msg.reactions
                    .filter(r => r.users.length > 0)
                    .map((r) => {
                      const iReacted = r.users.some(
                        id => id === user.id || id?._id === user.id || id?.toString() === user.id
                      )
                      return (
                        <button
                          key={r.emoji}
                          style={{
                            ...styles.reactionPill,
                            ...(iReacted ? styles.reactionPillActive : {})
                          }}
                          onClick={() => handleReaction(msg._id, r.emoji)}
                        >
                          {r.emoji} {r.users.length}
                        </button>
                      )
                    })}
                </div>
              )}

            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {typing && (
  <div style={styles.typingWrapper}>
    <div style={styles.typingBubble}>
      <span style={styles.typingText}>{typing}</span>
      <div style={styles.dotsWrapper}>
        <span style={{...styles.dot, animationDelay: "0ms"}} />
        <span style={{...styles.dot, animationDelay: "150ms"}} />
        <span style={{...styles.dot, animationDelay: "300ms"}} />
      </div>
    </div>
  </div>
)}

      <div style={styles.inputContainer}>
        {/* File preview above input */}
        {filePreview && (
          <div style={styles.previewBar}>
            {filePreview.previewUrl ? (
              <img src={filePreview.previewUrl} alt="preview" style={styles.previewImg} />
            ) : (
              <div style={styles.previewFile}>📄 {filePreview.fileName}</div>
            )}
            <button style={styles.removeBtn} onClick={removeFilePreview}>✕</button>
          </div>
        )}

        <form onSubmit={sendMessage} style={styles.inputArea}>
          {/* Hidden file input */}
          <input
            type="file"
            id="fileInput"
            style={{ display: "none" }}
            accept="image/*,video/*,.pdf,.doc,.docx,.txt,.zip"
            onChange={handleFileSelect}
          />

          {/* Paperclip button */}
          <button
            type="button"
            style={styles.attachBtn}
            onClick={() => document.getElementById("fileInput").click()}
          >
            📎
          </button>

          <input
            style={styles.input}
            placeholder={`Message #${room.name}`}
            value={text}
            onChange={handleTyping}
          />
          <button style={{
            ...styles.sendBtn,
            opacity: uploading ? 0.6 : 1
          }} type="submit" disabled={uploading}>
            {uploading ? "..." : "Send"}
          </button>
        </form>
      </div>
    </div>
  )
}

const styles = {
  container: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    background: "#fff",
    height: "100vh"
  },
  header: {
    padding: "14px 20px",
    borderBottom: "1px solid #eee",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    background: "#fff",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
  },
  headerLeft: { display: "flex", alignItems: "center", gap: "8px" },
  hashIcon: { fontSize: "18px", color: "#4f46e5", fontWeight: "700" },
  roomName: { fontWeight: "600", fontSize: "16px", color: "#1a1a1a" },
  desc: { fontSize: "12px", color: "#999", marginLeft: "4px" },
  messages: {
    flex: 1,
    overflowY: "auto",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "4px"
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    gap: "8px",
    opacity: 0.5
  },
  emptyIcon: { fontSize: "48px" },
  emptyTitle: { fontSize: "16px", fontWeight: "500", margin: 0, color: "#333" },
  emptySubtitle: { fontSize: "13px", margin: 0, color: "#888" },
  dateSeparator: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    margin: "16px 0",
    opacity: 0.5
  },
  dateLine: {
    flex: 1,
    height: "1px",
    background: "#ddd"
  },
  dateLabel: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#888",
    whiteSpace: "nowrap"
  },
  msgRow: { display: "flex", marginBottom: "2px" },
  bubble: {
    maxWidth: "65%",
    padding: "10px 14px",
    borderRadius: "18px",
    fontSize: "14px",
    lineHeight: 1.5,
    wordBreak: "break-word"
  },
  myBubble: {
    background: "#4f46e5",
    color: "#fff",
    borderBottomRightRadius: "4px",
    marginLeft: "auto"
  },
  theirBubble: {
    background: "#f0f2f5",
    color: "#1a1a1a",
    borderBottomLeftRadius: "4px"
  },
  senderName: {
    fontSize: "11px",
    fontWeight: "600",
    marginBottom: "3px",
    color: "#4f46e5"
  },
  time: {
    fontSize: "10px",
    opacity: 0.55,
    marginTop: "4px",
    textAlign: "right"
  },
  typingWrapper: { padding: "0 20px 8px" },
  typingBubble: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    background: "#f0f2f5",
    padding: "8px 14px",
    borderRadius: "18px",
    borderBottomLeftRadius: "4px"
  },
  typingText: { fontSize: "12px", color: "#888", fontStyle: "italic" },
  dotsWrapper: { display: "flex", gap: "3px", alignItems: "center" },
  dot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: "#aaa",
    display: "inline-block",
    animation: "bounce 1s infinite"
  },
  inputArea: {
    padding: "12px 20px 16px",
    display: "flex",
    gap: "10px",
    alignItems: "center"
  },
  input: {
    flex: 1,
    padding: "11px 16px",
    borderRadius: "24px",
    border: "1.5px solid #e0e0e0",
    fontSize: "14px",
    outline: "none",
    transition: "border-color 0.2s",
    background: "#fafafa"
  },
  sendBtn: {
    padding: "11px 22px",
    background: "#4f46e5",
    color: "#fff",
    border: "none",
    borderRadius: "24px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "14px",
    transition: "background 0.2s"
  },
  reactBtn: {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    border: "1px solid #e0e0e0",
    background: "#fff",
    cursor: "pointer",
    fontSize: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
    zIndex: 10,
    lineHeight: 1,
    padding: 0
  },
  picker: {
    position: "absolute",
    bottom: "calc(100% + 6px)",
    background: "#fff",
    border: "1px solid #e0e0e0",
    borderRadius: "24px",
    padding: "6px 10px",
    display: "flex",
    gap: "4px",
    zIndex: 100,
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
  },
  pickerEmoji: {
    fontSize: "20px",
    cursor: "pointer",
    padding: "4px",
    borderRadius: "8px",
    transition: "transform 0.1s",
    display: "inline-block",
    lineHeight: 1
  },
  reactionsRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "4px",
    marginTop: "4px",
    paddingLeft: "2px"
  },
  reactionPill: {
    padding: "2px 8px",
    borderRadius: "12px",
    border: "1px solid #e0e0e0",
    background: "#f9f9f9",
    fontSize: "13px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "3px",
    transition: "all 0.15s"
  },
  reactionPillActive: {
    background: "#eef2ff",
    border: "1px solid #c7d2fe",
    color: "#4f46e5"
  },
  msgAvatar: {
    width: "30px",
    height: "30px",
    borderRadius: "50%",
    flexShrink: 0,
    marginBottom: "2px"
  },
  msgAvatarImg: {
    width: "30px",
    height: "30px",
    borderRadius: "50%",
    objectFit: "cover"
  },
  msgAvatarPlaceholder: {
    width: "30px",
    height: "30px",
    borderRadius: "50%",
    background: "#4f46e5",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    fontWeight: "700"
  },
  inputContainer: { borderTop: "1px solid #eee", background: "#fff" },
  previewBar: {
    padding: "10px 20px 0",
    display: "flex",
    alignItems: "center",
    gap: "10px"
  },
  previewImg: {
    height: "60px",
    width: "60px",
    objectFit: "cover",
    borderRadius: "8px",
    border: "1px solid #eee"
  },
  previewFile: {
    fontSize: "13px",
    color: "#555",
    background: "#f5f5f5",
    padding: "8px 12px",
    borderRadius: "8px"
  },
  removeBtn: {
    background: "#ef4444",
    color: "#fff",
    border: "none",
    borderRadius: "50%",
    width: "22px",
    height: "22px",
    cursor: "pointer",
    fontSize: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0
  },
  attachBtn: {
    background: "none",
    border: "none",
    fontSize: "20px",
    cursor: "pointer",
    padding: "0 4px",
    opacity: 0.6,
    transition: "opacity 0.15s",
    flexShrink: 0
  }
}



export default ChatRoom