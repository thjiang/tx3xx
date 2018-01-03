/*
	Simulator.V1
	Author:jaykon
	Date:2012/05/22
	=========================
	BY:Eric Yang 2015.8.14 修改

*/

var Simulator = new Object();
Simulator.schoolID = 0; //门派ID
Simulator.mainGroupID = 1; //主玄修ID
Simulator.subGroupID = 2; //辅玄修ID
Simulator.totalPoint = 0; //点数总和
Simulator.totalPointRemain = 0; //剩余点数
Simulator.groupPoint = {
    "group1": 0,
    "group2": 0
}; //各分组点数和
Simulator.tips = null; //技能提示层
Simulator.alterTips = null; //提示层
Simulator.iconURL = {
    "enable": "images/skill/",
    "disable": "images/skillblack/"
};
Simulator.getMainGroupPoint = function () {
    return Simulator.groupPoint["group" + Simulator.mainGroupID];
};
Simulator.getSubGroupPoint = function () {
    return Simulator.groupPoint["group" + Simulator.subGroupID];
};
//当前门派技能数据
Simulator.currentSkills = new Object();
//主对像初始化
Simulator.init = function (schoolID, mainGroupID, subGroupID) {
    Simulator.tips = $("#skillTips");
    Simulator.alterTips = $("#alterTips");
    Simulator.schoolID = schoolID;
    //主辅技能切换
    $("#mainSubControl-1").click(function () {
        Simulator.exchangeMainSkill()
    });
    $("#mainSubControl-2").click(function () {
        Simulator.exchangeMainSkill()
    });
    this.initSkill(schoolID, mainGroupID, subGroupID);
    //提交等级事件
    $("#btnCommit").click(function () {
        //Simulator.totalPointRemain=Simulator.pointWithLevel($("#iLevel").val());
        Simulator.resetCurrentSkillData(Simulator.mainGroupID, Simulator.subGroupID);
        Simulator.reflashPointCount();
    });
    //重置数据事件
    $("#btnReset").click(function () {
        Simulator.resetCurrentSkillData(Simulator.mainGroupID, Simulator.subGroupID);
        Simulator.reflashPointCount();
    });
    //响应点击事件
    $(".skillList .hover").mousedown(function (e) {
        var fromGroup = $(this).parent().parent().attr("id");
        var fromGroupID = 0;
        if (fromGroup == "skillList-1")
            fromGroupID = 1;
        else
            fromGroupID = 2;
        if (e.which == 1)
            Simulator.addPoint(fromGroupID, $(this).attr("skillkey"));
        else if (e.which == 3)
            Simulator.decPoint(fromGroupID, $(this).attr("skillkey"));
        return false;
    })
    //响应鼠标划过事件
    $(".skillList .hover").hover(
        function () {
            var skillID = $(this).attr("skillkey");
            if (typeof skillID != "undefined") {
                Simulator.reflashTips(skillID, $(this));
                //Simulator.tips.css({"top":objOffset.top-20-Simulator.tips.height(),"left":objOffset.left+40}).show();
                //alert(Simulator.tips.html());
            }
        },
        function () {
            Simulator.tips.hide();
        }
    )
    //icon上屏蔽右击菜单
    $(".skillList .hover").bind("contextmenu", function (e) {
        e.preventDefault ? e.preventDefault() : (e.returnValue = false);
    });
}

