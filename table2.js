const hkscs = require('hkscs_unicode_converter');

function getContent(text) {
  return decodeURIComponent(text.R[0].T);
}

var skip = [
  "6.",
  "《部件名稱表》",
  "部件",
  "UCS-2",
  "名稱",
  "名稱粵音",
  "268",
  "269",
  "270",
  "271",
  "272",
  "273",
  "* 表示該部件沒有出現在康熙索引表內。",
  "274"
];

function main(pages) {
  var results = [];

  pages.forEach(function(page, pageNumber) {
    if (pageNumber < 267) {
      return;
    }

    var texts = page.Texts;

    texts = texts.sort((a, b) => {
      var test = a.x - b.x;

      if (test > 0) {
        return 1;
      } else if (test < 0) {
        return -1;
      } else {
        return 0;
      }
    });

    texts = texts.sort((a, b) => {
      var test = a.y - b.y;

      if (test > 0) {
        return 1;
      } else if (test < 0) {
        return -1;
      } else {
        return 0;
      }
    });

    texts.forEach(function(text) {
      var content = getContent(text).trim(' *');
      if (skip.indexOf(content) !== -1) {
        return;
      }
      results.push(content);
    });
  });

  var output = [];
  for (let i = 0; i < results.length; i += 4) {
    let [ucs2, part, description, jyutping] = results.slice(i, i + 4);
    let kangxi = part[part.length - 1] === "*";
    if (kangxi) {
      part = part.slice(0, -1);
    }
    output.push({
      ucs2,
      part: hkscs.convertCharacter(part),
      kangxi,
      description: hkscs.convertString(description),
      jyutping
    });
  }

  return JSON.stringify(output, null, 2);
}

module.exports = main;
