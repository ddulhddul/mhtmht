<template>
  <div>
    
    <h1>므흣흣</h1>
    <br>
    <!-- https://datalab.naver.com/keyword/realtimeList.naver -->
    <a href="https://datalab.naver.com/keyword/realtimeList.naver" target="_blank">https://datalab.naver.com/keyword/realtimeList.naver </a>
    <br>
    <h4>{{`D:\\dev\\mhtmht\\images\\${yyyymmdd}`}}</h4>
    <div>
      <input v-model="key" autofocus @keypress.enter="startStep1()" ref="inputKey" />
      <button @click="startStep1()">Go</button>
    </div>
    <!-- <Step2 :fileList="fileList" @updateJsonList="updateJsonList" /> -->

    <div v-if="urlList && urlList.length" style="margin:30px;">
      <!-- <button v-if="buttonShow" @click="process(0, true)">Go</button> -->
      <h3>남은 수량 : {{ urlList.filter((obj, index)=>!successObj[index]).length }}</h3>
      <table>
        <template v-for="(obj, index) in urlList">
          <tr v-if="!successObj[index]" :key="`url_${obj.url}`">
            <td style="color:red">
              <label v-if="successObj[index]">
                OK
              </label>
            </td>
            <td>{{ obj.query }}</td>
            <td>{{ obj.url }}</td>
          </tr>
        </template>
      </table>

    </div>

    <br>
    <div style="margin-top: 5px;">
      <button @click="imageFilter()">이미지 정리</button>
    </div>

    <br>
    <button @click="splitFolder()">splitFolder</button>
    
  </div>
</template>

<script>
import axios from 'axios'
export default {
  data(){
    return {
      key: '',
      yyyymmdd: this.getYyyymmdd(),
      fileList: [],
      jsonList: [],
      urlList: [],
      successObj: {}
    }
  },
  methods: {
    getYyyymmdd(){
      const date = new Date()
      return [
        date.getFullYear(),
        String(date.getMonth()+1 || '').padStart(2,'0'),
        String(date.getDate() || '').padStart(2,'0'),
      ].join('')
    },

    // make folder
    startStep1(){
      if(!this.key) return
      this.$refs.inputKey.blur()
      axios({
        method: 'POST',
        url: "/makrFolder",
        data: {
          key: this.key,
          yyyymmdd: this.yyyymmdd
        }
      }).then((res)=>{
        console.log('startStep1 end')
        this.getImageList()
      })
    },

    getImageList(){
      axios({
        method: 'POST',
        url: '/getImageList',
        data: {
          key: this.key
        }
      }).then((res)=>{
        this.urlList = res.data.list || []
        console.log('this.urlList', this.urlList)
        // image download start
        if(this.urlList.length) this.imageDownloadProcess(0, true)
      })
    },

    async imageDownloadProcess(number=0, nextProcessTf){
      const target = this.urlList[number]
      if(!target) return
      const res = await axios({
        method: 'POST',
        url: '/makeImage',
        data: {
          ...target,
          key: this.key,
          yyyymmdd: this.yyyymmdd,
          number
        }
      }).catch((res)=>{
        console.log('target',target)
        alert('error')
      })
      console.log('res',res)
      let temp= {
        ...this.successObj
      }
      temp[number] = true
      this.successObj =temp

      if(nextProcessTf){
        await this.imageDownloadProcess(number+1, nextProcessTf)
      }
    },

    splitFolder(){
      axios({
        method: 'POST',
        url: '/splitFolder',
        data: {
          key: this.key,
          yyyymmdd: this.yyyymmdd
        }
      }).then((res)=>{
        alert('success')
      })
    },

    imageFilter(){
      axios({
        method: 'POST',
        url: '/imageFilter',
        data: {
          key: this.key,
          yyyymmdd: this.yyyymmdd
        }
      }).then((res)=>{
        alert('success')
      })
    }
  }
}
</script>