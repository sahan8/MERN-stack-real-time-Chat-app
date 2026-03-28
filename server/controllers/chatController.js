const Room = require("../models/Room")
const Message = require("../models/Message")

// POST /api/chat/rooms — create a new room
const createRoom = async (req, res) => {
    try {
        const { name, description } = req.body

        const existing = await Room.findOne({ name })
        if (existing) {
            return res.status(400).json({ error: "Room name already taken" })
        }

        const room = await Room.create({
            name,
            description,
            createdBy: req.user._id,
            members: [req.user._id]
        })

        res.status(201).json(room)
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
}

// GET /api/chat/rooms — get all rooms
const getRooms = async (req, res) => {
    try {
        const rooms = await Room.find()
            .populate("createdBy", "username")  // replace ID with username
            .sort({ createdAt: -1 })
        res.json(rooms)
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
}

// GET /api/chat/rooms/:roomId/messages — get messages for a room
const getMessages = async (req, res) => {
    try {
        const messages = await Message.find({ room: req.params.roomId })
            .populate("sender", "username")   // replace sender ID with username
            .sort({ createdAt: 1 })           // oldest first
            .limit(50)                        // last 50 messages
        res.json(messages)
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
}

module.exports = { createRoom, getRooms, getMessages }