var sourceData = require('./table1.json');
var sourceData2 = require('./table2.json');

var output = [];
sourceData.forEach((character) => {
  if (!character.infoArray) {
    return;
  }

  character.infoArray.forEach((info) => {
    if (info.reference) {
      return;
    }
    output.push([character.ch, `U+${character.ch.codePointAt(0).toString(16).toUpperCase()}`, info.jyutping]);
  });
});

sourceData2.forEach((character) => {
  output.push([character.ch, `U+${character.part.codePointAt(0).toString(16).toUpperCase()}`, character.jyutping]);
});

output = output.sort((a, b) => {
  if (a[1] < b[1]) {
    return -1;
  } else if (a[1] > b[1]) {
    return 1;
  } else {
    return 0;
  }
});

output = output.sort((a, b) => {
  if (a[0] < b[0]) {
    return -1;
  } else if (a[0] > b[0]) {
    return 1;
  } else {
    return 0;
  }
});

var previousString = "";
for (let i = 0; i < output.length; i++) {
  var tsv = output[i].join('\t')
  if (tsv === previousString) {
    continue;
  }
  previousString = tsv;

  console.log(tsv);
}
