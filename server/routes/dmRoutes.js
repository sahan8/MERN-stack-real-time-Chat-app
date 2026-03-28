const express = require("express")
const router = express.Router()
const { getMessages } = require("../controllers/dmController")
const { protect } = require("../middleware/authMiddleware")

router.get("/:otherUserId", protect, getMessages)

module.exports = router