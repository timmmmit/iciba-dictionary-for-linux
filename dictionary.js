var args = process.argv.splice(2);
route( args )


function route( args ) {
  //没有参数的情况下默认不显示例句，将单词加入单词本
  var withExamples = false;
  var addToWordsBook = true;
  var englishToChinese = true;

  //如果不加参数，或者第一个参数为-s：随机每日一句
  if ( args.length == 0 || args[0] == "-s" ) {
    getARandomSentence();
    return;
  }

  //如果第一个参数是-t： 单词测试
  if ( args[0] == '-t' ) {

    return;
  }

  //查单词
  var wordOrSentence = "";
  var engReg = /^(\w|\s)*$/;
  var chReg = /[^\u0000-\u00FF]*/;
  for ( var index = 0; index < args.length; index ++ ) { 
    //匹配一个单词或者句子
    if ( engReg.test( args[index] )) {
      //取第一个单词或者句子
      wordOrSentence = args[index];
      break;
    } else if (chReg.test( args[index] )) {
      wordOrSentence = args[index];
      englishToChinese = false;
      break;
    }
  }

  if ( wordOrSentence.trim() == "" ){
    console.log("bad request");
    return;
  }

  if ( args.indexOf('-e') != -1 ) withExamples = !withExamples;
  if ( args.indexOf('-n') != -1 ) addToWordsBook = !addToWordsBook;

  dictionary( wordOrSentence, withExamples, addToWordsBook, englishToChinese );
}

function dictionary( wordOrSentence, withExamples, addToWordsBook, englishToChinese ) {
  const rp = require('request-promise');
  const cheerio = require('cheerio');
  var MD5 = require('./md5.js');

  var appid = '20180601000170262';
  var salt = '123456';
  var seckey = 'BL9f7_JUncqXRgGf5AU2';
  var sign = MD5(appid + wordOrSentence + salt + seckey);
  var transTo = englishToChinese ? 'zh' : 'en';
  var queryStr = 'q=' + wordOrSentence + '&from=auto&to=' + transTo + '&appid=' + appid + '&salt=' + salt + '&sign=' + sign;

  const options = {
    uri: encodeURI('http://api.fanyi.baidu.com/api/trans/vip/translate?' + queryStr),
    transform: function (body) {
      return cheerio.load(body);
    }
  };

  //Send the request and handle the response
  rp(options)
    .then(function ( $ ) {
      eval("var obj = " + $.text());
      console.log(obj.trans_result[0].dst);

    })
    .catch(function (err) {
        console.log( 'error ->' + err);
    });
}

function getARandomSentence() {
  //根据爱词霸的api，每日一句会根据所给的日期生成，这里随机生成一个在2012-1-1到2017-12-28的日期
  var year = 2011 + Math.ceil(Math.random()*6);
  var month = Math.ceil(Math.random()*12);
  //偷个懒，不考虑月份日期只取1-28号
  var day = Math.ceil(Math.random()*28);
  var uri = "http://open.iciba.com/dsapi/?date=" + year + "-" + month + "-" + day;

  const rp = require('request-promise');
  const cheerio = require('cheerio');

  const options = {
    uri: uri,
    transform: function (body) {
      return cheerio.load(body);
    }
  };

  //发送请求，处理结果
  rp(options)
    .then(function ( $ ) {
      eval("var obj = " + $.text());
      var english = obj.content;
      console.log(obj.content + "\n" + obj.note);
    })
    .catch(function (err) {
        console.log( err );
    });
}