const DirectMessage = require("../models/DirectMessage")

// GET /api/dm/:otherUserId — get conversation history
const getMessages = async (req, res) => {
  try {
    const conversationId = [req.user._id.toString(), req.params.otherUserId]
      .sort()
      .join("_")

    const messages = await DirectMessage.find({ conversationId })
      .populate("sender", "username")
      .populate("receiver", "username")
      .sort({ createdAt: 1 })
      .limit(50)

    res.json(messages)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

module.exports = { getMessages }