//初始化技能数据
Simulator.initSkill = function (schoolID, mainGroupID, subGroupID) {
    Simulator.resetBaseData(schoolID, mainGroupID, subGroupID);
    //改变样式
    $("#simulator").attr("class", Simulator.schoolEWithID(schoolID));
    var i = 0;
    var group1 = $("#skillList-1");
    var group2 = $("#skillList-2");
    var currentGroup;
    var currentItem;
    var unOrtherSkillData = new Object();
    for (var skillID in Simulator_data) {
        if (Simulator_data[skillID].school == schoolID) {
            var skillIDData = skillID.split(',');
            if (skillIDData.length < 2) {
                alert('数据有错;')
            }
            if (typeof unOrtherSkillData[skillIDData[0]] == "undefined") unOrtherSkillData[skillIDData[0]] = new Object();
            unOrtherSkillData[skillIDData[0]][skillIDData[1]] = Simulator_data[skillID];
            unOrtherSkillData[skillIDData[0]].point = 0;
            if (typeof unOrtherSkillData[skillIDData[0]].pre_talent == "undefined") unOrtherSkillData[skillIDData[0]].pre_talent = null;
            //unOrtherSkillData[skillIDData[0]].skillkey=skillIDData[0];
            //检查skill的加点上限
            if (typeof unOrtherSkillData[skillIDData[0]].maxPoint == "undefined") unOrtherSkillData[skillIDData[0]].maxPoint = 0;
            unOrtherSkillData[skillIDData[0]].maxPoint++;
            unOrtherSkillData[skillIDData[0]][skillIDData[1]].tips = Simulator_data[skillID].tips.replace(/#r.*#r/g, '<br/>').replace(/#r/g, '<br/>').replace(/#cCFB53B/g, '<span style="color:#CFB53B">').replace(/#W/g, '</span>').replace(/#G/g, '</span>');
            //alert(unOrtherSkillData[skillIDData[0]][skillIDData[1]].tips);
            currentGroup = eval("group" + Simulator_data[skillID].group);
            currentItem = currentGroup.find(".skill_" + Simulator_data[skillID].pos_y + Simulator_data[skillID].pos_x);
            currentItem.find(".hover").attr("skillKey", skillIDData[0]);
            currentItem.find(".point").html("0");
            if (Simulator_data[skillID].pre_point_requir == 0 && Simulator_data[skillID].group == Simulator.mainGroupID) {
                currentItem.find(".icon").css("background", "url(" + Simulator.iconURL.enable + Simulator_data[skillID].icon_no + ".png)");
                currentItem.removeClass("full").addClass("enable");
                unOrtherSkillData[skillIDData[0]].isLightUp = true;
            } else {
                currentItem.find(".icon").css("background", "url(" + Simulator.iconURL.disable + Simulator_data[skillID].icon_no + ".png)");
                currentItem.removeClass("enable").removeClass("full");
                unOrtherSkillData[skillIDData[0]].isLightUp = false;
            }

            //插入前置技能数据及箭头
            if (typeof Simulator_data[skillID].pre_talent != "undefined" && !unOrtherSkillData[skillIDData[0]].pre_talent) {
                unOrtherSkillData[skillIDData[0]].pre_talent = Simulator_data[skillID].pre_talent;
                var _preSkill = Simulator_data[Simulator_data[skillID].pre_talent[0]];
                var _currentSkill = Simulator_data[skillID];
                var arrowTop = (_preSkill.pos_y) * 58 - 13;
                var arrowHeight = (_currentSkill.pos_y - _preSkill.pos_y - 1) * 58 + 3;
                var arrowLeft = (_currentSkill.pos_x - 1) * 62 + 11;
                currentGroup.append('<div id="arrow-' + skillIDData[0] + '" class="arrow" style="left:' + arrowLeft + 'px;top:' + arrowTop + 'px;height:' + arrowHeight + 'px;"><span></span></div>');
            }
        }
    }

    //按照从上到下，从左至右排序
    var currentSkillKey;
    $(".skillList .hover").each(function (index, element) {
        currentSkillKey = $(this).attr("skillkey");
        if (typeof currentSkillKey != "undefined") {
            //alert(currentSkillKey);
            Simulator.currentSkills[currentSkillKey] = unOrtherSkillData[currentSkillKey];
        } else {
            //将该位置没有技能的隐藏
            $(this).parent().css("visibility", "hidden");
        }
    });
}

//重置全局
Simulator.resetBaseData = function (schoolID, mainGroupID, subGroupID) {
    Simulator.currentSkills = new Object();
    Simulator.schoolID = schoolID;
    Simulator.mainGroupID = mainGroupID;
    Simulator.subGroupID = subGroupID;
    Simulator.totalPoint = 0;
    Simulator.totalPointRemain = Simulator.pointWithLevel($("#iLevel").val());
    Simulator.groupPoint = {
        "group1": 0,
        "group2": 0
    };
    Simulator.reflashPointCount();
    $("#schoolName").html(Simulator.schoolNameWithID(schoolID));
    $(".skillList .hover").removeAttr("skillkey");
    $(".skillList .skillItem").removeClass("full").removeClass("enable").css("visibility", "");
    $(".skillList .icon").css("background", "none");
    $(".skillList .arrow").remove();
}

//重置当前门派加点
Simulator.resetCurrentSkillData = function (mainGroupID, subGroupID) {
    //Simulator.currentSkills=new Array();
    Simulator.mainGroupID = mainGroupID;
    Simulator.subGroupID = subGroupID;
    Simulator.totalPoint = 0;
    Simulator.groupPoint = {
        "group1": 0,
        "group2": 0
    };
    Simulator.totalPointRemain = Simulator.pointWithLevel($("#iLevel").val());
    Simulator.reflashPointCount();
    $(".skillList .skillItem").removeClass("full").removeClass("enable");
    var currentDom;
    for (var skillID in Simulator.currentSkills) {
        Simulator.currentSkills[skillID].point = 0;
        currentDom = $("#skillList-" + Simulator.currentSkills[skillID][1].group).find(".skill_" + Simulator.currentSkills[skillID][1].pos_y + Simulator.currentSkills[skillID][1].pos_x);
        if (Simulator.currentSkills[skillID].isLightUp) {
            Simulator.currentSkills[skillID].isLightUp = false;
            currentDom.find(".point").html("0");
            currentDom.find(".icon").css("background", "url(" + Simulator.iconURL.disable + Simulator.currentSkills[skillID][1].icon_no + ".png)");
        }
        if (Simulator.currentSkills[skillID][1].pre_point_requir == 0 && Simulator.currentSkills[skillID][1].group == mainGroupID) {
            currentDom.find(".icon").css("background", "url(" + Simulator.iconURL.enable + Simulator.currentSkills[skillID][1].icon_no + ".png)");
            currentDom.addClass("enable");
            Simulator.currentSkills[skillID].isLightUp = true;
        }
    }
}

//刷新统计点数
Simulator.reflashPointCount = function () {
    $("#pointUsedByGroup1").html(Simulator.groupPoint.group1);
    $("#pointUsedByGroup2").html(Simulator.groupPoint.group2);
    $("#oRemainPoint").html(Simulator.totalPointRemain);
}

//切换主辅玄修
Simulator.exchangeMainSkill = function () {
    if (Simulator.mainGroupID == 1) {
        $("#mainSubControl-1 .maskButton").animate({
            top: "2px"
        }, 200);
        $("#mainSubControl-2 .maskButton").animate({
            top: "43px"
        }, 200);
        //Simulator.mainGroupID=2;
        //Simulator.subGroupID=1;
        Simulator.resetCurrentSkillData(2, 1);
    } else {
        $("#mainSubControl-1 .maskButton").animate({
            top: "43px"
        }, 200);
        $("#mainSubControl-2 .maskButton").animate({
            top: "2px"
        }, 200);
        //Simulator.mainGroupID=1;
        //Simulator.subGroupID=2;
        Simulator.resetCurrentSkillData(1, 2);
    }
}

//刷新技能描述
Simulator.reflashTips = function (skillID, skillDom) {
    var objOffset = skillDom.offset();
    var currentPoint = Simulator.currentSkills[skillID].point;
    if (currentPoint == 0) currentPoint = 1;
    var currentHTML = '';
    currentHTML += '<p class="tips-title">' + Simulator.currentSkills[skillID][currentPoint].tname + '</p>';
    if (Simulator.currentSkills[skillID][currentPoint].pos_y != 7) {
        currentHTML += '<p class="tips-level">级别:' + Simulator.currentSkills[skillID].point + '/' + Simulator.currentSkills[skillID].maxPoint + '</p>';
    }
    currentHTML += '<p class="tips-describe">' + Simulator.currentSkills[skillID][currentPoint].tips + '</p>';
    if (Simulator.currentSkills[skillID].point < Simulator.currentSkills[skillID].maxPoint) {
        if (Simulator.currentSkills[skillID].point != 0) {
            currentHTML += '<p class="tips-nextLevelTitle">下一级：</p>';
            currentHTML += '<p class="tips-nextLevel">' + Simulator.currentSkills[skillID][currentPoint + 1].tips + '</p>';
        }
        if (Simulator.currentSkills[skillID].isLightUp)
            currentHTML += '<p class="tips-learn">点击学习</p>';
    } else {
        currentHTML += '<p class="tips-cancle">点击右键取消学习</p>';
    }
    Simulator.tips.html(currentHTML);
    if (Simulator.currentSkills[skillID][currentPoint].group == 1)
        Simulator.tips.css({
            "top": objOffset.top - 20 - Simulator.tips.height(),
            "left": objOffset.left + 40
        }).show();
    else
        Simulator.tips.css({
            "top": objOffset.top - 20 - Simulator.tips.height(),
            "left": objOffset.left - 330
        }).show();
}

//加点数
Simulator.addPoint = function (fromGroupID, skillID) {
    //var isReachMaxPoint=Simulator.currentSkills[skillID].point<Simulator.currentSkills[skillID].maxPoint?true:false;
    //var isReachPrePoint=Simulator.mainGroupPoint>=Simulator.currentSkills[skillID].pre_point_requir;
    if (typeof Simulator.currentSkills[skillID] == "undefined") return false;
    if ($("#iLevel").val() == "") {
        Simulator.showAlter("level", "请先确定等级");
        return false;
    }
    if (Simulator.currentSkills[skillID].point < Simulator.currentSkills[skillID].maxPoint && Simulator.currentSkills[skillID].isLightUp) {
        if (Simulator.totalPointRemain < 1) {
            Simulator.showAlter("point", "点数不足");;
            return false;
        }
        Simulator.currentSkills[skillID].point++;
        Simulator.totalPoint++;
        Simulator.groupPoint["group" + fromGroupID]++;
        Simulator.totalPointRemain--;
        var currentItem = $("#skillList-" + fromGroupID + " .skill_" + Simulator.currentSkills[skillID][1].pos_y + Simulator.currentSkills[skillID][1].pos_x);
        currentItem.find(".point").html(Simulator.currentSkills[skillID].point);
        if (Simulator.currentSkills[skillID].point >= Simulator.currentSkills[skillID].maxPoint)
            currentItem.removeClass("enable").addClass("full");
        //刷新所有其它技能状态
        Simulator.reflashSkillStateFromAddPoint();
        Simulator.reflashTips(skillID, currentItem);
    }
}
//减点数
Simulator.decPoint = function (fromGroupID, skillID) {
    if (typeof Simulator.currentSkills[skillID] == "undefined") return false;
    if (Simulator.currentSkills[skillID].point > 0) {
        Simulator.currentSkills[skillID].point--;
        Simulator.totalPoint--;
        Simulator.groupPoint["group" + fromGroupID]--;
        Simulator.totalPointRemain++;
        var currentDom = $("#skillList-" + fromGroupID + " .skill_" + Simulator.currentSkills[skillID][1].pos_y + Simulator.currentSkills[skillID][1].pos_x);
        currentDom.find(".point").html(this.currentSkills[skillID].point);
        if (Simulator.currentSkills[skillID].point != Simulator.currentSkills[skillID].maxPoint)
            currentDom.removeClass("full");
        if (Simulator.isSkillCanLightUp(Simulator.currentSkills[skillID]))
            currentDom.addClass("enable");

        //刷新所有其它技能状态
        Simulator.reflashSkillStateFromDecPoint();
        //currentDom.removeClass("full").find(".icon").css("background","url(images/skillblack/"+Simulator.currentSkills[skillID][1].icon_no+".png)");;
        Simulator.reflashTips(skillID, currentDom);
    }
}

//加点数时刷新
Simulator.reflashSkillStateFromAddPoint = function () {
    var currentObject;
    for (var skillID in Simulator.currentSkills) {
        currentObject = Simulator.currentSkills[skillID][1];
        //alert(currentObject.pre_point_requir+" - "+Simulator.groupPoint["group"+currentObject.group]);
        if (!Simulator.currentSkills[skillID].isLightUp) {
            if (Simulator.isSkillCanLightUp(Simulator.currentSkills[skillID])) {
                $("#skillList-" + currentObject.group + " .skill_" + currentObject.pos_y + currentObject.pos_x).removeClass("disable").addClass("enable").find(".icon").css("background", "url(" + Simulator.iconURL.enable + currentObject.icon_no + ".png)");
                Simulator.currentSkills[skillID].isLightUp = true;
            }
        }
    }
    Simulator.reflashPointCount();
}

//减点数时刷新
Simulator.reflashSkillStateFromDecPoint = function () {
    var currentDom;

    function reflashGroup(groupID) {
        for (var skillID in Simulator.currentSkills) {
            //console.log("%d",skillID);
            currentObject = Simulator.currentSkills[skillID][1];
            //alert(currentObject.pre_point_requir+" - "+Simulator.groupPoint["group"+currentObject.group]);
            if (currentObject.group == groupID) {
                if (Simulator.currentSkills[skillID].isLightUp) {
                    if (!Simulator.isSkillCanLightUp(Simulator.currentSkills[skillID])) {
                        Simulator.totalPoint -= Simulator.currentSkills[skillID].point;
                        Simulator.groupPoint["group" + currentObject.group] -= Simulator.currentSkills[skillID].point;
                        Simulator.totalPointRemain += Simulator.currentSkills[skillID].point;
                        currentDom = $("#skillList-" + currentObject.group + " .skill_" + currentObject.pos_y + currentObject.pos_x);
                        currentDom.removeClass("full").removeClass("enable").find(".icon").css("background", "url(" + Simulator.iconURL.disable + currentObject.icon_no + ".png)");
                        Simulator.currentSkills[skillID].point = 0;
                        currentDom.find(".point").html("0");
                        Simulator.currentSkills[skillID].isLightUp = false;
                    }
                }
            }
        }
    }
    reflashGroup(Simulator.mainGroupID);
    reflashGroup(Simulator.subGroupID);
    Simulator.reflashPointCount();
}

//某技能前面的点数总和（组内）
Simulator.getPrePointTotal = function (skillObject) {
    var point = 0;
    var currentDom = $("#skillList-" + skillObject[1].group + " .hover");
    for (var skillID in Simulator.currentSkills) {
        if (Simulator.currentSkills[skillID][1].group == skillObject[1].group)
            if (Simulator.currentSkills[skillID][1].pos_y < skillObject[1].pos_y || Simulator.currentSkills[skillID][1].pos_y == skillObject[1].pos_y && Simulator.currentSkills[skillID][1].pos_x < skillObject[1].pos_x) {
                point += Simulator.currentSkills[skillID].point;
            }
    }
    return point;
}


//某个技能是否具备点亮的条件
Simulator.isSkillCanLightUp = function (skillObject) {
    //skillObject[1]等级为1
    var isReachPrePoint = Simulator.getPrePointTotal(skillObject) >= skillObject[1].pre_point_requir ? true : false;
    //主组点数总和是否到达
    var isReachMainPoint = Simulator.getMainGroupPoint() >= skillObject[1].pre_main_point_requir ? true : false;
    //检查前置天赋是否到达
    if (skillObject.pre_talent) {
        var _preTalent = Simulator.currentSkills[skillObject.pre_talent[0][0]];
        if (_preTalent.point < skillObject.pre_talent[0][1]) return false;
    }
    if (isReachPrePoint)
        //当前技能属于主组，则只要到前置点数则可点亮
        if (skillObject[1].group == Simulator.mainGroupID)
            return true;
        //当前技能不属于主组，则要进一步到达主组点数才可点亮
        else if (isReachMainPoint)
        return true;
    return false;
}

Simulator.schoolNameWithID = function (ID) {
    switch (ID) {
        case 1:
            return "荒火教";
        case 2:
            return "天机营";
        case 3:
            return "翎羽山庄";
        case 4:
            return "魍魉";
        case 5:
            return "太虚观";
        case 6:
            return "云麓仙居";
        case 7:
            return "冰心堂";
        case 8:
            return "弈剑听雨阁";
        case 9:
            return "鬼墨";
        case 10:
            return "龙巫宫"
        case 11:
            return "幽篁国"
    }
}

Simulator.schollIDWithE = function (schoolE) {
    switch (schoolE) {
        case "hh":
            return 1;
        case "tj":
            return 2;
        case "ly":
            return 3;
        case "wl":
            return 4;
        case "tx":
            return 5;
        case "yl":
            return 6;
        case "bx":
            return 7;
        case "yj":
            return 8;
        case "gm":
            return 9;
        case "lw":
            return 10;
        case "yh":
            return 11;
    }
}

Simulator.schoolEWithID = function (e) {
    e = parseInt(e);
    switch (e) {
        case 1:
            return "hh";
        case 2:
            return "tj";
        case 3:
            return "ly";
        case 4:
            return "wl";
        case 5:
            return "tx";
        case 6:
            return "yl";
        case 7:
            return "bx";
        case 8:
            return "yj";
        case 9:
            return "gm";
        case 10:
            return "lw";
        case 11:
            return "yh";
    }
}

Simulator.pointWithLevel = function (level) {
    var regx = /^\d{1,2}$/;
    if (!regx.test(level) || level > 80 || level < 1) {
        Simulator.showAlter("level", "请先输入等级，范围1-80");
        return 0;
    }
    var point = new Array();
    point[1] = 0;
    point[2] = 0;
    point[3] = 0;
    point[4] = 0;
    point[5] = 0;
    point[6] = 0;
    point[7] = 0;
    point[8] = 0;
    point[9] = 0;
    point[10] = 0;
    point[11] = 0;
    point[12] = 0;
    point[13] = 0;
    point[14] = 0;
    point[15] = 0;
    point[16] = 0;
    point[17] = 0;
    point[18] = 0;
    point[19] = 0;
    point[20] = 0;
    point[21] = 0;
    point[22] = 0;
    point[23] = 0;
    point[24] = 0;
    point[25] = 0;
    point[26] = 0;
    point[27] = 0;
    point[28] = 0;
    point[29] = 0;
    point[30] = 1;
    point[31] = 1;
    point[32] = 1;
    point[33] = 2;
    point[34] = 2;
    point[35] = 2;
    point[36] = 3;
    point[37] = 3;
    point[38] = 3;
    point[39] = 4;
    point[40] = 4;
    point[41] = 4;
    point[42] = 5;
    point[43] = 5;
    point[44] = 5;
    point[45] = 6;
    point[46] = 6;
    point[47] = 6;
    point[48] = 7;
    point[49] = 7;
    point[50] = 7;
    point[51] = 8;
    point[52] = 8;
    point[53] = 8;
    point[54] = 9;
    point[55] = 9;
    point[56] = 9;
    point[57] = 10
    point[58] = 10;
    point[59] = 10;
    point[60] = 11;
    point[61] = 11;
    point[62] = 12;
    point[63] = 12;
    point[64] = 13;
    point[65] = 13;
    point[66] = 14;
    point[67] = 14;
    point[68] = 15;
    point[69] = 15;
    point[70] = 16;
    point[71] = 17;
    point[72] = 18;
    point[73] = 19;
    point[74] = 20;
    point[75] = 23;
    point[76] = 25;
    point[77] = 27;
    point[78] = 29;
    point[79] = 31;
    point[80] = 33;
    return point[level];
}

Simulator.showAlter = function (type, msg) {
    switch (type) {
        case "point":
            Simulator.alterTips.css({
                top: 375,
                left: 165
            });
            break;
        case "level":
            Simulator.alterTips.css({
                top: 375,
                left: 165
            });
            break;
    }
    Simulator.alterTips.html(msg).fadeIn("fast", function () {
        setTimeout(function () {
            Simulator.alterTips.fadeOut()
        }, 1000)
    });
}