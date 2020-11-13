const cloud = require('wx-server-sdk')

cloud.init({
  env: 'cming-3gw2g43181571461'
})

const db = cloud.database()

exports.main = async (event, context) => {
  // collection 上的 get 方法会返回一个 Promise，因此云函数会在数据库异步取完数据后返回结果

  return db.collection('comment').add({
    data: event,
    success: function(res){
      console.log('成功');
      return {
        valid: 1,
        msg: "评论成功",
      }
    },
    fail: function(err){
      console.log('失败');
      return {
        valid: 0,
        msg: "评论失败",
      }
    }
  })
}