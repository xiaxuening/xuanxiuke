//类，mongoose使用的类，管理员类
var mongoose = require("mongoose");

//创建schema
var adminSchema = mongoose.Schema({
    "username" : String,
    "password" : String
});
//静态方法，通过用户名查询
adminSchema.statics.findByUsername = function(username,callback){
    this.find({"username":username},function(err,results){
        //向上层返回
        callback(err,results);
    });
}

//创建模型
var Admin = mongoose.model("Admin",adminSchema);

//整个模块向外暴露一个东西
module.exports = Admin;