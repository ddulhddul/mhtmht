<template>
  <div style='max-width: 600px; width: 100%;'>
    <b-tabs content-class="mt-3 wrap-b-tabs">
      <b-tab title="History">
        <button @click="listMht()">Search</button>
        <br><br>
        <div style="margin-left: 10px;">
          <table style="table-layout: fixed;">
            <colgroup>
              <col width="25%;" />
              <col width="25%;" />
              <col width="25%;" />
              <col width="25%;" />
            </colgroup>
            <tbody>
              <tr v-for="(mht, index) in mhtList" :key="mht.key+'_'+index" @click="changeUrlList(mht)" :style="{color: mht.key==key? 'red': 'black'}">
                <td>{{ mht.key }}</td>
                <td>{{ mht.yyyymmdd }}</td>
                <td>
                  &nbsp;
                  {{ (mht.urlList||[]).filter((obj)=>obj.deleted).length }} /
                  {{ (mht.urlList||[]).filter((obj)=>!obj.deleted).length }}
                </td>
                <td>
                  <input type=checkbox :checked="mht.done" @click="changeDone(mht)" />
                </td>
              </tr>
            </tbody>
          </table>
          <br>
        </div>
      </b-tab>
      <b-tab title="Srch">
        <div>
          <input v-model="key" autofocus @keypress.enter="getImageList()" ref="inputKey" style="width: calc(100% - 170px);" />
          <button @click="getImageList()">Go</button>
          <button @click="showImage=!showImage">showImage</button>
          
        </div>
        
        <div class="row" v-if="showImage">
          <template v-for="(obj, index) in urlList">
            <div v-if="index < imageUnit*30" class="column" :key="index+'_1'" @click="deleteImage(obj)"
              :class="{deleted: obj.deleted}"
            >
              <img :src="obj.url" style="width: 100%; min-height: 100px;" :style="{opacity: obj.deleted? 0.6: 1}" />
            </div>
          </template>
        </div>

        <div style="text-align:center; margin-bottom: 30px;">
          <button @click="imageUnit=imageUnit+1">more({{ imageUnit*30 }})</button>
          <span>{{ urlList.filter((obj)=>obj.deleted).length }}</span>
          <span> / </span>
          <span>{{ urlList.filter((obj)=>!obj.deleted).length }}</span>
          <button @click="update()">Update</button>
          <span> / </span>
          <button @click="goUp()">Top</button>
        </div>

      </b-tab>
      <b-tab title="filteredList">
        <h4>{{ urlList.filter((obj)=>!obj.deleted).length }} {{ key }}</h4>
        <textarea :value="urlList.filter((obj)=>!obj.deleted).map((obj)=>obj.url).join('\n')" class="textarea" />
      </b-tab>
      <b-tab title="list">
        <div>
          <input v-model="summarySearch" @keypress.enter="addSummary()" ref="summarySearchInput" style="width: calc(100% - 170px);" />
          <button @click="addSummary()">Add</button>
          <button @click="getSummary({pageIndex:1})">Search</button>
        </div>
        <div style="text-align:center; margin-bottom: 30px;">
          <button @click="doneFilter('T')" :style="{color: doneFilterTf=='T'? 'blue': ''}">Done T</button>
          <button @click="doneFilter('F')" :style="{color: doneFilterTf=='F'? 'blue': ''}">Done F</button>
        </div>
        <div class="wrap-contents">
          <Scroll-Table
            :list="summaryList"
            :page-object="summaryPageObject"
            @search="getSummary"
          >
            <colgroup slot="colgroup">
              <col width="70%">
              <col width="30%">
            </colgroup>
            <template slot="thead">
              <tr>
                <td>Name</td>
                <td>Done</td>
              </tr>
            </template>
            <template slot="tbody">
              <tr
                v-for="summary in summaryList"
                :key="summary._id"
                :style="{'background-color': !summary.done? 'beige': 'white'}"
              >
                <td>{{ summary.key }}</td>
                <td>
                  <button @click="changeSummaryDone(summary)">{{ summary.done }}</button>
                </td>
              </tr>
            </template>
          </Scroll-Table>
        </div>
      </b-tab>
    </b-tabs>
  </div>
</template>
<script>
import axios from 'axios'
import ScrollTable from './common/ScrollTable.vue'

export default {
  components: {
    ScrollTable
  },
  data(){
    return {
      mhtList: [],
      
      key: '',
      yyyymmdd: '',
      urlList: [],
      showImage: true,
      imageUnit: 1,

      filterText: '',

      summarySearch: '',
      summaryList: [],
      summaryPageObject: {},
      doneFilterTf: '',
    }
  },
  methods: {

    goUp () {
      window.scrollTo(0, 0)
    },

    doneFilter(param){
      if(this.doneFilterTf == param){
        this.doneFilterTf = ''
      }else{
        this.doneFilterTf = param
      }
      this.getSummary({pageIndex: 1})
    },

    async changeSummaryDone (summary) {
      const res = await axios({
        url: '/changeSummaryDone',
        params: {
          ...summary,
          done: !summary.done
        }
      })
      console.log('changeSummaryDone', res)
      if (res.data.result !== 'SUCCESS') {
        alert('error')
        return
      }
      summary.done = !summary.done
      if(summary.done) {
        this.key = summary.key
        this.getImageList()
      }
    },
    
    async getSummary (param = {}) {
      const res = await axios({
        url: '/listSummary',
        params: { 
          ...param, 
          key: this.summarySearch,
          doneFilterTf: this.doneFilterTf
        }
      })
      const list = res.data.list || []
      console.log('listsummary call', res.data)
      this.summaryList = param.pageIndex === 1 ? list : this.summaryList.concat(list)
      this.summaryPageObject = res.data.pageObject || {}
    },

    async addSummary () {
      if(!this.summarySearch) return
      const res = await axios({
        url: '/insertSummary',
        params: {
          key: this.summarySearch
        }
      })
      console.log('insertSummary', res)
      if (res.data.result !== 'SUCCESS') {
        alert('error')
        return
      }
      this.summarySearch = ''
      this.getSummary({ pageIndex: 1 })
        
    },

    changeDone(obj){
      axios({
        method: 'POST',
        url: "/changeDone",
        data: {
          key: obj.key,
          done: !obj.done
        }
      }).then((res)=>{
        this.listMht()
      })
    },

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
          yyyymmdd: this.getYyyymmdd(),
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
      this.imageUnit = 1
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

.wrap-contents {
  width: 100%;
  /* height: calc(100% - 60px); */
  height: 400px;
}
.tab-pane {
  min-height: 300px;
}
</style>