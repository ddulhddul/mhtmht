<template>
  <div style='max-width: 600px; width: 100%;'>
    <b-tabs content-class="mt-3 wrap-b-tabs">
      <b-tab title="History">
        <button @click="listMht()">Search</button>
        <br><br>
        <div style="margin-left: 10px;">
          <div v-for="(mht, index) in mhtList" :key="mht.key+'_'+index" @click="changeUrlList(mht)" :style="{color: mht.key==key? 'red': 'black'}">
            {{ mht.key }} {{ mht.yyyymmdd }}
          </div>
          <br>
        </div>
      </b-tab>
      <b-tab title="Srch">
        <div>
          <input v-model="key" autofocus @keypress.enter="getImageList()" ref="inputKey" style="width: calc(100% - 170px);" />
          <button @click="getImageList()">Go</button>
          <button @click="update()">Update</button>
        </div>
        <div>
          <button @click="showImage=!showImage">showImage</button>
          &nbsp;&nbsp;&nbsp;&nbsp;
          <span>{{ urlList.filter((obj)=>obj.deleted).length }}</span>
          <span> / </span>
          <span>{{ urlList.filter((obj)=>!obj.deleted).length }}</span>
        </div>
        <div class="row" v-if="showImage">
          <div class="column" v-for="(obj, index) in urlList" :key="index+'_1'" @click="deleteImage(obj)"
            :class="{deleted: obj.deleted}"
          >
            <img :src="obj.url" style="width: 100%; min-height: 100px;" :style="{opacity: obj.deleted? 0.6: 1}" />
          </div>
        </div>
      </b-tab>
      <b-tab title="filteredList">
        <h4>{{ urlList.filter((obj)=>!obj.deleted).length }}</h4>
        <textarea :value="urlList.filter((obj)=>!obj.deleted).map((obj)=>obj.url).join('\n')" class="textarea" />
      </b-tab>
    </b-tabs>
  </div>
</template>
<script>
import axios from 'axios'

export default {
  data(){
    return {
      mhtList: [],
      
      key: '',
      yyyymmdd: '',
      urlList: [],
      showImage: true,

      filterText: ''
    }
  },
  methods: {

    changeUrlList(obj){
      this.key = obj.key
      this.showImage = false
      this.urlList = obj.urlList
    },

    listMht(){
      axios({
        method: 'POST',
        url: "/listMht",
        data: {}
      }).then((res)=>{
        console.log('this.mhtList', res.data.list)
        this.mhtList = (res.data.list || [])
        // .map((obj)=>obj._doc||{})
      })
    },

    update(){
      axios({
        method: 'POST',
        url: "/updateMht",
        data: {
          key: this.key,
          yyyymmdd: this.yyyymmdd,
          urlList: this.urlList
        }
      }).then((res)=>{
        if(res.data.result === 'SUCCESS'){
          alert('sucess')
          this.listMht()
        }else{
          alert('fail')
        }
      })
    },

    deleteImage(param){
      this.urlList = this.urlList.map((obj)=>{
        if(obj.url === param.url){
          obj.deleted = !obj.deleted
        }
        return obj
      })
    },

    getYyyymmdd(){
      const date = new Date()
      return [
        date.getFullYear(),
        String(date.getMonth()+1 || '').padStart(2,'0'),
        String(date.getDate() || '').padStart(2,'0'),
      ].join('')
    },

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
      this.yyyymmdd = ''
      this.urlList = []
      this.showImage = true
      axios({
        method: 'POST',
        url: '/getImageList',
        data: {
          key: this.key
        }
      }).then((res)=>{
        this.yyyymmdd = this.getYyyymmdd()
        this.urlList = res.data.list || []
        console.log('this.urlList', this.urlList)
      })
    },

  }
}
</script>
<style>
.row {
  /* height: 600px; */
  overflow-y: auto;
  width: 100%;
  display: flex;
  flex: 1;
  flex-wrap: wrap;
  padding: 0 4px;
}

/* Create two equal columns that sits next to each other */
.column {
  flex: 50%;
  padding: 0 4px;
  display: block;width: 50%;border-bottom-color: grey;border-bottom-width: 1px;border-bottom-style: dotted;
}

.column img {
  margin-top: 8px;
  vertical-align: middle;
}

.column.deleted {
  background-color: green;
  opacity: 0.2;
}

.textarea {
  height: 500px;
  width: 100%;
}
</style>