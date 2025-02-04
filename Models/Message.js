const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true
  },
  content: {
    type: String,
    required: true
  },
  media: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ["Sent", "Delivered", "Read"],
    default: "Sent"
  }
}, { timestamps: true });

const Message = mongoose.model("message", messageSchema);

module.exports = Message;
