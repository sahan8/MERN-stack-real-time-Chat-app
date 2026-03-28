const jwt = require("jsonwebtoken")
const User = require("../models/User.js")

const protect = async (req, res, next) => {
    try {
        // check for token in the Authorization header
        const authHeader = req.headers.authorization
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ error: "No token, access denied" })
        }

        // verify the token
        const token = authHeader.split(" ")[1]
        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        // attach the user to the request object
        req.user = await User.findById(decoded.id).select("-password")
        next()
    } catch (err) {
        res.status(401).json({ error: "Token invalid or expired" })
    }
}

module.exports = { protect }