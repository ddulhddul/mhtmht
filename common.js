const request = require('request')
const cheerio = require('cheerio')
const fs = require('fs')

module.exports = {

  async makeFileByUrl(fileName, url){
    const $ = await this.urlRequest(url)
    fs.writeFile(fileName, $.html(), 'utf8', (error, data)=>{
      if(error) { throw error }
      console.log(`${fileName} ASync Write Complete`)
    })
  },

  writeFile(fileName, str) {
    fs.writeFile(fileName, str, 'utf8', (error, data)=>{
        if(error) { throw error }
        console.log(`${fileName} ASync Write Complete`)
      })
  },

  download(uri, filename, callback) {
    request.head(uri, function (err, res, body) {
      console.log('content-type:', res.headers['content-type'])
      console.log('content-length:', res.headers['content-length'])
      request(uri).pipe(fs.createWriteStream(filename)).on('close', callback)
    })
  },

  async urlRequest(param) {
    return new Promise(function (resolve, reject) {
      let url = param
      const options = {
        url: url,
        header:{'User-Agent':"Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/43.0.2357.134 Safari/537.36"}
      }  
      // url="https://www.google.co.in/search?q="+query+"&source=lnms&tbm=isch"
      request(options, function (error, response, body) {
        try {
          if (error) reject('Unexpected Error :::')
          let $ = cheerio.load(body)
          resolve($)

        } catch (e) {
          resolve()
          console.log('request Error :::', e)
        }
      })
    })
  },

}