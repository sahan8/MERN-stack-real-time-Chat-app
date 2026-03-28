import { useState, useEffect } from "react"
import axios from "axios"
import { io } from "socket.io-client"
import { useAuth } from "../context/AuthContext"
import RoomList from "./RoomList"
import ChatRoom from "./ChatRoom"
import DMChat from "./DMChat"
import ProfileModal from "./ProfileModal"
import { playDMSound } from "../utils/sounds"

let socket

function Chat() {
  const { user, token, logout } = useAuth()
  const [rooms, setRooms] = useState([])
  const [activeRoom, setActiveRoom] = useState(null)
  const [onlineUsers, setOnlineUsers] = useState([])
  const [dmUser, setDmUser] = useState(null)
  const [unreadDMs, setUnreadDMs] = useState({})
  const [showProfile, setShowProfile] = useState(false)
  const [muted, setMuted] = useState(
    localStorage.getItem("muted") === "true"
  )

  const toggleMute = () => {
    const newMuted = !muted
    setMuted(newMuted)
    localStorage.setItem("muted", newMuted)
  }

  useEffect(() => {
    // connect to socket server
    socket = io("http://localhost:5000", {
      transports: ["websocket"]
    })

    socket.on("connect", () => {
      socket.emit("user_connected", {
        userId: user.id,
        username: user.username
      })
      // join personal DM room so you receive DMs
      socket.emit("join_dm", { myId: user.id })
    })

    // listen for online users updates
    socket.on("online_users", (users) => {
      setOnlineUsers(users)
    })

    socket.on("receive_dm", (msg) => {
      const senderId = msg.sender._id || msg.sender

      // only increment if this DM is NOT currently open
      setDmUser((currentDmUser) => {
        if (!currentDmUser || currentDmUser.userId !== senderId) {
          setUnreadDMs((prev) => ({
            ...prev,
            [senderId]: (prev[senderId] || 0) + 1
          }))
          // play DM sound if not muted
          if (!muted) playDMSound()
        }
        return currentDmUser
      })
    })

    // fetch all rooms inline
    const fetchRoomsData = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/chat/rooms", {
          headers: { Authorization: `Bearer ${token}` }
        })
        setRooms(res.data)
      } catch (err) {
        console.log("Error fetching rooms:", err)
      }
    }
    fetchRoomsData()

    return () => socket.disconnect()
  }, [user.id, user.username, token])

  const createRoom = async (name, description) => {
    try {
      const res = await axios.post(
  "http://localhost:5000/api/chat/rooms",
        { name, description },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setRooms([res.data, ...rooms])
    } catch (err) {
      alert(err.response?.data?.error || "Could not create room")
    }
  }

  const joinRoom = (room) => {
    if (activeRoom) socket.emit("leave_room", activeRoom._id)
    socket.emit("join_room", room._id)
    setActiveRoom(room)
  }

  const openDM = (onlineUser) => {
    if (onlineUser.userId === user.id) return
    setDmUser(onlineUser)
    setActiveRoom(null)
    // clear unread badge for this user
    setUnreadDMs((prev) => ({ ...prev, [onlineUser.userId]: 0 }))
  }

  return (
    <div style={{ ...styles.container, position: "relative" }}>
      <RoomList
        rooms={rooms}
        activeRoom={activeRoom}
        onlineUsers={onlineUsers}
        user={user}
        onJoin={(room) => { joinRoom(room); setDmUser(null) }}
        onCreate={createRoom}
        onLogout={logout}
        onDM={openDM}
        unreadDMs={unreadDMs}
        onProfileClick={() => setShowProfile(true)}
        muted={muted}
        onToggleMute={toggleMute}
      />
      {dmUser ? (
        <DMChat
          dmUser={dmUser}
          socket={socket}
          user={user}
          token={token}
        />
      ) : activeRoom ? (
        <ChatRoom
          room={activeRoom}
          socket={socket}
          user={user}
          token={token}
          muted={muted}
        />
      ) : (
        <div style={styles.placeholder}>
          <p>Select a room or click a user to DM them</p>
        </div>
      )}

      {showProfile && (
        <ProfileModal onClose={() => setShowProfile(false)} />
      )}
    </div>
  )
}

const styles = {
  container: { display: "flex", height: "100vh", backgroundColor: "#f0f2f5" },
  placeholder: {
    flex: 1, display: "flex",
    alignItems: "center", justifyContent: "center",
    color: "#999", fontSize: "15px"
  }
}

export default Chat