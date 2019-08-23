const mongoose = require('mongoose')
const Schema = mongoose.Schema

const mhtSchema = new Schema({
  yyyymmdd: String,
  key: String,
  urlList: Array
})

module.exports = mongoose.model('mht', mhtSchema)
