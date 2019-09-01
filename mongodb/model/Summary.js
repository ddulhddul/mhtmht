const mongoose = require('mongoose')
const Schema = mongoose.Schema

const summary = new Schema({
  done: Boolean,
  key: {
    type:String,
    required: true,
    unique: true
  }
})

module.exports = mongoose.model('summary', summary)
