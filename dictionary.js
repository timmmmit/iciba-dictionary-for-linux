var args = process.argv.splice(2);
route( args )


function route( args ) {
  //没有参数的情况下默认不显示例句，将单词加入单词本
  var withExamples = false;
  var addToWordsBook = true;

  //如果不加参数，或者第一个参数为-s：随机每日一句
  if ( args.length == 0 || args[1] == "-s" ) {
    getARandomSentence();
    return;
  }

  //如果第一个参数是-t： 单词测试
  if ( args[1] == '-t' ) {

    return;
  }

  //查单词
  var wordOrSentence = "";
  for ( var arg in args ) {
    //匹配一个单词或者句子
    var reg = /^(\w|\s)*$/;
    if ( reg.test(arg) ) {
      //取第一个单词或者句子
      wordOrSentence = arg;
      break;
    }
  }

  if ( wordOrSentence.trim() == "" ){
    console.log("bad request");
    return;
  }

  if ( args.indexOf('-e') != -1 ) withExamples = !withExamples;
  if ( args.indexOf('-n') != -1 ) addToWordsBook = !addToWordsBook;

  dictionary( word, withExamples, addToWordsBook );
}

function dictionary() {
  const rp = require('request-promise');
  const cheerio = require('cheerio');

  const options = {
    uri: 'http://www.iciba.com/dictionary',
    transform: function (body) {
      return cheerio.load(body);
    }
  };

  //Send the request and handle the response
  rp(options)
    .then(function ( $ ) {
        //console.log($("h1[class=keyword]").text());
        console.log($.text());
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