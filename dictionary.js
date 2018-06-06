/**
      Colors
  Reset = "\x1b[0m"
  Bright = "\x1b[1m"
  Dim = "\x1b[2m"
  Underscore = "\x1b[4m"
  Blink = "\x1b[5m"
  Reverse = "\x1b[7m"
  Hidden = "\x1b[8m"

  FgBlack = "\x1b[30m"
  FgRed = "\x1b[31m"
  FgGreen = "\x1b[32m"
  FgYellow = "\x1b[33m"
  FgBlue = "\x1b[34m"
  FgMagenta = "\x1b[35m"
  FgCyan = "\x1b[36m"
  FgWhite = "\x1b[37m"
 */

var args = process.argv.splice(2);
var noteBookPath = 'notebook';
var maxExampleLength = 3;

const rp = require('request-promise');
const cheerio = require('cheerio');

var errorColor = "\x1b[31m";
var keyWordColor = "\x1b[32m";
var soundMarksColor = "\x1b[33m";
var translationColor = "\x1b[34m";
var enSentenceColor = "\x1b[36m";
var chSentenceColor = "\x1b[37m";

index( args )

function index( args ) {
  //没有参数的情况下默认不显示例句，将单词加入单词本
  var withExamples = false;
  var addToNoteBook = true;
  var englishToChinese = true;

  //如果不加参数，或者第一个参数为-s：随机每日一句
  if ( args.length == 0 || args[0] == "-s" ) {
    getARandomSentence();
    return;
  }

  //如果第一个参数是-t： 单词测试
  if ( args[0] == '-t' ) {
    //拿到第一个int类型参数，作为测试单词数
    var testWordsNumber = 10;
    if ( args.length != 1 ) {
      for ( var index = 1; index < args.length; index ++ ) {
        var number = parseInt(args[index]);
        if ( number > 0 && number % 1 === 0 ) {
          testWordsNumber = args[index];
          break;
        }
      }
    }
    wordsTest( testWordsNumber );
    return;
  }

  //查单词
  var wordOrSentence = "";
  var chReg = /^[\u4e00-\u9fa5]{1,}$/;

  //找到要查的那个单词或者句子
  var begin = false;
  var params = ['-e', '-t', '-n', '-s'];
  for ( var index = 0; index < args.length; index ++ ) {

    if ( !begin && params.indexOf( args[index]) == -1 ) {
      begin = true;
      wordOrSentence += args[index] + " ";
      if ( args.length == index + 1 || params.indexOf(args[index + 1]) != -1 ) {
        break;
      }
      continue;
    } else if ( !begin && params.indexOf( args[index]) != -1 ) {
      continue;
    }

    wordOrSentence += args[index] + " ";

    if ( args.length == index + 1 || params.indexOf(args[index + 1]) != -1 ) {
      break;
    }
  }

  wordOrSentence = wordOrSentence.trim();
  if ( chReg.test( args[index] ) || args[index] % 1 === 0 )  englishToChinese = false;
  if ( wordOrSentence == "" ){
    console.log("show how to use it");
    return;
  }

  if ( args.indexOf('-e') != -1 ) withExamples = !withExamples;
  if ( args.indexOf('-n') != -1 ) addToNoteBook = !addToNoteBook;

  if ( englishToChinese && wordOrSentence.indexOf(" ") == -1 || !englishToChinese && wordOrSentence.length <= 2 ) {
    icibaDictionary( wordOrSentence, withExamples, addToNoteBook, englishToChinese );
  } else {
    baiduDictionary( wordOrSentence, withExamples, addToNoteBook, englishToChinese );
  }

}

function baiduDictionary( wordOrSentence, withExamples, addToNoteBook, englishToChinese ) {
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
  var ret = { a: "a"};
  ret = rp(options)
    .then(function ( $ ) {
      eval("var obj = " + $.text());

      if ( addToNoteBook ) {
        writeToNoteBook( wordOrSentence, obj.trans_result[0].dst );
      }

      console.log( translationColor ,obj.trans_result[0].dst.trim() );
    })
    .catch(function (err) {
        console.log( errorColor, 'error ->' + err);
    });
}

function getARandomSentence() {
  //根据爱词霸的api，每日一句会根据所给的日期生成，这里随机生成一个在2012-1-1到2017-12-28的日期
  var year = 2011 + Math.ceil(Math.random()*6);
  var month = Math.ceil(Math.random()*12);
  //偷个懒，不考虑月份日期只取1-28号
  var day = Math.ceil(Math.random()*28);
  var uri = "http://open.iciba.com/dsapi/?date=" + year + "-" + month + "-" + day;

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
      console.log( enSentenceColor, obj.content + "\n", chSentenceColor, obj.note);
    })
    .catch(function (err) {
        console.log( errorColor, err );
    });
}

function icibaDictionary( wordOrSentence, withExamples, addToNoteBook, englishToChinese ) {
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
      var translation = '';
      var soundMark = '';
      var examples = "";

      if ( englishToChinese ) {
        soundMark = $("div.base-speak").text().replace(/\s{2,}/g, ' ').replace(/\n{1,}/g, '').trim();
        translation = $("ul.base-list.switch_part").text().replace(/\.(\n)+/g, '\.').replace(/\s{2,}/g, ' ').trim().replace(/\s(\w{1,5})\./g, '\n$1\.')
  
        if ( withExamples ) {
          $("div.sentence-item").each(function(index, element) {
            examples = examples + (index + 1) + "." + $(this).text();
            if ( index == maxExampleLength - 1 ) return false;
          });

          examples = examples.replace(/\.{3}/g, '\.').replace(/\n{1,}/, '').replace(/\s{2,}/g, ' ').replace(/(\d)\./g, '\n$1\.');
        }

      //中译英
      } else {
        translation = $("ul.base-list.switch_part").text().replace(/\s*释义\s*/, '').replace(/\n{1,}/, '').replace(/\s{2,}/g, ' ');
      }
      if ( translation != "" ) {
        console.log( keyWordColor, "\n" + wordOrSentence + ":");
        if ( englishToChinese ) console.log( soundMarksColor, "\n" + soundMark);
        console.log(translationColor, "\n" + translation + "\n");
      } else {
        addToNoteBook = false;
        console.log(errorColor, 'No such word');
      }

      if ( addToNoteBook ) {
        writeToNoteBook( wordOrSentence, translation );
      }
    })
    .catch(function (err) {
        console.log( errorColor, err);
    });
}

function writeToNoteBook( originalText, translatedText ) {
  //如果文件不存在则创建文件
  var fs = require('fs');
  fs.exists( noteBookPath, function ( exists ) {
    if ( !exists ) {
      fs.writeFile(noteBookPath, '', function( err ) {
        if ( err ) console.log( errorColor, err );
      });
    }
  });

  //如果此单词已经在生词本中则不再添加
  var isOriginalTextExist = true;
  var data = fs.readFileSync(noteBookPath, 'utf8');
  if ( data.indexOf( originalText + "-->") == -1) {
    isOriginalTextExist = false;
  }

  if ( !isOriginalTextExist ) {
    fs.appendFile(noteBookPath, originalText + "-->" + translatedText.replace(/\n/g, '') + "\n", function (err) { 
      if (err) console.log(err);
    });
  }
}

function wordsTest( times ) {
  console.log( times );
}