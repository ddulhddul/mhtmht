// MongoDB
const Mht = require('./model/Mht')
const Summary = require('./model/Summary')

module.exports = {

  async listSummary (param) {
    let list = []
    const condition = {}
    if(param.key) condition.key = RegExp(`${param.key}`)
    if(param.doneFilterTf) condition.done = param.doneFilterTf == 'T' ? true: false
    if (!param) {
      list = await Summary.find(condition, null, { sort: { key: 1 } })
    } else {
      const pageIndex = param.pageIndex || 1
      list = await Summary.find(condition, null, { sort: { key: 1 } })
        .skip((pageIndex - 1) * param.pageSize).limit(param.pageSize)
    }
    return list
  },

  insertSummary (param = {}) {
    return Summary.insertMany([{
      done: false,
      key: param.key
    }])
  },

  changeSummaryDone (param = {}) {
    // console.log('changeSummaryDone', param)
    Summary.updateOne(
      { key: param.key },
      { done: param.done },
      (err, raw) => {
        if (err) {
          console.log('update summary error', err)
        }
      }
    )
  },

  async listMht () {
    return await Mht.find({}, null, { sort: { yyyymmdd: -1 } }).limit(50) || {}
  },

  async updateMht (obj={}) {
    await Mht.deleteOne({ 
      // yyyymmdd: obj.yyyymmdd, 
      key: obj.key, 
    })
    await Mht.insertMany([{
      yyyymmdd: obj.yyyymmdd, 
      key: obj.key, 
      urlList: obj.urlList
    }])
  },

  async changeDone (obj={}) {
    await Mht.updateOne({ 
      key: obj.key
    }, {
      done: obj.done
    })
  },

}
