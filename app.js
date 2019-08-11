const express = require('express')
const path = require('path')
const bodyParser = require('body-parser')
const Common = require('./common')
const ServerUtil = require('./ServerUtil')
const customVariable = require('./customVariable')
const app = express()
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json({limit: '1000kb'}))
app.use(express.static(path.join(__dirname, 'dist')));
const fs = require('fs')

// https://datalab.naver.com/keyword/realtimeList.naver
// https://www.google.co.kr/imghp?hl=ko
// 이미지압축
// https://www.iloveimg.com/ko/compress-image

app.listen(3000, function () {
  console.log('app listening on port 3000!!')
})

app.get('/', (req, res)=>{
  res.render('index.html')
})

app.post('/makrFolder', (req, res)=>{
  const param = req.body || {}

  // 1. make folder
  Common.makeFile(param.yyyymmdd, param.key)
  res.send({})
})

app.post('/getImageList', async (req, res)=>{
  const param = req.body || {}

  const addKeywordList = customVariable.getAddKeywordList()
  let targetJson = []
  for await(const addKey of addKeywordList){
    const thisKey = `${param.key} ${addKey}`
    const tempList = await ServerUtil.getImageUrlListGoogleSearch(thisKey)
    tempList.map((url)=>{
      targetJson.push({
        url, query: thisKey
      })
    })
  }

  targetJson = targetJson.reduce((entry, obj)=>{
    const dupObj = entry.find((entryObj)=>{
      return entryObj.url == obj.url
    })
    if(!dupObj) entry.push(obj)
    return entry
  }, [])

  res.send({list: targetJson})
})

app.post('/makeImage', async (req, res)=>{
  const param = req.body || {}
  await Common.getImgByUrl(
    param.key, 
    {
      url: param.url,
      query: param.query
    }, 
    param.number,
    param.yyyymmdd
  )
  res.send({result: 'success'})
})

app.post('/splitFolder', (req,res)=>{
  const param = req.body || {}

  const testFolder = `./images/${param.yyyymmdd}/${param.key}`
  fs.readdir(testFolder, (err, files) => {
    files.sort(function(file1, file2) {
      return fs.statSync(testFolder+'/'+file2).size - fs.statSync(testFolder+'/'+file1).size
    })
    let folderNm = ''
    files.forEach((file, index) => {
      if(index%50 == 0){
        // make folder
        folderNm = String(testFolder+'/'+index)
        if (!fs.existsSync(folderNm)) {
          fs.mkdirSync(folderNm)
        }
      }
      // fs.rename(getFileName, __dirname + '/new_folder/' + getFileName)
      fs.rename(testFolder+'/'+file, folderNm+'/'+file, (err)=>{
        err && console.log('error',err)
      })
      // console.log(file, fs.statSync(testFolder+'/'+file).size, index)
    });
  });
})

app.post('/imageFilter', (req,res)=>{
  const param = req.body || {}
  
  const testFolder = `./images/${param.yyyymmdd}/${param.key}`
  fs.readdir(testFolder, (err, files) => {
    files.sort(function(file1, file2) {
      return fs.statSync(testFolder+'/'+file2).size - fs.statSync(testFolder+'/'+file1).size
    })
    let prevSize = 0
    files.forEach((file, index) => {
      
      const currentFileSize = fs.statSync(testFolder+'/'+file).size
      // 동일 파일 사이즈면 삭제
      if(currentFileSize == prevSize){
        removeFile(testFolder+'/'+file, 'samesize')

      // 20kb 보다 작으면 삭제
      }else if(currentFileSize < 20000){
        removeFile(testFolder+'/'+file, 'under 20000')
      }
      prevSize = currentFileSize
    })
  })
})

function removeFile(url, reason=''){
  fs.unlink(url, (err) => {
    if (err) throw err;
    console.log(`${url} was deleted // ${reason}`);
  })
}
