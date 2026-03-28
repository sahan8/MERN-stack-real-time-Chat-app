const express = require("express")
const http = require("http")
const { Server } = require("socket.io")
const cors = require("cors")
require("dotenv").config()
const dmRoutes = require("./routes/dmRoutes")
const userRoutes = require("./routes/userRoutes")
const DirectMessage = require("./models/DirectMessage")

const connectDB = require("./config/db")
const authRoutes = require("./routes/authRoutes")
const chatRoutes = require("./routes/chatRoutes")
const Message = require("./models/Message")

const app = express()
const server = http.createServer(app)
const io = new Server(server, {
  cors: { origin: "http://localhost:3000", methods: ["GET", "POST"] }
})

app.use(cors({ origin: "http://localhost:3000" }))
app.use(express.json())

app.use("/api/auth", authRoutes)
app.use("/api/chat", chatRoutes)
app.use("/api/dm", dmRoutes)
app.use("/api/users", userRoutes) 

// track online users — { socketId: { userId, username } }
const onlineUsers = {}

io.on("connection", (socket) => {
  console.log("User connected:", socket.id)

  // user joins — store their info
  socket.on("user_connected", ({ userId, username }) => {
    onlineUsers[socket.id] = { userId, username }
    io.emit("online_users", Object.values(onlineUsers))
    console.log(`${username} is online`)
  })

  // user joins a chat room
  socket.on("join_room", (roomId) => {
    socket.join(roomId)
    console.log(`${socket.id} joined room: ${roomId}`)
  })

  // user leaves a chat room
  socket.on("leave_room", (roomId) => {
    socket.leave(roomId)
    console.log(`${socket.id} left room: ${roomId}`)
  })

  // user sends a message
  socket.on("send_message", async ({ roomId, senderId, senderName, text, fileUrl, fileName, fileType }) => {
    try {
      // save message to MongoDB
      const message = await Message.create({
        room: roomId,
        sender: senderId,
        text: text || "",
        fileUrl: fileUrl || "",
        fileName: fileName || "",
        fileType: fileType || ""
      })

      // broadcast to everyone in the room
      io.to(roomId).emit("receive_message", {
        _id: message._id,
        text: text || "",
        fileUrl: fileUrl || "",
        fileName: fileName || "",
        fileType: fileType || "",
        sender: { _id: senderId, username: senderName },
        room: roomId,
        reactions: [],
        createdAt: message.createdAt
      })
    } catch (err) {
      console.log("Message save error:", err.message)
    }
  })

  // typing indicator
  socket.on("typing", ({ roomId, username }) => {
    socket.to(roomId).emit("user_typing", { username })
  })

  socket.on("stop_typing", ({ roomId }) => {
    socket.to(roomId).emit("user_stop_typing")
  })

  // user joins their personal DM room (their own userId as room)
  socket.on("join_dm", ({ myId }) => {
    socket.join(`dm_${myId}`)
    console.log(`${myId} joined their DM room`)
  })

  // send a direct message
  socket.on("send_dm", async ({ senderId, senderName, receiverId, text }) => {
    try {
      const conversationId = [senderId, receiverId].sort().join("_")

      const message = await DirectMessage.create({
        conversationId,
        sender: senderId,
        receiver: receiverId,
        text
      })

      const payload = {
        _id: message._id,
        conversationId,
        sender: { _id: senderId, username: senderName },
        receiver: { _id: receiverId },
        text,
        createdAt: message.createdAt,
        read: false
      }

      // deliver to receiver's personal room
      io.to(`dm_${receiverId}`).emit("receive_dm", payload)
      // also echo back to sender
      io.to(`dm_${senderId}`).emit("receive_dm", payload)
    } catch (err) {
      console.log("DM save error:", err.message)
    }
  })

  socket.on("dm_typing", ({ toId, fromId, username }) => {
    io.to(`dm_${toId}`).emit("dm_typing", { fromId, username })
  })

  socket.on("dm_stop_typing", ({ toId, fromId }) => {
    io.to(`dm_${toId}`).emit("dm_stop_typing", { fromId })
  })

  socket.on("add_reaction", async ({ messageId, emoji, userId, roomId }) => {
    try {
      const message = await Message.findById(messageId)
      if (!message) return

      const existing = message.reactions.find(r => r.emoji === emoji)

      if (existing) {
        const alreadyReacted = existing.users.includes(userId)
        if (alreadyReacted) {
          // remove reaction
          existing.users = existing.users.filter(
            id => id.toString() !== userId
          )
          if (existing.users.length === 0) {
            message.reactions = message.reactions.filter(
              r => r.emoji !== emoji
            )
          }
        } else {
          // add user to existing emoji
          existing.users.push(userId)
        }
      } else {
        // new emoji reaction
        message.reactions.push({ emoji, users: [userId] })
      }

      await message.save()

      // broadcast updated reactions to everyone in the room
      io.to(roomId).emit("reaction_updated", {
        messageId,
        reactions: message.reactions
      })
    } catch (err) {
      console.log("Reaction error:", err.message)
    }
  })

  // user disconnects
  socket.on("disconnect", () => {
    const user = onlineUsers[socket.id]
    if (user) {
      console.log(`${user.username} went offline`)
      delete onlineUsers[socket.id]
      io.emit("online_users", Object.values(onlineUsers))
    }
  })
})

connectDB().then(() => {
  const PORT = process.env.PORT || 5000
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })
})