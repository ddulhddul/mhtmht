const request = require('request')
const cheerio = require('cheerio')
const fs = require('fs')

module.exports = {

  yyyymmdd(){
    const date = new Date()
    return [
      date.getFullYear(),
      String(date.getMonth()+1 || '').padStart(2,'0'),
      String(date.getDate() || '').padStart(2,'0'),
    ].join('')
  },
  
  makeFile(yyyymmdd, srchQuery){
    
    const imgDir = `./images/${yyyymmdd}`;
    if (!fs.existsSync(imgDir)) {
        fs.mkdirSync(imgDir)
    }
    const imgDir2 = `./images/${yyyymmdd}/${srchQuery}`;
    if (!fs.existsSync(imgDir2)) {
        fs.mkdirSync(imgDir2)
    }
  },

  processCnt: 0,
  async getImgByUrl(searchQuery, target, number=0, yyyymmdd){
    try{
      // const $ = await this.urlImageRequest(target.url)
      const imgSrc = target.url
      let exten = String(imgSrc||'').replace(/.*\./g,'')
      if(exten.length > 4) return
      exten == 'orig'? 'jpg': exten

      this.download(
        imgSrc
        , `images/${yyyymmdd}/${searchQuery}/${target.query}_${number}.${exten}`, (param, uri)=>{
          this.processCnt++
          console.log('done',`${this.processCnt}`, param, uri)
      })
      
    }catch(err){
      console.log('getImgError', imgSrc)
    }
    return
  },

  writeFile(fileName, str='') {
    fs.writeFile(fileName, str, 'utf8', (error, data)=>{
        if(error) { throw error }
        console.log(`${fileName} ASync Write Complete`)
      })
  },

  download(uri, filename, callback) {
    request({
        uri: uri,
        method: 'HEAD',
        timeout: 7000
      }, function (err, res, body) {
      if(!res) return
      request(uri).pipe(fs.createWriteStream(filename)).on('close', ()=>callback(filename, uri))
    })
  },

  async urlImageRequest(url) {
    return new Promise(function (resolve, reject) {
      const options = {
        url: url,
        header : {'User-Agent':"Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/43.0.2357.134 Safari/537.36"},
        timeout: 7000,
      }  
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