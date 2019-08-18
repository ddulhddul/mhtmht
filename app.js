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

const webpack = require('webpack')
const config = require('./webpack.config')
const compiler = webpack(config)
app.use(require('webpack-dev-middleware')(compiler, {
  noInfo: true, publicPath: config.output.publicPath
}))
app.use(require('webpack-hot-middleware')(compiler))

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
