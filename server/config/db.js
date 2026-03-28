const mongoose = require("mongoose")

const connectDB = async () => {
    try {
        // Workaround for Node.js querySrv ECONNREFUSED DNS issue on Windows
        const dns = require("dns")
        dns.setServers(["8.8.8.8", "8.8.4.4"])

        await mongoose.connect(process.env.MONGO_URI)
        console.log("MongoDB connected")
    } catch (err) {
        console.log("DB connection error:", err)
        process.exit(1)   // stop the server if DB fails
    }
}

module.exports = connectDB