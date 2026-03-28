const mongoose = require("mongoose")

const messageSchema = new mongoose.Schema(
    {
        room: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Room",
            required: true
        },
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        text: {
            type: String,
            default: ""
        },
        fileUrl: {
            type: String,
            default: ""
        },
        fileName: {
            type: String,
            default: ""
        },
        fileType: {
            type: String,
            default: ""
        },
        reactions: [
            {
                emoji: { type: String, required: true },
                users: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
            }
        ]
    },
    { timestamps: true }
)

module.exports = mongoose.model("Message", messageSchema)