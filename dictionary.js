var args = process.argv.splice(2);
var wordsBookPath = '';
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
  var chReg = /^[\u4e00-\u9fa5]{1,}$/;

  //找到要查的那个单词或者句子
  var begin = false;
  var params = ['-e', '-t', '-n', '-s'];
  for ( var index = 0; index < args.length; index ++ ) {

    if ( !begin && params.indexOf( args[index]) == -1 ) {
      begin = true;
      wordOrSentence += args[index] + " ";
      if ( chReg.test( args[index] ) )  {
        englishToChinese = false;
      }
      if ( args.length == index + 1 || params.indexOf(args[index + 1]) != -1 ) {
        break;
      }
      continue;
    } else if ( !begin && params.indexOf( args[index]) != -1 ) {
      continue;
    }

    if ( chReg.test( args[index] ) ) {
      englishToChinese = false;
    }
    wordOrSentence += args[index] + " ";

    if ( args.length == index + 1 || params.indexOf(args[index + 1]) != -1 ) {
      break;
    }
  }

  wordOrSentence = wordOrSentence.trim();
  if ( wordOrSentence == "" ){
    console.log("show how to use it");
    return;
  }

  if ( args.indexOf('-e') != -1 ) withExamples = !withExamples;
  if ( args.indexOf('-n') != -1 ) addToWordsBook = !addToWordsBook;

  if ( englishToChinese && wordOrSentence.indexOf(" ") == -1 || !englishToChinese && wordOrSentence.length <= 2 ) {
    icibaDictionary( wordOrSentence, withExamples, addToWordsBook, englishToChinese );
  } else {
    baiduDictionary( wordOrSentence, withExamples, addToWordsBook, englishToChinese );
  }
}

function baiduDictionary( wordOrSentence, withExamples, addToWordsBook, englishToChinese ) {
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

function icibaDictionary( wordOrSentence, withExamples, addToWordsBook, englishToChinese ) {
  const rp = require('request-promise');
  const cheerio = require('cheerio');

  const options = {
    uri: encodeURI('http://www.iciba.com/' + wordOrSentence),
    transform: function (body) {
      return cheerio.load(body);
    }
  };

  //Send the request and handle the response
  rp(options)
    .then(function ( $ ) {
      //英译中
      if ( englishToChinese ) {
        //最多展示3条例句
        var maxExampleLength = 3;
        var soundMark = $("div.base-speak").text().trim().replace(/\s{2,}/, '     ').replace(/\n{1,}/, '');
        var translation = $("ul.base-list.switch_part").text().replace(/\.(\n)+/g, '\.').replace(/\s{2,}/g, ' ').trim().replace(/\s(\w{1,5})\./g, '\n$1\.')
        var examples = "";
  
        if ( withExamples ) {
          $("div.sentence-item").each(function(index, element) {
            examples = examples + (index + 1) + "." + $(this).text();
            if ( index == maxExampleLength - 1 ) return false;
          });

          examples = examples.replace(/\.{3}/g, '\.').replace(/\n{1,}/, '').replace(/\s{2,}/g, ' ').replace(/(\d)\./g, '\n$1\.');
        }
  
        console.log(wordOrSentence + "\n" + soundMark + "\n" + translation + "\n" + examples);

      //中译英
      } else {
        var translation = $("ul.base-list.switch_part").text().replace(/\s*释义\s*/, '').replace(/\n{1,}/, '').replace(/\s{2,}/g, ' ');
        console.log( translation );
      }
    })
    .catch(function (err) {
        console.log( 'error ->' + err);
    });
}