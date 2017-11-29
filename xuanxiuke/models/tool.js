var Course = require("./Course.js");
var Student = require("./Student.js");
var _ = require("underscore");

//报名，给sid报名cid
exports.baoming = function(sid,cid,callback){
    //这里还是要验证有效性，为了系统的鲁棒、安全，防止有小神童直接找到了接口，攻破了前端界面。
    Course.find({"cid" : cid},function(err,results1){
        Student.find({"sid":sid},function(err,results2){
            if(results1.length == 0 || results2.length == 0){
                callback("-6");
                return;
            }
            var thecourse = results1[0];
            var thestudent = results2[0];

            ////5个验证
            //① 是否已经报了这个课程
            if(_.indexOf(thecourse.students,thestudent.sid) != -1 || _.indexOf(thestudent.courses,thecourse.cid) != -1 ){
                callback("-1");
                return;
            }

            //② 是否已经报了两个课程
            if(thestudent.courses.length >= 2){
                callback("-2");
                return;
            }

            //③ 验证星期是否冲突
            var chongtu = false;
            //遍历这个学生的所有已经报名的课程
            thestudent.courses.forEach(function(yijingbaodecid){
                //再次遍历所有课程，检索这个课程的星期
                results1.forEach(function(mouyigekecheng){
                    if(mouyigekecheng.cid == yijingbaodecid){
                        if(mouyigekecheng.date == thecourse.date){
                            chongtu = true;
                        }
                    }
                });
            });
            if(chongtu){
                callback("-3");
                return;
            }

            //④ 验证人数
            if(thecourse.number <=0){
                callback("-4");
                return;
            }

            //⑤ 验证年级是否有效
            if(thecourse.grade.indexOf(thestudent.grade) == -1){
                callback("-5");
                return;
            }

            //通过5关，实现报名
            thecourse.students.push(thestudent.sid);
            thestudent.courses.push(thecourse.cid);
            thecourse.number--;
            thecourse.save();
            thestudent.save();
            callback("1");
        });
    });
};


//报名，给sid报名cid
exports.tuiding = function(sid,cid,callback){
    //这里还是要验证有效性，为了系统的鲁棒、安全，防止有小神童直接找到了接口，攻破了前端界面。
    Course.find({"cid" : cid},function(err,results1){
        Student.find({"sid":sid},function(err,results2) {
            if (results1.length == 0 || results2.length == 0) {
                callback("-6");
                return;
            }
            var thecourse = results1[0];
            var thestudent = results2[0];

            thecourse.students = _.without(thecourse.students,thestudent.sid);
            thestudent.courses = _.without(thestudent.courses,thecourse.cid);
            thecourse.number++;

            thecourse.save();
            thestudent.save();

            callback();
        });
    });
};