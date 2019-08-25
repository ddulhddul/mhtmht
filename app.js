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

// DB
const mongoose = require('mongoose')
mongoose.set('useNewUrlParser', true)
mongoose.Promise = require('bluebird')
const db = mongoose.connection
db.on('error', console.error)
db.once('open', function () {
  console.log('Connected to mongod server')
})
mongoose.connect('mongodb://127.0.0.1/chartdb')
const DBUtil = require('./mongodb/DBUtil')

// webpack
console.log('process.env.NODE_ENV', process.env.NODE_ENV)
if (process.env.NODE_ENV !== 'production') {
  const webpack = require('webpack')
  const config = require('./webpack.config')
  const compiler = webpack(config)
  app.use(require('webpack-dev-middleware')(compiler, {
    noInfo: true, publicPath: config.output.publicPath
  }))
  app.use(require('webpack-hot-middleware')(compiler))
}

// https://datalab.naver.com/keyword/realtimeList.naver
// https://www.google.co.kr/imghp?hl=ko
// 이미지압축
// https://www.iloveimg.com/ko/compress-image

app.listen(4000, function () {
  console.log('app listening on port 4000!!')
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
      if(!fs.lstatSync(testFolder+'/'+file).isDirectory()){
        fs.rename(testFolder+'/'+file, folderNm+'/'+file, (err)=>{
          err && console.log('error',err)
        })
      }
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
    const overSizedFile = []
    files.forEach((file, index) => {
      
      const currentFileSize = fs.statSync(testFolder+'/'+file).size
      // 동일 파일 사이즈면 삭제
      if(currentFileSize == prevSize){
        removeFile(testFolder+'/'+file, 'samesize')

      // 50kb 보다 작으면 삭제
      }else if(currentFileSize < 51200){
        removeFile(testFolder+'/'+file, 'under 50000')
      
      }else{
        // 압축 필요한지 ? 10mb
        if(currentFileSize >= 10240000){
          overSizedFile.push(file)
        }
      }
      prevSize = currentFileSize
    })
    
    if(overSizedFile.length){
      compressImgs(overSizedFile, testFolder)
    }
  })
})

// const compress_images = require('compress-images')
function compressImgs(list, testFolder){
  const compressDir = `${testFolder}/compress`;
  if (!fs.existsSync(compressDir)) {
    fs.mkdirSync(compressDir)
    console.log('compress dir created')
  }

  // INPUT_path_to_your_images = 'src/img/**/*.{jpg,JPG,jpeg,JPEG,png,svg,gif}';
  // OUTPUT_path = 'build/img/';
  
  // https://www.npmjs.com/package/compress-images
  list.map((inputFile)=>{
    // fs.createReadStream(compressDir+'/'+inputFile).pipe(fs.createWriteStream(testFolder+'/'+inputFile))
    fs.rename(testFolder+'/'+inputFile, compressDir+'/'+inputFile, (err) => {
      if (err) throw err;
      console.log('move', inputFile);
    });    

    // console.log('inputFile',inputFile)
    // compress_images(testFolder+'/'+inputFile, compressDir+'/', {compress_force: false, statistic: true, autoupdate: true}, false,
    //     {jpg: {engine: 'mozjpeg', command: ['-quality', '60']}},
    //     {png: {engine: 'pngquant', command: ['--quality=20-50']}},
    //     {svg: {engine: 'svgo', command: '--multipass'}},
    //     {gif: {engine: 'gifsicle', command: ['--colors', '64', '--use-col=web']}}, function(error, completed, statistic){
    //   console.log('-------------');
    //   console.log(error);
    //   console.log(completed);
    //   console.log(statistic);
    //   console.log('-------------');                                   
    // })
  })


}

function removeFile(url, reason=''){
  fs.unlink(url, (err) => {
    if (err) throw err;
    console.log(`${url} was deleted // ${reason}`);
  })
}

app.post('/srchInfoUrl', async (req, res)=>{
  const param = req.body || {}

  let result = {}
  try {
    const $ = await ServerUtil.urlRequestWithHeaders(param.infoUrl, {
      'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3',
      'accept-language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
      'cache-control': 'max-age=0',
      'if-none-match': 'nexearch^^^1^20170905114306^^1^1566079328936^1-1566085655639',
      'sec-fetch-mode': 'navigate',
      'sec-fetch-site': 'none',
      'sec-fetch-user': '?1',
      'upgrade-insecure-requests': '1',
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.100 Safari/537.36',
    })

    let list = $('.profile_dsc dt, .profile_dsc dd')
    const summary = []
    for (let index = 0; index < list.length; index++) {
      const element = list[index]
      if($(element).prop('tagName') == 'DT') summary.push(' ')
      summary.push($(element).text())
    }
    result.summary = summary

    list = $('.workact_dsc .workact')
    let subSummary = []
    for (let index = 0; index < list.length; index++) {
      const element = list[index]
      subSummary.push(' ')
      subSummary.push($(element).find('h3').text())
      // subSummary.push($(element).find('ul').text())
      const sublist = $(element).find('li')
      for (let i = 0; i < sublist.length; i++) {
        const subelement = sublist[i]
        subSummary.push($(subelement).text())
      }
    }
    result.subSummary = subSummary
    
  } catch (error) {
    console.log('error', error, param)
  }

  res.send(result)
})


app.post('/listMht', async (req, res)=>{
  const param = req.body || {}

  const list = await DBUtil.listMht(param)
  res.send({ list })
})

app.post('/updateMht', async (req, res)=>{
  const param = req.body || {}

  await DBUtil.updateMht(param)
  res.send({ result: 'SUCCESS' })
})

app.post('/changeDone', async (req, res)=>{
  const param = req.body || {}

  await DBUtil.changeDone(param)
  res.send({ result: 'SUCCESS' })
})