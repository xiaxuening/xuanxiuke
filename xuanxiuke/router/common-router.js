//本文件就是roter，是控制器
var path = require("path");
var formidable = require("formidable");
var Admin = require("../models/Admin.js")
var Student = require("../models/Student.js");
var crypto = require("crypto");
var fs = require("fs");


//显示首页，就是/这个路由，它有两个作用，如果学生用户登录了，显示选课表单了，如果没有登录，就显示登录界面
exports.showIndex = function(req,res){
    if(req.session.login && req.session.type == "student"){
        //登录成功要做的业务
        res.render("xuanke",{
            "xingming" : req.session.xingming,
            "xuehao" : req.session.xuehao,
            "grade" : req.session.grade
        });
    }else{
        //呈递没有登录表单
        res.sendFile(path.join(__dirname , "../views/index.html"));
    }
}

//验证登录
exports.checklogin = function(req,res){
    var form = new formidable.IncomingForm();
    form.parse(req, function(err, fields, files) {
        //得到用户输入的表单数据，用户名和密码：
        var username = fields.username;
        var password = fields.password;
        if(err){
            //-1表示数据库错误
            res.json({"result":-1});
            return;
        }
        if(!username || !password){
            //-4表示没有填写
            res.json({"result":-4});
            return;
        }
        //根据用户输入的用户名是数字还是字母来判断是学生还是管理员
        if(Number.isInteger(Number(username))){
            //是一个数字，我们倾向于他是一个学生
            // console.log("学生",username,password);
            Student.findBySid(username,function(err,results){
                if(err){
                    res.json({"result" : -1});
                    return;
                }
                //用户名不存在
                if(results.length == 0){
                    res.json({"result" : -2});
                    return;
                }
                //判断密码是否正确，将用户输入的密码加密只有和results[0].password进行比较即可
                var sha256 = crypto.createHash("sha256");
                password = sha256.update(password).digest("hex").toString();
                if(password == results[0].password){
                    //1就是登陆成功
                    //登录成功，下发session
                    req.session.xuehao = username;
                    req.session.xingming = results[0].name;
                    req.session.type = "student";
                    req.session.login = true;
                    req.session.grade = results[0].grade;

                    res.json({"result":1 , "type" : "student"});
                }else{
                    //-3就是密码错误！
                    res.json({"result":-3});
                }
            });
        }else{
            //用户名不是一个数字，此时我们倾向于他是管理员
            //首先检查这个人是不是存在
            Admin.findByUsername(username,function(err,results){
                if(err){
                    //-1表示数据库错误
                    res.json({"result":-1});
                    return;
                }
                if(results.length == 0){
                    //用户名不存在！
                    res.json({"result":-2});
                    return;
                }
                //直接检查密码是否输入正确！！
                var theadmin = results[0];
                //加密密码
                var sha256 = crypto.createHash("sha256");
                password = sha256.update(password).digest("hex").toString();
                if(theadmin.password == password){
                    //登录成功，下发session
                    req.session.username = username;
                    req.session.type = "admin";
                    req.session.login = true;

                    res.json({"result":1 , "type" : "admin"});
                }else{
                    res.json({"result":-3});
                }
            });
        }
    });
}

//显示404
exports.show404 = function(req,res){
    res.status(404).send("没有这个页面，请检查网址！");
}