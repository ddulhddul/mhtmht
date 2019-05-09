const express = require('express')
const bodyParser = require('body-parser')
const Common = require('./common')
const app = express()
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

async function callMain(url) {
  const parentBaseUrl = 'https://www.google.com'
  const $ = await Common.urlRequest(url)
  let number = 0
  for(let img of Array.from($('.images_table img'))){
    if(number > 20) break
    const src = img.attribs.src
    const href = String(img.parent.attribs.href||'').replace(/\&amp;/g,'&')
    console.log(`${number} : `, parentBaseUrl+href)
    number++
    // Common.download(
    //   src
    //   , `images/${number}.png`, function(){
    //   console.log('done '+number)
    // })
  }
  // Common.writeFile('test.html', $.html())
}

app.listen(3000, function () {
  
  // callMain()

  Common.makeFileByUrl(
    'test.html',
    "https://www.google.co.in/search?q="+encodeURI('검색어')+"&source=lnms&tbm=isch"

  )
  console.log('app listening on port 3000!!')
})