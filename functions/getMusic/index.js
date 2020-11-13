const cloud = require('wx-server-sdk')

cloud.init({
  env: 'cming-3gw2g43181571461'
})

const db = cloud.database()
//突破云函数单次查询100条数据限制
//1.首先获得总数
async function getCount() {
 let count = await db.collection('music').count()
 return count;
}
//2.单次查询函数
async function getList(skip){
  let list = await db.collection('music').orderBy('singer','desc').skip(skip).get();
  return list.data;
}

exports.main = async (event, context) => {
  // collection 上的 get 方法会返回一个 Promise，因此云函数会在数据库异步取完数据后返回结果
  let count = await getCount();
  count = count.total;
  let list = [];
  for (let i = 0; i < count; i+=100) {
    list = list.concat(await getList(i));
    return list;
  }
  // return db.collection('music').orderBy('singer', 'asc').get({
  //   success: function(res){
  //     return res;
  //   }
  // })
}