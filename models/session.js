const mongoose = require('mongoose')

const sessionSchema = new mongoose.Schema({
  expires: {
    type: Date,
    default: Date.now(),
  },
  session: {
    type: String,
  },
})

module.exports = mongoose.model('session', sessionSchema)
