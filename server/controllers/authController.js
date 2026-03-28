const User = require("../models/User")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")

// helper — generate a JWT token for a user
const generateToken = (userId) => {
    return jwt.sign(
        { id: userId },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }   // token expires in 7 days
    )
}

// POST /api/auth/register
const register = async (req, res) => {
    try {
        const { username, email, password } = req.body

        // check if user already exists
        const existingUser = await User.findOne({ email })
        if (existingUser) {
            return res.status(400).json({ error: "Email already in use" })
        }

        // hash the password — never store plain text
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        // create and save the new user
        const user = await User.create({
            username,
            email,
            password: hashedPassword
        })

        // respond with token + user info (no password)
        res.status(201).json({
            token: generateToken(user._id),
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
}

// POST /api/auth/login
const login = async (req, res) => {
    try {
        const { email, password } = req.body

        // find user by email
        const user = await User.findOne({ email })
        if (!user) {
            return res.status(400).json({ error: "Invalid email or password" })
        }

        // compare entered password with hashed password in DB
        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) {
            return res.status(400).json({ error: "Invalid email or password" })
        }

        // respond with token + user info
        res.json({
            token: generateToken(user._id),
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
}

module.exports = { register, login }