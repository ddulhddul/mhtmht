// MongoDB
const Mht = require('./model/Mht')

module.exports = {

  async listMht () {
    return await Mht.find({}, null, { sort: {  } }) || {}
  },

  async updateMht (obj={}) {
    await Mht.deleteOne({ 
      // yyyymmdd: obj.yyyymmdd, 
      key: obj.key, 
    })
    await Mht.insertMany([{
      // yyyymmdd: obj.yyyymmdd, 
      key: obj.key, 
      urlList: obj.urlList
    }])
  },

}
