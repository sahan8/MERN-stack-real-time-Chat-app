const User = require("../models/User")

// GET /api/users/me — get current user profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password")
    res.json(user)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// PUT /api/users/me — update profile
const updateProfile = async (req, res) => {
  try {
    const { username, avatar } = req.body

    // check username not taken by someone else
    if (username) {
      const existing = await User.findOne({
        username,
        _id: { $ne: req.user._id }
      })
      if (existing) {
        return res.status(400).json({ error: "Username already taken" })
      }
    }

    const updated = await User.findByIdAndUpdate(
      req.user._id,
      { ...(username && { username }), ...(avatar && { avatar }) },
      { new: true }
    ).select("-password")

    res.json(updated)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

module.exports = { getProfile, updateProfile }