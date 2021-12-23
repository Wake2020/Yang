/*
 * 如需运行请自行添加环境变量：JD_TRY，值填 true 即可运行
 * 脚本兼容: Node.js
 * X1a0He留
 * 脚本是否耗时只看args_xh.maxLength的大小
 * 上一作者说了每天最多300个商店，总上限为500个，jd_unsubscribe.js我已更新为批量取关版
 * 请提前取关至少250个商店确保京东试用脚本正常运行
 *
 * @Address: https://github.com/X1a0He/jd_scripts_fixed/blob/main/jd_try_xh.js
 * @LastEditors: X1a0He
 * @二次优化作者: Ginvie
 */
const $ = new Env('京东试用')
const URL = 'https://api.m.jd.com/client.action'
let trialActivityIdList = []
let trialActivityTitleList = []
let totalTry = []
let totalSuccess=[]
let notifyMsg = ''
let size = 1;
$.isPush = true;
let isLimit = [];
let isForbidden = [];
$.wrong = false;
$.totalPages = 0;
$.giveupNum = 0;
$.successNum = 0;
$.completeNum = 0;
$.getNum = 0;
$.try = true;
$.sentNum = 0;
$.cookiesArr = []
$.innerKeyWords =
    [
        "幼儿园", "教程", "英语", "辅导", "培训",
        "孩子", "小学", "成人用品", "套套", "情趣",
        "自慰", "阳具", "飞机杯", "男士用品", "女士用品",
        "内衣", "高潮", "避孕", "乳腺", "肛塞", "肛门",
        "宝宝", "玩具", "芭比", "娃娃", "男用",
        "女用", "神油", "足力健", "老年", "老人",
        "宠物", "饲料", "丝袜", "黑丝", "磨脚",
        "脚皮", "除臭", "性感", "内裤", "跳蛋",
        "安全套", "龟头", "阴道", "阴部"
    ]
