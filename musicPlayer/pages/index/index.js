//index.js
//获取应用实例
const app = getApp()
const music = wx.getBackgroundAudioManager()
// const db = wx.cloud.database({   
//   env: 'cming-3gw2g43181571461'
// })

const util = require('../../utils/util.js');
Page({
  data: {
    userInfo: {},
    hasUserInfo: false,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    musicswitch: false,
    music_now: 0,
    music_list: [],
    music_list_index_arr: [],
    random_list: [],
    random_index: 0,
    comment_list:[],
    musicIsPause: false,
    comment_view: false,
    maskShow: false,
    comment: '',
    play_mode: 1,//1:顺序播放;2:单曲循环;3:随机播放;4:我的列表

    my_list_show: false,
    my_list: [],

    count: 1,


  },
  //事件处理函数
  bindViewTap: function() {
    wx.navigateTo({
      url: '../logs/logs'
    })
  },
  //生命周期：加载完后
  onLoad: function () {
    //取歌曲列表
    this.getMusic();
    //取评论列表
    this.getComment();
    //取用户信息
    this.getUserInfo();
    music.onEnded(() => {
      if(this.data.play_mode==1){
        //顺序播放
        if(this.data.music_list.length>this.data.music_now.index+1){
          let nextSong = this.data.music_list[this.data.music_now.index+1];
          nextSong.index = this.data.music_now.index+1;
          music.src = nextSong.url;
          music.title = nextSong.title;
          music.singer = nextSong.singer;
          this.setData({music_now : nextSong});
          // index++; 
        }else{
          //全部播完了
          this.setData({music_now : 0});
        }
      }else if(this.data.play_mode==2){
        //单曲循环
        music.src = this.data.music_now.url;
        music.title = this.data.music_now.title;
        music.singer = this.data.music_now.singer;
        // this.setData({music_now : this.data.music_now});
      }else if(this.data.play_mode==3){
        //随机播放
        if(this.data.random_list.length){
          let nextSong = this.data.music_list[this.data.random_list[0]];
          music.src = nextSong.url;
          music.title = nextSong.title;
          music.singer = nextSong.singer;
          this.data.random_list.splice(0,1);
          this.setData({music_now : nextSong});
          console.log(this.data.music_now);
        }else{
          //全部播完了
          this.setData({music_now : 0});
        }
      }else if(this.data.play_mode==4){
        if(this.data.my_list.length){
        //循环播放我的列表
          let index = this.data.my_list.findIndex((el) => {
            return el.id === this.data.music_now.index
          });
          if(index<this.data.my_list.length-1){
            var nextSong = this.data.my_list[index+1];
            nextSong.index = nextSong.id;
          }else{
            var nextSong = this.data.my_list[0];
            nextSong.index = nextSong.id;
          }
          music.src = nextSong.url;
          music.title = nextSong.title;
          music.singer = nextSong.singer;
          this.setData({music_now : nextSong});
        }else{
          this.setData({music_now : 0});
          music.stop();
          wx.showToast({
            title: '列表无歌啦',
            icon: 'none'
          });
        }
      }
    
    });  
    wx.onBackgroundAudioPause((res) => {
      this.setData({musicIsPause: true});
    });
    wx.onBackgroundAudioPlay((res) => {
      this.setData({musicIsPause: false});
    });
    wx.onBackgroundAudioStop((res) => {
      this.setData({musicIsPause: true});
    });
  },
  //取歌曲列表
  getMusic: function() {
    wx.cloud.callFunction({
      name: 'getMusic',
      complete: res =>{
        let arr = new Array();
        for (let i = 0; i < res.result.length; i++) {
          arr.push(i);
        }
        this.setData({music_list: res.result,music_list_index_arr: arr});
      }
    })    
  },
  //取评论列表
  getComment: function() {
    wx.cloud.callFunction({
      name: 'getComment',
      complete: res =>{
        this.setData({comment_list: res.result});
      }
    })
  },
  //取用户信息
  getUserInfo: function() {
    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo: true
      })
    } else if (this.data.canIUse){
      // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
      // 所以此处加入 callback 以防止这种情况
      app.userInfoReadyCallback = res => {
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        })
      }
    } else {
      // 在没有 open-type=getUserInfo 版本的兼容处理
      wx.getUserInfo({
        success: res => {
          app.globalData.userInfo = res.userInfo
          this.setData({
            userInfo: res.userInfo,
            hasUserInfo: true
          })
        }
      })
    }
  },
  //生成随机播放顺序的数组
  setRandomList: function(){
        //若选择随机播放，打乱music_list_index_arr顺序
        this.data.music_list_index_arr.sort((a, b) =>{
          return Math.random()>.5 ? -1 : 1;
          //用Math.random()函数生成0~1之间的随机数与0.5比较，返回-1或1
      })

      if(typeof this.data.music_now.index!='undefined'){
        //过滤掉当前播放的歌
        let i = this.data.music_list_index_arr.findIndex(item => item === this.data.music_now.index);
        if(i!=-1){
          let temp = JSON.parse(JSON.stringify(this.data.music_list_index_arr));
          temp.splice(i,1);
          this.setData({random_list: temp,random_index: 0});
        }
      }else{
        this.setData({random_list:this.data.music_list_index_arr});
      }    
  },
  //切换播放模式
  changeMode: function(e){
    let mode = e.currentTarget.dataset.mode;
    if(mode===this.data.play_mode){
      return false;
    }else{
      console.log(mode);
      if((mode==1||mode==2)&&this.data.play_mode==4){
        console.log(this.data.music_now);
      }
      if(mode==3){
        //生成随机播放顺序的数组
        this.setRandomList();
      }
      this.setData({play_mode: mode});
      wx.showToast({
        title: mode==1?'顺序播放':mode==2?'单曲循环':mode==3?'随机播放':'',
        icon: 'success',
      })      
    }

  },
  //选音乐
  selectMusic: function(e){
    if(this.data.play_mode==4){
      let item = e.currentTarget.dataset.item;
      let index = e.currentTarget.dataset.index;
      item.index = index;
      music.src = item.url;
      music.title = item.title;
      music.singer = item.singer;
      this.setData({music_now : item,play_mode: 1});
    }else{
      let item = e.currentTarget.dataset.item;
      let index = e.currentTarget.dataset.index;
      item.index = index;
      if(item.title===this.data.music_now.title){
        if(!music.src){
          music.src = item.url;
        }else{
          music.play();        
        }
        this.setData({musicIsPause: false});
      }else{
        music.src = item.url;
        music.title = item.title;
        music.singer = item.singer;
        this.setData({music_now : item});
      }
      if(this.data.play_mode==3){
          //生成随机播放顺序的数组
          this.setRandomList();       
      }      
    }

  },
  //下一首
  changeNextSong: function(){
    if(this.data.play_mode==1||this.data.play_mode==2){
      //顺序播放&&单曲循环
      if(this.data.music_list.length>this.data.music_now.index+1){
        let nextSong = this.data.music_list[this.data.music_now.index+1];
        nextSong.index = this.data.music_now.index+1;
        music.src = nextSong.url;
        music.title = nextSong.title;
        music.singer = nextSong.singer;
        this.setData({music_now : nextSong});
        // index++; 
      }else{
        //全部播完了
        console.log('hi');
        wx.showToast({
          title: '已无下一首',
          icon: 'none',
        })
      }
    }else if(this.data.play_mode==3){
      //随机播放
      if(this.data.random_list.length){
        let nextSong = this.data.music_list[this.data.random_list[0]];
        music.src = nextSong.url;
        music.title = nextSong.title;
        music.singer = nextSong.singer;
        this.data.random_list.splice(0,1);
        this.setData({music_now : nextSong});
      }else{
        //全部播完了
        wx.showToast({
          title: '已无下一首',
          icon: 'none',
        })
      }
    }else if(this.data.play_mode==4){
      if(this.data.my_list.length){
        //循环播放我的列表
        let index = this.data.my_list.findIndex((el) => {
          return el.id === this.data.music_now.index
        });

        if(index<this.data.my_list.length-1){
          var nextSong = this.data.my_list[index+1];
          nextSong.index = nextSong.id;

        }else{
          var nextSong = this.data.my_list[0];
          nextSong.index = nextSong.id;
        }
        music.src = nextSong.url;
        music.title = nextSong.title;
        music.singer = nextSong.singer;
        this.setData({music_now : nextSong});          
      }else{
        this.setData({music_now : 0});
        music.stop();
        wx.showToast({
          title: '列表无歌啦',
          icon: 'none'
        });        
      }    
    }
  },
  //暂停音乐
  pauseMusic: function(){
    music.pause();
    this.setData({musicIsPause: true});
  },
  //打开写评论页面
  showComment: function(){
    console.log(this.data.userInfo.avatarUrl);
    this.setData({comment_view: true});
  },
  //隐藏写评论页面
  hideComment: function(){
    this.setData({comment_view: false,comment: ''});
  },
  //数据双向绑定
  setComent: function(e){
    this.setData({comment: e.detail.value});
  },
  //写入评论
  sendComment: function(){
    // this.pic2Base64(this.data.userInfo.avatarUrl,(avatar)=>{
      let data = {
        date: util.formatTime(new Date()),
        name: this.data.userInfo.nickName||'匿名',
        comment: this.data.comment,
        avatar: this.data.userInfo.avatarUrl,
      }
      if(data.comment==''){
        wx.showToast({
          title: '先说点什么吧~',
          icon: 'none',
        })
      }else{
        this.setData({'maskShow':true});
        console.log('正在上传');
        wx.cloud.callFunction({
          name: 'setComment',
          data: data,
          complete: res =>{
            this.setData({'maskShow':false});
          },
          success: res =>{
            wx.showToast({
              title: '评论成功',
              icon: 'success',
            })
            this.hideComment();
            this.getComment();            
          },
          fail: err =>{
            wx.showToast({
              title: err.errMsg,
              icon: 'none',
            })            
          }
        })
      }
    // });
  },
  //网路图片转base64
  pic2Base64: function(url,fn){
    wx.downloadFile({
      url: url,
      success(res) {
        wx.getFileSystemManager().readFile({
          filePath: res.tempFilePath,
          encoding: 'base64',
          success: function (r) {
            fn(r)
          },
          fail: function(err){
            console.log(err)
          }
        });      
      }
    })
  },
  //隐藏我的播放列表
  hideMyList: function(){
    this.setData({'my_list_show': false});
  },
  //展开我的播放列表
  showMyList: function(){
    this.setData({'my_list_show': true});
  },
  //互斥函数，无意义
  nothing: function(){
    return true;
  },
  //往我的播放列表添加音乐
  setMyList: function(e){
    let item = e.currentTarget.dataset.item;
    item.id = this.data.count;
    this.data.my_list.push(item);
    this.setData({'my_list': this.data.my_list,'count':this.data.count+1});
    wx.showToast({
      title: '加左啦~',
      icon:'success',
    });
  },
  //循环播放我的播放列表
  playMyList: function(){
    if(this.data.my_list.length){
      let item = this.data.my_list[0];
      item.index = this.data.my_list[0].id;
      music.src = item.url;
      music.title = item.title;
      music.singer = item.singer;
      this.setData({music_now : item,play_mode: 4});      
    }else{
      wx.showToast({
        title: '请先添加音乐',
        icon: 'none',
      })
    }
  },
  //我的播放列表里删除音乐
  removeMyList: function(e){
    let index = e.currentTarget.dataset.index;
    // let item = e.currentTarget.dataset.item;

    this.data.my_list.splice(index,1);
    this.setData({my_list:this.data.my_list});
  },
  //上传音乐
  uploadfile:function(e) {
    wx.chooseMessageFile({
      count: 1, //可选择最大文件数 （最多100）
      type: 'all', //文件类型，all是全部文件类型
      success(res) {
        const filePath = res.tempFiles[0].path //文件本地临时路径
        console.log(res)
        // 上传文件
        const cloudPath = 'music/' + filename //云存储路径
        console.log(cloudPath)
        wx.cloud.uploadFile({
          cloudPath,
          filePath,
          success: resa => {
            console.log(resa.fileID)
            const db = wx.cloud.database()
            //把文件名和文件在云存储的fileID存入filelist数据表中
            db.collection('filelist').add({
              data: {
              filename: filename,
              fileid: resa.fileID,
              },
            })    
          },
          fail: e => {
            wx.showToast({
              icon: 'none',
              title: '上传失败',
            })
          },
        })
      }
    })
  },
})
