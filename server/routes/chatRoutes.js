const express = require("express")
const router = express.Router()
const { createRoom, getRooms, getMessages } = require("../controllers/chatController")
const { protect } = require("../middleware/authMiddleware")

// all routes here are protected — user must be logged in
router.post("/rooms", protect, createRoom)
router.get("/rooms", protect, getRooms)
router.get("/rooms/:roomId/messages", protect, getMessages)

module.exports = router