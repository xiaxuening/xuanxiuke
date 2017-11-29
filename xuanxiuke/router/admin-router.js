var path = require("path");
var xlsx = require('node-xlsx');
var formidable = require("formidable");
var Admin = require("../models/Admin.js")
var Student = require("../models/Student.js")
var Course = require("../models/Course.js")
var crypto = require("crypto");
var fs = require("fs");
var nodeExcel = require('excel-export');
var url = require("url");
// Admin.create({'username' : 'xxn' , 'password' : '123123123'},(err) =>{
// 	!err && console.log("成功");
// });
//管理员面板
exports.showAdmin = function(req,res){
    //使用这个页面需要登录！
    if(!(req.session.login && req.session.type == "admin")){
       res.send("本页面需要登录，请<a href=/>登录</a>");
       return;
    }
    res.sendFile(path.join(__dirname , "../views/admin.html"));
}

//管理员-学生面板
exports.showAdminStudent = function(req,res){
    //使用这个页面需要登录！
    if(!(req.session.login && req.session.type == "admin")){
       res.send("本页面需要登录，请<a href=/>登录</a>");
       return;
    }
    res.sendFile(path.join(__dirname , "../views/admin-student.html"));
}

//管理员-学生面板
exports.showuploadform = function(req,res){
    //使用这个页面需要登录！
    if(!(req.session.login && req.session.type == "admin")){
       res.send("本页面需要登录，请<a href=/>登录</a>");
       return;
    }
    res.sendFile(path.join(__dirname , "../views/uploadform.html"));
}

//处理上传的excel文件
exports.doexcelpost = function(req,res){
    //使用这个页面需要登录！
    if(!(req.session.login && req.session.type == "admin")){
       res.send("本页面需要登录，请<a href=/>登录</a>");
       return;
    }
    //表单
    var form = new formidable.IncomingForm();
    form.uploadDir = path.join(__dirname , "../uploads");
    form.parse(req, function(err, fields, files) {
        fs.rename(files.wenjian.path,files.wenjian.path+".xlsx",function(err){
            if(err){
                res.send("上传文件发生了错误");
                return;
            }

            //上传完毕之后，就要开始识别了
            var obj = xlsx.parse(files.wenjian.path + ".xlsx");
            //计数
            var count = 0;
            //清空当前数据库中的所有学生之后，然后进行插入操作
            Student.removeAllStudent(function(){
                //遍历这个对象中的data数组，data数组长度是6，是6个表的信息。
                for(var i = 0 ; i < 6 ; i++){
                    //命令模型分别将6个年级的学生信息持久化！
                    Student.createStudent(obj[i].data,i + 1,function(length,grade){
                        res.write(grade + "年级成功插入" + length + "人\n");

                        count++;
                        if(count == 6){
                            res.end("所有数据成功插入，请去生成初始密码");
                        }
                    });
                }
            });
        });
    });
}

//设置初始密码！
exports.setinitpassword = function(req,res){
    console.log("setinitpassword");
    //初始所有密码，找模型！脏活、累活，一定要找模型！
    Student.setinitpassword(function(result){
        if(result){
            //向前端界面输出1
            res.end("1");
        }
    });
}

//下载Excel表格
exports.exportexcel = function(req,res){
    //从数据库中得到所有数据，然后下载表格。
    Student.getAllStudents(function(arr){
        //插件：https://www.npmjs.com/package/excel-export
        //API文档博客：http://blog.csdn.net/hogewoci/article/details/10004799
        var conf = {};
        conf.cols = [
            {caption:'学号', type:'string'},
            {caption:'姓名', type:'string'},
            {caption:'初始密码', type:'string'}
        ];
        conf.rows = arr;
        var result = nodeExcel.execute(conf);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats');
        res.setHeader("Content-Disposition", "attachment; filename=" + "PassWord.xlsx");
        //命令数据库加密所有明码字符串
        Student.sha256();
        res.end(result, 'binary');
    });
}

//更改密码
exports.changepw = function(req,res){
    var form = new formidable.IncomingForm();
    form.parse(req, function(err, fields) {
        Student.changepw(parseInt(fields.sid), fields.pw,function(info){
            //将回调函数显示的信息，原封不动呈递给Ajax接口，会被jQuery alert出来。
            res.end(info);
        });
    });
}

//显示管理课程页面
exports.showAdminCourse = function(req,res){
    res.sendFile(path.join(__dirname , "../views/admin-course.html"));
}

//添加课程
exports.addCourse = function(req,res){
    var form = new formidable.IncomingForm();
    form.parse(req, function(err, fields) {
        //保存！直接把fomidable拿到的表单JSON提交给数据库保存！不变形！
        console.log(fields);
        Course.add(fields,function(err,r){
            if(err){
                res.send("提交失败！");
            }else{
                res.send("提交成功");
            }
        })
    });
}

//得到所有课程
exports.getallcourse = function(req,res){
    Course.getAll(function(results){
        res.json({"results" : results});
    })
}

//更改课程
exports.changecourse = function(req,res){
    var form = new formidable.IncomingForm();
    form.parse(req, function(err, fields) {
        Course.change(fields,function(err,r){
            res.send("");
        });
    });
}

//删除课程
exports.deletecourse = function(req,res){
    //得到要删除的数组
    var form = new formidable.IncomingForm();
    form.parse(req, function(err, fields) {
        //HTTP请求的POST参数不能传数组，只能传递字符串。所以前台会把数组stringify
        //后台parse()
        var needToDelete = JSON.parse(fields.needToDelete);

        //调用模块的方法
        Course.delete(needToDelete,function(err,n){
           if(err){
               res.send("-1");
           }else{
               res.send(n.toString());
           }
        });
    });
}

//搜索
exports.search = function(req,res){
    var qobj = url.parse(req.url,true).query;

    //模糊查询请求！
    Course.search(qobj.w,function(results){
        res.json({"results" : results});
    });
}