//下面很重要，遇到问题请把下面注释看一遍再来问
let args_xh = {
    /*
     * 商品原价，低于这个价格都不会试用，意思是
     * A商品原价49元，试用价1元，如果下面设置为50，那么A商品不会被加入到待提交的试用组
     * B商品原价99元，试用价0元，如果下面设置为50，那么B商品将会被加入到待提交的试用组
     * C商品原价99元，试用价1元，如果下面设置为50，那么C商品将会被加入到待提交的试用组
     * 默认为0
     * */
    jdPrice: process.env.JD_TRY_PRICE * 1 || 20,
    /*
     * 获取试用商品类型，默认为1，原来不是数组形式，我以为就只有几个tab，结果后面还有我服了
     * 1 - 精选
     * 2 - 闪电试用
     * 3 - 家用电器(可能会有变化)
     * 4 - 手机数码(可能会有变化)
     * 5 - 电脑办公(可能会有变化)
	@@ -62,7 +65,7 @@ let args_xh = {
     * 可设置环境变量：JD_TRY_TABID，用@进行分隔
     * 默认为 1 到 5
     * */
    tabId: process.env.JD_TRY_TABID && process.env.JD_TRY_TABID.split('@').map(Number) || [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16],
    /*
     * 试用商品标题过滤，黑名单，当标题存在关键词时，则不加入试用组
     * 当白名单和黑名单共存时，黑名单会自动失效，优先匹配白名单，匹配完白名单后不会再匹配黑名单，望周知
	@@ -96,14 +99,14 @@ let args_xh = {
     * 可设置环境变量：JD_TRY_APPLYINTERVAL
     * 默认为3000，也就是3秒
     * */
    applyInterval: process.env.JD_TRY_APPLYINTERVAL * 1 || 3000,//每个账号提交间隔调大，防止黑IP
    /*
     * 商品数组的最大长度，通俗来说就是即将申请的商品队列长度
     * 例如设置为20，当第一次获取后获得12件，过滤后剩下5件，将会进行第二次获取，过滤后加上第一次剩余件数
     * 例如是18件，将会进行第三次获取，直到过滤完毕后为20件才会停止，不建议设置太大
     * 可设置环境变量：JD_TRY_MAXLENGTH
     * */
    maxLength: process.env.JD_TRY_MAXLENGTH * 1 || 3,
    /*
     * 过滤种草官类试用，某些试用商品是专属官专属，考虑到部分账号不是种草官账号
     * 例如A商品是种草官专属试用商品，下面设置为true，而你又不是种草官账号，那A商品将不会被添加到待提交试用组
     * 例如B商品是种草官专属试用商品，下面设置为false，而你是种草官账号，那A商品将会被添加到待提交试用组
     * 例如B商品是种草官专属试用商品，下面设置为true，即使你是种草官账号，A商品也不会被添加到待提交试用组
     * 可设置环境变量：JD_TRY_PASSZC，默认为true
     * */
    passZhongCao: process.env.JD_TRY_PASSZC || true,
    /*
     * 是否打印输出到日志，考虑到如果试用组长度过大，例如100以上，如果每个商品检测都打印一遍，日志长度会非常长
     * 打印的优点：清晰知道每个商品为什么会被过滤，哪个商品被添加到了待提交试用组
     * 打印的缺点：会使日志变得很长
     *
     * 不打印的优点：简短日志长度
     * 不打印的缺点：无法清晰知道每个商品为什么会被过滤，哪个商品被添加到了待提交试用组
     * 可设置环境变量：JD_TRY_PLOG，默认为true
     * */
    printLog: process.env.JD_TRY_PLOG || true,
    /*
     * 白名单，是否打开，如果下面为true，那么黑名单会自动失效
     * 白名单和黑名单无法共存，白名单永远优先于黑名单
     * 可通过环境变量控制：JD_TRY_WHITELIST，默认为false
     * */
	@@ -136,17 +139,21 @@
     * */
    whiteListKeywords: process.env.JD_TRY_WHITELISTKEYWORDS && process.env.JD_TRY_WHITELISTKEYWORDS.split('@') || [],
    /*
     * 每多少个账号发送一次通知，默认为10
     * 可通过环境变量控制 JD_TRY_SENDNUM
     * */
    sendNum: process.env.JD_TRY_SENDNUM * 1 || 10,

    /*
    * 商品申请剩余时间，默认为1天	
    * 商品离结束时间的天数，0为今天结束，1为明天结束，如此类推
    * 可通过环境变量控制 JD_TRY_REMAININGDAY
    */
	remainingDay:process.env.JD_TRY_REMAININGDAY * 1||1
}
//上面很重要，遇到问题请把上面注释看一遍再来问
!(async() => {
     await $.wait(500)
    // 如果你要运行京东试用这个脚本，麻烦你把环境变量 JD_TRY 设置为 true
    if(process.env.JD_TRY && process.env.JD_TRY === 'true'){
        await requireConfig()
	@@ -156,37 +163,39 @@ let args_xh = {
            })
            return
        }
        //初始化参数
        for(let i = 0;i<$.cookiesArr.length;i++)
        {
        	totalTry[i]=0
			totalSuccess[i]=0
			isLimit[i]=false
			isForbidden[i]=false
        }
        console.log(`参数初始化成功\n`);
        //获取试用列表
        for(let i = $.cookiesArr.length -1; i >-1 ; i--){
        	if($.cookiesArr[i]){
                $.cookie = $.cookiesArr[0];
                $.UserName = decodeURIComponent($.cookie.match(/pt_pin=(.+?);/) && $.cookie.match(/pt_pin=(.+?);/)[1])
                $.index = i + 1;
                $.isLogin = true;                
                $.nickName = '';
                await totalBean();

                if(!$.isLogin){
                    $.msg($.name, `【提示】cookie已失效`, `京东账号${$.index} ${$.nickName || $.UserName}\n请重新登录获取\nhttps://bean.m.jd.com/bean/signIndex.action`, {
                        "open-url": "https://bean.m.jd.com/bean/signIndex.action"
                    });
                    await $.notify.sendNotify(`${$.name}cookie已失效 - ${$.UserName}`, `京东账号${$.index} ${$.UserName}\n请重新登录获取cookie`);
                    continue
                }
                await try_tabList();
                console.log(`\n获取账号${$.index}的试用列表\n`);
                $.nowTabIdIndex = 0;
                $.nowItem = 1;
                $.nowPage = 1;
                size = 1  
                while(trialActivityIdList.length < args_xh.maxLength){
                    if($.nowTabIdIndex === args_xh.tabId.length){
                        console.log(`tabId组已遍历完毕，不在获取商品\n`);
                        break;
	@@ -198,31 +207,62 @@ let args_xh = {
                        await $.wait(2000);
                    }
                }
                break;
                }
        	}
        	//申请试用
			console.log(`稍后将执行试用申请，请等待 2 秒\n`)
			await $.wait(2000);			
			for(let n = 0; n < trialActivityIdList.length; n++){				
				for(let i = 0; i < $.cookiesArr.length; i++){
				if(isLimit[i]){
					console.log("试用上限")
					continue
				}
				if(isForbidden[i]){
					console.log("京东风控跳过")
					continue
				}
				if($.cookiesArr[i]){
					$.cookie = $.cookiesArr[i];
					$.UserName = decodeURIComponent($.cookie.match(/pt_pin=(.+?);/) && $.cookie.match(/pt_pin=(.+?);/)[1])
					$.isLogin = true;
					$.index = i + 1;
					$.nickName = '';					
					await totalBean();
					if(!$.isLogin){
						continue
					}
					console.log(`\n进度${n+1}/${trialActivityIdList.length}【${$.index} ${$.nickName || $.UserName}】开始申请 ${trialActivityTitleList[n]}\n`);
					await try_apply(trialActivityTitleList[n], trialActivityIdList[n])										
					}	                        
				}
				console.log(`间隔等待中，请等待 ${args_xh.applyInterval/1000} s\n`)
				await $.wait(args_xh.applyInterval);	
			}			
			console.log("试用申请执行完毕...")
        for(let i = 0; i < $.cookiesArr.length; i++){
            if($.cookiesArr[i]){
                $.cookie = $.cookiesArr[i];
                $.UserName = decodeURIComponent($.cookie.match(/pt_pin=(.+?);/) && $.cookie.match(/pt_pin=(.+?);/)[1])
                $.index = i + 1;
                $.isLogin = true;
                $.nickName = '';
                await totalBean();

                if(!$.isLogin){
                    continue
                }
                console.log(`\n开始【京东账号${$.index}】${$.nickName || $.UserName}\n`);
                $.giveupNum = 0;
                $.successNum = 0;
                $.getNum = 0;
                $.completeNum = 0;
                await try_MyTrials(1, 2)    //申请成功的商品
                await showMsg()
            }
            if($.isNode()){
                if($.index % args_xh.sendNum === 0 && notifyMsg){
                    $.sentNum++;
                    console.log(`正在进行第 ${$.sentNum} 次发送通知，发送数量：${args_xh.sendNum}`)
                    await $.notify.sendNotify(`${$.name}`, `${notifyMsg}`)
	@@ -231,7 +271,7 @@ let args_xh = {
            }
        }
        if($.isNode()){
            if(($.cookiesArr.length - ($.sentNum * args_xh.sendNum)) < args_xh.sendNum && notifyMsg){
                console.log(`正在进行最后一次发送通知，发送数量：${($.cookiesArr.length - ($.sentNum * args_xh.sendNum))}`)
                await $.notify.sendNotify(`${$.name}`, `${notifyMsg}`)
                notifyMsg = "";
	@@ -270,18 +310,19 @@ function requireConfig(){
        for(let keyWord of $.innerKeyWords) args_xh.titleFilters.push(keyWord)
        console.log(`共${$.cookiesArr.length}个京东账号\n`)
        console.log('=====环境变量配置如下=====')
        console.log(`商品原价: ${typeof args_xh.jdPrice}, ${args_xh.jdPrice}`)
        console.log(`商品类型: ${typeof args_xh.tabId}, ${args_xh.tabId}`)
        console.log(`黑名单: ${typeof args_xh.titleFilters}, ${args_xh.titleFilters}`)
        console.log(`试用价格: ${typeof args_xh.trialPrice}, ${args_xh.trialPrice}`)
        console.log(`最小提供数量: ${typeof args_xh.minSupplyNum}, ${args_xh.minSupplyNum}`)
        console.log(`已申请人数: ${typeof args_xh.applyNumFilter}, ${args_xh.applyNumFilter}`)
        console.log(`商品申请间隔时间: ${typeof args_xh.applyInterval}, ${args_xh.applyInterval}`)
        console.log(`商品最大长度: ${typeof args_xh.maxLength}, ${args_xh.maxLength}`)
        console.log(`过滤种草官: ${typeof args_xh.passZhongCao}, ${args_xh.passZhongCao}`)
        console.log(`打印详细日志: ${typeof args_xh.printLog}, ${args_xh.printLog}`)
        console.log(`白名单: ${typeof args_xh.whiteList}, ${args_xh.whiteList}`)
        console.log(`白名单关键词: ${typeof args_xh.whiteListKeywords}, ${args_xh.whiteListKeywords}`)
		console.log(`商品申请剩余时间: ${typeof args_xh.remainingDay}, ${args_xh.remainingDay}`)		
        console.log('=======================')
        resolve()
    })
	@@ -299,7 +340,7 @@ function try_tabList(){
            try{
                if(err){
                    if(JSON.stringify(err) === `\"Response code 403 (Forbidden)\"`){
                        isForbidden[$.index-1] = true
                        console.log('账号被京东服务器风控，不再请求该帐号')
                    } else {
                        console.log(JSON.stringify(err))
	@@ -331,11 +372,11 @@ function try_feedsList(tabId, page){
            "previewTime": ""
        });
        let option = taskurl_xh('newtry', 'try_feedsList', body)
        $.get(option, async(err, resp, data) => {
            try{
                if(err){
                    if(JSON.stringify(err) === `\"Response code 403 (Forbidden)\"`){
                        isForbidden[$.index-1] = true
                        console.log('账号被京东服务器风控，不再请求该帐号')
                    } else {
                        console.log(JSON.stringify(err))
	@@ -388,8 +429,8 @@ function try_feedsList(tabId, page){
                                    }
                                } else {
                                    tempKeyword = ``;
                                    if(args_xh.trialPrice < parseFloat(item.trialPrice)){
                                        args_xh.printLog ? console.log(`商品被过滤，试用价格大于预设价格\n`) : ''
                                    } else if(parseFloat(item.supplyNum) < args_xh.minSupplyNum && item.supplyNum !== null){
                                        args_xh.printLog ? console.log(`商品被过滤，提供申请的份数小于预设申请的份数 \n`) : ''
                                    } else if(parseFloat(item.applyNum) > args_xh.applyNumFilter && item.applyNum !== null){
	@@ -399,9 +440,20 @@ function try_feedsList(tabId, page){
                                    } else if(args_xh.titleFilters.some(fileter_word => item.skuTitle.includes(fileter_word) ? tempKeyword = fileter_word : '')){
                                        args_xh.printLog ? console.log(`商品被过滤，含有关键词 ${tempKeyword}\n`) : ''
                                    } else {

                                        $.day = -1
                                        await try_detail(item.skuTitle,item.trialActivityId)
                                        if($.day!= -1 && $.day <= args_xh.remainingDay)
                                        {
                                            args_xh.printLog ? console.log(`商品通过，将加入试用组，trialActivityId为${item.trialActivityId}\n`) : ''
                                            trialActivityIdList.push(item.trialActivityId)
                                            trialActivityTitleList.push(item.skuTitle)
                                        }
                                        else
                                        {
                                            args_xh.printLog ? console.log(`剩余时间 ${$.day} 设定时间 ${args_xh.remainingDay}\n`) : ''
                                        }

                                    }
                                }
                            } else if($.isPush !== false){
	@@ -430,6 +482,63 @@ function try_feedsList(tabId, page){
    })
}

function try_detail(title, activityId){
    return new Promise((resolve, reject) => {
        args_xh.printLog ? console.log(`获取申请试用商品详情`) : ''
        args_xh.printLog ? console.log(`商品：${title}`) : ''
        args_xh.printLog ? console.log(`id为：${activityId}`) : ''
        const body = JSON.stringify({
            "activityId": activityId,
            "previewTime": ""
        });
        let option = taskurl_xh('newtry', 'try_detail', body)
        $.get(option, (err, resp, data) => {
            try{
                if(err){
                    if(JSON.stringify(err) === `\"Response code 403 (Forbidden)\"`){
                        isForbidden[$.index-1] = true
                        console.log('账号被京东服务器风控，不再请求该帐号')
                    } else {
                        console.log(JSON.stringify(err))
                        console.log(`${$.name} API请求失败，请检查网路重试`)
                    }
                } else {
                    data = JSON.parse(data)
                    if(data.success)
                    {
                        var StartTime = new Date(parseInt(data.data.activityStartTime));
                        var EndTime = new Date(parseInt(data.data.activityEndTime));
                        var nowTime = new Date(parseInt(data.data.nowTime));
                        //console.log(`开始时间戳`,data.data.activityStartTime)
                        args_xh.printLog ? console.log(`开始时间`,StartTime.toLocaleString()) : ''
                        //console.log(`结束时间戳`,data.data.activityEndTime)
                        args_xh.printLog ? console.log(`结束时间`,EndTime.toLocaleString()) : ''
                        //console.log(`现在时间戳`,data.data.nowTime)
                        args_xh.printLog ? console.log(`现在时间`,nowTime.toLocaleString()) : ''
                        //console.log(`剩余时间戳`,data.data.activityEndTime-data.data.nowTime)
						if(data.data.activityEndTime-data.data.nowTime > 0)
						{
							$.day = parseInt((data.data.activityEndTime-data.data.nowTime)/ (1000 * 60 * 60 * 24));
							args_xh.printLog ? console.log(`剩余时间`,$.day) : ''
						}
						else
						{
							$.day = -1
							args_xh.printLog ? console.log(`当前商品已结束申请`) : ''
						}	

                    }
                }
            } catch(e){
                reject(`⚠️ ${arguments.callee.name.toString()} API返回结果解析出错\n${e}\n${JSON.stringify(data)}`)
            } finally{
                resolve()
            }
        })
    })
}


function try_apply(title, activityId){
    return new Promise((resolve, reject) => {
        console.log(`申请试用商品提交中...`)
	@@ -444,18 +553,18 @@ function try_apply(title, activityId){
            try{
                if(err){
                    if(JSON.stringify(err) === `\"Response code 403 (Forbidden)\"`){
                        isForbidden[$.index-1] = true
                        console.log('账号被京东服务器风控，不再请求该帐号')
                    } else {
                        console.log(JSON.stringify(err))
                        console.log(`${$.name} API请求失败，请检查网路重试`)
                    }
                } else {
                    totalTry[$.index-1]++
                    data = JSON.parse(data)
                    if(data.success && data.code === "1"){  // 申请成功
                        console.log("申请提交成功")
                        totalSuccess[$.index-1]++
                    } else if(data.code === "-106"){
                        console.log(data.message)   // 未在申请时间内！
                    } else if(data.code === "-110"){
	@@ -466,11 +575,11 @@ function try_apply(title, activityId){
                        console.log(data.message)   // 抱歉，此试用需为种草官才能申请。查看下方详情了解更多。
                    } else if(data.code === "-131"){
                        console.log(data.message)   // 申请次数上限。
                        isLimit[$.index-1] = true;
                    } else if(data.code === "-113"){
                        console.log(data.message)   // 操作不要太快哦！
                    } else {
                        console.log("申请失败", data.message)
                    }
                }
            } catch(e){
	@@ -555,25 +664,26 @@ function taskurl_xh(appid, functionId, body = JSON.stringify({})){

async function showMsg(){
    let message = ``;
    message += `🆔账号${$.index} ${$.nickName || $.UserName}\n`;
    if(totalSuccess[$.index-1] !== 0){
        /*message += `🎉 本次提交申请：${totalSuccess[$.index-1]}/${totalTry[$.index-1]}个商品🛒\n`;
        message += `🎉 ${$.successNum}个商品待领取\n`;
        message += `🎉 ${$.getNum}个商品已领取\n`;
        message += `🎉 ${$.completeNum}个商品已完成\n`;
        message += `🗑 ${$.giveupNum}个商品已放弃\n\n`;*/
        message += `申请 ${totalSuccess[$.index-1]}/${totalTry[$.index-1]}\t待领 ${$.successNum}\t 已领 ${$.getNum}\t完成 ${$.completeNum}\t放弃 ${$.giveupNum}\n\n`
    } else {
        message += `⚠️ 本次执行没有申请试用商品\n`;
        message += `🎉 ${$.successNum}个商品待领取\n`;
        message += `🎉 ${$.getNum}个商品已领取\n`;
        message += `🎉 ${$.completeNum}个商品已完成\n`;
        message += `🗑 ${$.giveupNum}个商品已放弃\n\n`;        
    }
    if(!args_xh.jdNotify || args_xh.jdNotify === 'false'){
        $.msg($.name, ``, message, {
            "open-url": 'https://try.m.jd.com/user'
        })
        if($.isNode() && totalSuccess[$.index-1] !== 0)
            notifyMsg += `${message}`
    } else {
        console.log(message)
    }
}
function totalBean(){
    return new Promise(async resolve => {
        const options = {
            "url": `https://wq.jd.com/user/info/QueryJDUserInfo?sceneval=2`,
            "headers": {
                "Accept": "application/json,text/plain, */*",
                "Content-Type": "application/x-www-form-urlencoded",
                "Accept-Encoding": "gzip, deflate, br",
                "Accept-Language": "zh-cn",
                "Connection": "keep-alive",
                "Cookie": $.cookie,
                "Referer": "https://wqs.jd.com/my/jingdou/my.shtml?sceneval=2",
                "User-Agent": $.isNode() ? (process.env.JD_USER_AGENT ? process.env.JD_USER_AGENT : (require('./USER_AGENTS').USER_AGENT)) : ($.getdata('JDUA') ? $.getdata('JDUA') : "jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1")
            },
            "timeout": 10000,
        }
        $.post(options, (err, resp, data) => {
            try{
                if(err){
                    console.log(`${JSON.stringify(err)}`)
                    console.log(`${$.name} API请求失败，请检查网路重试`)
                } else {
                    if(data){
                        data = JSON.parse(data);
                        if(data['retcode'] === 13){
                            $.isLogin = false; //cookie过期
                            return
                        }
                        if(data['retcode'] === 0){
                            $.nickName = (data['base'] && data['base'].nickname) || $.UserName;
                        } else {
                            $.nickName = $.UserName
                        }
                    } else {
                        console.log(`京东服务器返回空数据`)
                    }
                }
            } catch(e){
                $.logErr(e, resp)
            } finally{
                resolve();
            }
        })
    })
}
function jsonParse(str){
    if(typeof str == "string"){
        try{
            return JSON.parse(str);
        } catch(e){
            console.log(e);
            $.msg($.name, '', '请勿随意在BoxJs输入框修改内容\n建议通过脚本去获取cookie')
            return [];
        }
    }
}
function Env(name, opts){
    class Http{
        constructor(env){
            this.env = env
        }
        send(opts, method = 'GET'){
            opts = typeof opts === 'string' ? {
                url: opts
            } : opts
            let sender = this.get
            if(method === 'POST'){
                sender = this.post
            }
            return new Promise((resolve, reject) => {
                sender.call(this, opts, (err, resp, body) => {
                    if(err) reject(err)
                    else resolve(resp)
                })
            })
        }
        get(opts){
            return this.send.call(this.env, opts)
        }
        post(opts){
            return this.send.call(this.env, opts, 'POST')
        }
    }
    return new (class{
        constructor(name, opts){
            this.name = name
            this.http = new Http(this)
            this.data = null
            this.dataFile = 'box.dat'
            this.logs = []
            this.isMute = false
            this.isNeedRewrite = false
            this.logSeparator = '\n'
            this.startTime = new Date().getTime()
            Object.assign(this, opts)
            this.log('', `🔔${this.name}, 开始!`)
        }
        isNode(){
            return 'undefined' !== typeof module && !!module.exports
        }
        isQuanX(){
            return 'undefined' !== typeof $task
        }
        isSurge(){
            return 'undefined' !== typeof $httpClient && 'undefined' === typeof $loon
        }
        isLoon(){
            return 'undefined' !== typeof $loon
        }
        toObj(str, defaultValue = null){
            try{
                return JSON.parse(str)
            } catch{
                return defaultValue
            }
        }
        toStr(obj, defaultValue = null){
            try{
                return JSON.stringify(obj)
            } catch{
                return defaultValue
            }
        }
        getjson(key, defaultValue){
            let json = defaultValue
            const val = this.getdata(key)
            if(val){
                try{
                    json = JSON.parse(this.getdata(key))
                } catch{ }
            }
            return json
        }
        setjson(val, key){
            try{
                return this.setdata(JSON.stringify(val), key)
            } catch{
                return false
            }
        }
        getScript(url){
            return new Promise((resolve) => {
                this.get({
                    url
                }, (err, resp, body) => resolve(body))
            })
        }
        runScript(script, runOpts){
            return new Promise((resolve) => {
                let httpapi = this.getdata('@chavy_boxjs_userCfgs.httpapi')
                httpapi = httpapi ? httpapi.replace(/\n/g, '').trim() : httpapi
                let httpapi_timeout = this.getdata('@chavy_boxjs_userCfgs.httpapi_timeout')
                httpapi_timeout = httpapi_timeout ? httpapi_timeout * 1 : 20
                httpapi_timeout = runOpts && runOpts.timeout ? runOpts.timeout : httpapi_timeout
                const [key, addr] = httpapi.split('@')
                const opts = {
                    url: `http://${addr}/v1/scripting/evaluate`,
                    body: {
                        script_text: script,
                        mock_type: 'cron',
                        timeout: httpapi_timeout
                    },
                    headers: {
                        'X-Key': key,
                        'Accept': '*/*'
                    }
                }
                this.post(opts, (err, resp, body) => resolve(body))
            }).catch((e) => this.logErr(e))
        }
        loaddata(){
            if(this.isNode()){
                this.fs = this.fs ? this.fs : require('fs')
                this.path = this.path ? this.path : require('path')
                const curDirDataFilePath = this.path.resolve(this.dataFile)
                const rootDirDataFilePath = this.path.resolve(process.cwd(), this.dataFile)
                const isCurDirDataFile = this.fs.existsSync(curDirDataFilePath)
                const isRootDirDataFile = !isCurDirDataFile && this.fs.existsSync(rootDirDataFilePath)
                if(isCurDirDataFile || isRootDirDataFile){
                    const datPath = isCurDirDataFile ? curDirDataFilePath : rootDirDataFilePath
                    try{
                        return JSON.parse(this.fs.readFileSync(datPath))
                    } catch(e){
                        return {}
                    }
                } else return {}
            } else return {}
        }
        writedata(){
            if(this.isNode()){
                this.fs = this.fs ? this.fs : require('fs')
                this.path = this.path ? this.path : require('path')
                const curDirDataFilePath = this.path.resolve(this.dataFile)
                const rootDirDataFilePath = this.path.resolve(process.cwd(), this.dataFile)
                const isCurDirDataFile = this.fs.existsSync(curDirDataFilePath)
                const isRootDirDataFile = !isCurDirDataFile && this.fs.existsSync(rootDirDataFilePath)
                const jsondata = JSON.stringify(this.data)
                if(isCurDirDataFile){
                    this.fs.writeFileSync(curDirDataFilePath, jsondata)
                } else if(isRootDirDataFile){
                    this.fs.writeFileSync(rootDirDataFilePath, jsondata)
                } else {
                    this.fs.writeFileSync(curDirDataFilePath, jsondata)
                }
            }
        }
        lodash_get(source, path, defaultValue = undefined){
            const paths = path.replace(/\[(\d+)\]/g, '.$1').split('.')
            let result = source
            for(const p of paths){
                result = Object(result)[p]
                if(result === undefined){
                    return defaultValue
                }
            }
            return result
        }
        lodash_set(obj, path, value){
            if(Object(obj) !== obj) return obj
            if(!Array.isArray(path)) path = path.toString().match(/[^.[\]]+/g) || []
            path.slice(0, -1).reduce((a, c, i) => (Object(a[c]) === a[c] ? a[c] : (a[c] = Math.abs(path[i + 1]) >> 0 === +path[i + 1] ? [] : {})), obj)[
                path[path.length - 1]
                ] = value
            return obj
        }
        getdata(key){
            let val = this.getval(key)
            // 如果以 @
            if(/^@/.test(key)){
                const [, objkey, paths] = /^@(.*?)\.(.*?)$/.exec(key)
                const objval = objkey ? this.getval(objkey) : ''
                if(objval){
                    try{
                        const objedval = JSON.parse(objval)
                        val = objedval ? this.lodash_get(objedval, paths, '') : val
                    } catch(e){
                        val = ''
                    }
                }
            }
            return val
        }
        setdata(val, key){
            let issuc = false
            if(/^@/.test(key)){
                const [, objkey, paths] = /^@(.*?)\.(.*?)$/.exec(key)
                const objdat = this.getval(objkey)
                const objval = objkey ? (objdat === 'null' ? null : objdat || '{}') : '{}'
                try{
                    const objedval = JSON.parse(objval)
                    this.lodash_set(objedval, paths, val)
                    issuc = this.setval(JSON.stringify(objedval), objkey)
                } catch(e){
                    const objedval = {}
                    this.lodash_set(objedval, paths, val)
                    issuc = this.setval(JSON.stringify(objedval), objkey)
                }
            } else {
                issuc = this.setval(val, key)
            }
            return issuc
        }
        getval(key){
            if(this.isSurge() || this.isLoon()){
                return $persistentStore.read(key)
            } else if(this.isQuanX()){
                return $prefs.valueForKey(key)
            } else if(this.isNode()){
                this.data = this.loaddata()
                return this.data[key]
            } else {
                return (this.data && this.data[key]) || null
            }
        }
        setval(val, key){
            if(this.isSurge() || this.isLoon()){
                return $persistentStore.write(val, key)
            } else if(this.isQuanX()){
                return $prefs.setValueForKey(val, key)
            } else if(this.isNode()){
                this.data = this.loaddata()
                this.data[key] = val
                this.writedata()
                return true
            } else {
                return (this.data && this.data[key]) || null
            }
        }
        initGotEnv(opts){
            this.got = this.got ? this.got : require('got')
            this.cktough = this.cktough ? this.cktough : require('tough-cookie')
            this.ckjar = this.ckjar ? this.ckjar : new this.cktough.CookieJar()
            if(opts){
                opts.headers = opts.headers ? opts.headers : {}
                if(undefined === opts.headers.Cookie && undefined === opts.cookieJar){
                    opts.cookieJar = this.ckjar
                }
            }
        }
        get(opts, callback = () => { }){
            if(opts.headers){
                delete opts.headers['Content-Type']
                delete opts.headers['Content-Length']
            }
            if(this.isSurge() || this.isLoon()){
                if(this.isSurge() && this.isNeedRewrite){
                    opts.headers = opts.headers || {}
                    Object.assign(opts.headers, {
                        'X-Surge-Skip-Scripting': false
                    })
                }
                $httpClient.get(opts, (err, resp, body) => {
                    if(!err && resp){
                        resp.body = body
                        resp.statusCode = resp.status
                    }
                    callback(err, resp, body)
                })
            } else if(this.isQuanX()){
                if(this.isNeedRewrite){
                    opts.opts = opts.opts || {}
                    Object.assign(opts.opts, {
                        hints: false
                    })
                }
                $task.fetch(opts).then(
                    (resp) => {
                        const {
                            statusCode: status,
                            statusCode,
                            headers,
                            body
                        } = resp
                        callback(null, {
                            status,
                            statusCode,
                            headers,
                            body
                        }, body)
                    },
                    (err) => callback(err)
                )
            } else if(this.isNode()){
                this.initGotEnv(opts)
                this.got(opts).on('redirect', (resp, nextOpts) => {
                    try{
                        if(resp.headers['set-cookie']){
                            const ck = resp.headers['set-cookie'].map(this.cktough.Cookie.parse).toString()
                            if(ck){
                                this.ckjar.setCookieSync(ck, null)
                            }
                            nextOpts.cookieJar = this.ckjar
                        }
                    } catch(e){
                        this.logErr(e)
                    }
                    // this.ckjar.setCookieSync(resp.headers['set-cookie'].map(Cookie.parse).toString())
                }).then(
                    (resp) => {
                        const {
                            statusCode: status,
                            statusCode,
                            headers,
                            body
                        } = resp
                        callback(null, {
                            status,
                            statusCode,
                            headers,
                            body
                        }, body)
                    },
                    (err) => {
                        const {
                            message: error,
                            response: resp
                        } = err
                        callback(error, resp, resp && resp.body)
                    }
                )
            }
        }
        post(opts, callback = () => { }){
            // 如果指定了请求体, 但没指定`Content-Type`, 则自动生成
            if(opts.body && opts.headers && !opts.headers['Content-Type']){
                opts.headers['Content-Type'] = 'application/x-www-form-urlencoded'
            }
            if(opts.headers) delete opts.headers['Content-Length']
            if(this.isSurge() || this.isLoon()){
                if(this.isSurge() && this.isNeedRewrite){
                    opts.headers = opts.headers || {}
                    Object.assign(opts.headers, {
                        'X-Surge-Skip-Scripting': false
                    })
                }
                $httpClient.post(opts, (err, resp, body) => {
                    if(!err && resp){
                        resp.body = body
                        resp.statusCode = resp.status
                    }
                    callback(err, resp, body)
                })
            } else if(this.isQuanX()){
                opts.method = 'POST'
                if(this.isNeedRewrite){
                    opts.opts = opts.opts || {}
                    Object.assign(opts.opts, {
                        hints: false
                    })
                }
                $task.fetch(opts).then(
                    (resp) => {
                        const {
                            statusCode: status,
                            statusCode,
                            headers,
                            body
                        } = resp
                        callback(null, {
                            status,
                            statusCode,
                            headers,
                            body
                        }, body)
                    },
                    (err) => callback(err)
                )
            } else if(this.isNode()){
                this.initGotEnv(opts)
                const {
                    url,
                    ..._opts
                } = opts
                this.got.post(url, _opts).then(
                    (resp) => {
                        const {
                            statusCode: status,
                            statusCode,
                            headers,
                            body
                        } = resp
                        callback(null, {
                            status,
                            statusCode,
                            headers,
                            body
                        }, body)
                    },
                    (err) => {
                        const {
                            message: error,
                            response: resp
                        } = err
                        callback(error, resp, resp && resp.body)
                    }
                )
            }
        }
        /**
         *
         * 示例:$.time('yyyy-MM-dd qq HH:mm:ss.S')
         *    :$.time('yyyyMMddHHmmssS')
         *    y:年 M:月 d:日 q:季 H:时 m:分 s:秒 S:毫秒
         *    其中y可选0-4位占位符、S可选0-1位占位符，其余可选0-2位占位符
         * @param {*} fmt 格式化参数
         *
         */
        time(fmt){
            let o = {
                'M+': new Date().getMonth() + 1,
                'd+': new Date().getDate(),
                'H+': new Date().getHours(),
                'm+': new Date().getMinutes(),
                's+': new Date().getSeconds(),
                'q+': Math.floor((new Date().getMonth() + 3) / 3),
                'S': new Date().getMilliseconds()
            }
            if(/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (new Date().getFullYear() + '').substr(4 - RegExp.$1.length))
            for(let k in o)
                if(new RegExp('(' + k + ')').test(fmt))
                    fmt = fmt.replace(RegExp.$1, RegExp.$1.length == 1 ? o[k] : ('00' + o[k]).substr(('' + o[k]).length))
            return fmt
        }
        /**
         * 系统通知
         *
         * > 通知参数: 同时支持 QuanX 和 Loon 两种格式, EnvJs根据运行环境自动转换, Surge 环境不支持多媒体通知
         *
         * 示例:
         * $.msg(title, subt, desc, 'twitter://')
         * $.msg(title, subt, desc, { 'open-url': 'twitter://', 'media-url': 'https://github.githubassets.com/images/modules/open_graph/github-mark.png' })
         * $.msg(title, subt, desc, { 'open-url': 'https://bing.com', 'media-url': 'https://github.githubassets.com/images/modules/open_graph/github-mark.png' })
         *
         * @param {*} title 标题
         * @param {*} subt 副标题
         * @param {*} desc 通知详情
         * @param {*} opts 通知参数
         *
         */
        msg(title = name, subt = '', desc = '', opts){
            const toEnvOpts = (rawopts) => {
                if(!rawopts) return rawopts
                if(typeof rawopts === 'string'){
                    if(this.isLoon()) return rawopts
                    else if(this.isQuanX()) return {
                        'open-url': rawopts
                    }
                    else if(this.isSurge()) return {
                        url: rawopts
                    }
                    else return undefined
                } else if(typeof rawopts === 'object'){
                    if(this.isLoon()){
                        let openUrl = rawopts.openUrl || rawopts.url || rawopts['open-url']
                        let mediaUrl = rawopts.mediaUrl || rawopts['media-url']
                        return {
                            openUrl,
                            mediaUrl
                        }
                    } else if(this.isQuanX()){
                        let openUrl = rawopts['open-url'] || rawopts.url || rawopts.openUrl
                        let mediaUrl = rawopts['media-url'] || rawopts.mediaUrl
                        return {
                            'open-url': openUrl,
                            'media-url': mediaUrl
                        }
                    } else if(this.isSurge()){
                        let openUrl = rawopts.url || rawopts.openUrl || rawopts['open-url']
                        return {
                            url: openUrl
                        }
                    }
                } else {
                    return undefined
                }
            }
            if(!this.isMute){
                if(this.isSurge() || this.isLoon()){
                    $notification.post(title, subt, desc, toEnvOpts(opts))
                } else if(this.isQuanX()){
                    $notify(title, subt, desc, toEnvOpts(opts))
                }
            }
            if(!this.isMuteLog){
                let logs = ['', '==============📣系统通知📣==============']
                logs.push(title)
                subt ? logs.push(subt) : ''
                desc ? logs.push(desc) : ''
                console.log(logs.join('\n'))
                this.logs = this.logs.concat(logs)
            }
        }
        log(...logs){
            if(logs.length > 0){
                this.logs = [...this.logs, ...logs]
            }
            console.log(logs.join(this.logSeparator))
        }
        logErr(err, msg){
            const isPrintSack = !this.isSurge() && !this.isQuanX() && !this.isLoon()
            if(!isPrintSack){
                this.log('', `❗️${this.name}, 错误!`, err)
            } else {
                this.log('', `❗️${this.name}, 错误!`, err.stack)
            }
        }
        wait(time){
            return new Promise((resolve) => setTimeout(resolve, time))
        }
        done(val = {}){
            const endTime = new Date().getTime()
            const costTime = (endTime - this.startTime) / 1000
            this.log('', `🔔${this.name}, 结束! 🕛 ${costTime} 秒`)
            this.log()
            if(this.isSurge() || this.isQuanX() || this.isLoon()){
                $done(val)
            }
        }
    })(name, opts)
}
