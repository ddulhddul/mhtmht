<template>
  <div>
    
    <h1>므흣흣</h1><br>
    <div>
      <a href="https://datalab.naver.com/keyword/realtimeList.naver" target="_blank">
        https://datalab.naver.com/keyword/realtimeList.naver
      </a>
    </div><br>
    <div>
      <a href="https://people.search.naver.com" target="_blank">
        https://people.search.naver.com
      </a>
    </div>
    <div>
      <input v-model="infoUrl" @keypress.enter="srchInfoUrl()" ref="infoUrl" />
      <button @click="srchInfoUrl()">정보검색</button>
    </div>
    <!-- <div v-html="infoUrlResult"></div> -->
    <textarea v-model="infoUrlResult" />
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
      infoUrl: 'https://people.search.naver.com/search.naver?where=nexearch&sm=tab_ppn&query=소녀시대태연&os=145072&ie=utf8&key=PeopleService',
      infoUrlResult: '',
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
    },

    srchInfoUrl(){
      if(!this.infoUrl) return
      this.$refs.infoUrl.blur()
      axios({
        method: 'POST',
        url: "/srchInfoUrl",
        data: {
          infoUrl: this.infoUrl
        }
      }).then((res)=>{
        console.log('srchInfoUrl end', res.data)
        this.infoUrlResult = 
          (res.data.summary || []).join('\n') + 
          '\n\n' +
          (res.data.subSummary || []).join('\n')
      })
    }
  }
}
</script>