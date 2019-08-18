require('babel-polyfill')
const request = require('request')
const cheerio = require('cheerio')
const Common = require('./common')
const urlencode = require('urlencode')

module.exports = {
  
  // const url = 'https://www.google.com/search?newwindow=1&biw=757&bih=578&tbm=isch&sa=1&ei=s65PXb3FGdnh-AbC35jABw&q=%EA%B0%A4%EB%9F%AD%EC%8B%9C%EB%85%B8%ED%8A%B810&oq=%EA%B0%A4%EB%9F%AD%EC%8B%9C%EB%85%B8%ED%8A%B810&gs_l=img.3...0.0..6957...0.0..0.0.0.......0......gws-wiz-img.RIZqv7ZBCZo&ved=0ahUKEwj96uTbkfrjAhXZMN4KHcIvBngQ4dUDCAY&uact=5'
  async getImageUrlListGoogleSearch(srchKeyword){
    const encodedKeyword = urlencode(srchKeyword)
    const url = `https://www.google.com/search?tbm=isch&q=${encodedKeyword}&oq=${encodedKeyword}`
    let list = []
    try {
      const $ = await this.urlRequest(url)
      if(!$) return

      list = $.html().match(/http.*?\&/g).filter((obj)=>{
        if(!obj) return false
        else if(obj.indexOf("'") != -1 || obj.indexOf('"') != -1) return false
        else if(obj.indexOf('http://') == -1 && obj.indexOf('https://') == -1) return false
        else if(!obj.match(/\.(jpg|png|jpeg|gif)\&$/)) return false
        return true
      }).map((obj)=>obj.replace(/\&$/,''))
      // Common.writeFile('test.html', list.join('\n'))
      
    } catch (error) {
      console.log('error', url, error)
    }
    
    return list

  },


  urlRequest(url, headers={}) {
    return new Promise(function (resolve, reject) {
      request({
        url,
        headers: {
          'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3',
          // 'accept-encoding': 'gzip, deflate, br',
          'accept-language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
          'referer': "https':/'/www.google.com/",
          'sec-fetch-mode': 'navigate',
          'sec-fetch-site': 'same-origin',
          'sec-fetch-user': '?1',
          'upgrade-insecure-requests': 1,
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.100 Safari/537.36',
          'x-client-data': 'CIe2yQEIpbbJAQjEtskBCKmdygEIqKPKAQjiqMoBCJetygEIza3KAQjJr8oB',
          ...headers
        }
      }, function (error, response, body) {
        try {
          if (error || !body) reject('Unexpected Error :::')
          else{
            let $ = cheerio.load(body)
            resolve($)
          }

        } catch(e) {
          console.log('request Error :::', e)
          reject('request Error :::')
        }
      })
    })
  },

  urlRequestWithHeaders(url, headers={}) {
    // const query = url.replace(/query\=(.*?)\&/,'$1')
    const before = url.replace(/(.*query\=)(.*?)(\&.*)/,'$1')
    const query = url.replace(/(.*query\=)(.*?)(\&.*)/,'$2')
    const after = url.replace(/(.*query\=)(.*?)(\&.*)/,'$3')
    const thisUrl = before + urlencode(query) + after
    console.log('thisUrl', thisUrl)
    return new Promise(function (resolve, reject) {
      request({
        url: thisUrl,
        headers: {
          ...headers
        }
      }, function (error, response, body) {
        try {
          if (error || !body) reject('Unexpected Error :::')
          else{
            let $ = cheerio.load(body)
            resolve($)
          }

        } catch(e) {
          console.log('request Error :::', e)
          reject('request Error :::')
        }
      })
    })
  },

}