const fs = require('fs');
var sourceData = require('./table1.json');

console.log(`diff --git a/JPTableFull.pdf b/kCantonese.txt
--- a/JPTableFull.pdf
+++ b/kCantonese.txt
`);

// wget https://raw.githubusercontent.com/unicode-org/unihan-database/master/kCantonese.txt
var kCantonese = fs.readFileSync('./kCantonese.txt', 'utf8');
var unihan = [...kCantonese.matchAll(/(U\+[0-9A-F]+).*kCantonese(.*)/g)];

var jptablefullkeyed = {};
var jptablefullkeyedstring = {};
sourceData.forEach((character) => {
  if (parseInt(character.ucs2,16) >= 0xE000) {
    return;
  }

  jptablefullkeyed[`U+${character.ucs2}`] = character;
  jptablefullkeyedstring[`U+${character.ucs2}`] = [];

  if (!character.infoArray) {
    jptablefullkeyedstring[`U+${character.ucs2}`].push(`U+${character.ucs2} NOT INCLUDED IN JPTABLEFULL.PDF`)
    return;
  }

  for (let i = 0; i < character.infoArray.length; i++) {
    jptablefullkeyedstring[`U+${character.ucs2}`].push(`U+${character.ucs2} ${String.fromCodePoint(parseInt(character.ucs2,16))}\tkCantonese\t${character.infoArray[i].jyutping}\t${character.infoArray[i].pn}`)
  }
});

unihan.forEach(entry => {
  var line = entry[0];
  var charCode = entry[1];
  var pronunciation = entry[2].trim();

  var firstPronunciation = jptablefullkeyed[charCode] && jptablefullkeyed[charCode].infoArray ? jptablefullkeyed[charCode].infoArray[0].jyutping : "";

  if (parseInt(charCode.substr(2),16) >= 0xE000) {
    return;
  }

  if (pronunciation === firstPronunciation) {
    return;
  }

  if (jptablefullkeyedstring[charCode]) {
    console.log(`-${jptablefullkeyedstring[charCode].join('\n-')}`.replaceAll('kCantonese', 'JPTableFull'));
  } else {
    console.log(`-${charCode} NOT INCLUDED IN JPTABLEFULL.PDF`);
  }

  console.log(`+${line}`);
  console.log('');
});
