const hkscs = require('hkscs_unicode_converter');

var template = {
  type: null,
  rg: null,
  rad: null,
  ucs2: null,
  ch: null,
  infoArray: [
    {
      jyutping: null,
      en: null,
      pn: null,
      cl: null,
      sc: null,
      ref: null
    }
  ]
};

function calculateGrid(page) {
  var fills = page.Fills.filter((fill) => {
    return fill.w > 7;
  });

  fills = fills.map((fill) => {
    fill.column = Math.ceil((fill.x - 2) / 8.5);
    return fill;
  });

  fills = fills.sort((a, b) => {
    var test = (a.column * 52.625 + a.y) - (b.column * 52.625 + b.y);
    if (test > 0) {
      return 1;
    } else if (b < 0) {
      return -1;
    } else {
      return 0;
    }
  });

  var previousY = 0;
  var previousColumn = 1;
  fills.forEach((fill, index) => {
    if (fill.column > previousColumn) {
      previousY = 0;
    }
    fill.id = index;
    fill.top = previousY;
    fill.right = (fill.column * 8.5) + 1;
    fill.bottom = fill.y - .5;
    fill.left = ((fill.column - 1) * 8.5) + 1;
    previousY = fill.bottom;
    previousColumn = fill.column;
  });

  // var output = '';
  // fills.forEach((fill) => {
  //   var temp = `<div style="border: 1px solid #000; font-size: 10px; line-height: 10px; position: absolute; top: ${10*fill.top}px; left: ${10*fill.left}px; width: ${10*(fill.right-fill.left)}px; height: ${10*(fill.bottom-fill.top)}px;">${fill.id}</div>`
  //   output += temp;
  // });
  // console.log(output);

  return fills;
}


function getIdentifier(grid, text) {
  // console.log(`<div style="position: absolute; left: ${10*text.x}px; top: ${10*text.y}px; width: 0px; height: 0px; line-height: 0px; border: 1px solid red;' title='${getContent(text)}"></div>`)

  for (var i = 0; i < grid.length; i++) {
    if (
      text.x > grid[i].left && text.x < grid[i].right &&
      text.y > grid[i].top && text.y < grid[i].bottom
    ) {
      return grid[i].id;
    }
  }
}

function getContent(text) {
  return decodeURIComponent(text.R[0].T);
}

function identifyField(text) {
  var lookups = {
    ucs2: {
      x: [2.105, 10.527, 18.95, 27.372],
      valid: /^[A-F0-9]{4}$/i
    },
    ch: {
      x: [3.163, 11.585, 20.008, 28.43]
    },
    type: {
      identify: /^(<|#|>|S|\$|\*|\*\*|\*\*\*|\*\*\*\*)([\w]*;[\w]*(<|#|>|S|\$|\*|\*\*|\*\*\*|\*\*\*\*)){0,}$/
    },
    referenceucs2: {
      xRange: {
        column1: [5.1, 7.2],
        column2: [13.5, 15.7],
        column3: [22.0, 24.1],
        column4: [30.3, 32.5]
      },
      valid: /^([A-F0-9]{4}){1,}$/i
    },
    reference: {
      xRange: {
        column1: [5.1, 7.2],
        column2: [13.5, 15.7],
        column3: [22.0, 24.1],
        column4: [30.3, 32.5]
      }
    },
    en: {
      identify: /^(t|s)$/
    },
    pn: {
      x: [7.768000000000001, 16.19, 24.613, 33.035],
      valid: /^[0-9]+$/
    },
    cl: {
      identify: /^又$/
    },
    sc: {
      x: [9.012, 17.435, 25.858, 34.28],
      valid: /^[0-9\.]+$/
    },
    rg: {
      x: [4.227, 12.65, 21.072, 29.495],
      valid: /^[123]{1}$/
    },
    rad: {
      x: [4.588, 13.01, 21.433, 29.855],
      valid: /^部$/
    },
    jyutping: {
      identify: /^([a-z]{1,}[\d])(?:\s+([a-z]{1,}[\d])){0,}$/i
    }
  };

  var content = getContent(text);

  for (field in lookups) {
    // Short-circuit for uniquely identifiable fields.
    if (lookups[field].identify && lookups[field].identify.test(content)) {
      return field;
    }

    var passed = [];
    for (condition in lookups[field]) {
      var result = false;
      switch (condition) {
        case 'identify': break;
        case 'x':
          var adjustedLookup = lookups[field][condition].map(value => value.toFixed(1));
          var adjustedValue = text.x.toFixed(1);
          result = adjustedLookup.indexOf(adjustedValue) !== -1;
          passed.push(result);
        break;
        case 'xRange':
          for (range in lookups[field][condition]) {
            var [low, high] = lookups[field][condition][range];
            if (text.x > low && text.x < high) {
              result = true;
              break;
            }
          }
          passed.push(result);
        break;
        case 'valid':
          result = lookups[field][condition].test(content);
          passed.push(result);
        break;
      }
    }

    if (passed.length > 0 && passed.every(e => e === true)) {
      return field;
    } else {
      passed = [];
    }
  }

  throw new Error('Identification failed.');
}

function processReferences(entry) {
  if (entry.infoArray[0].reference && !entry.infoArray[0].referenceucs2) {

  } else if (!entry.infoArray[0].reference || !entry.infoArray[0].referenceucs2) {

  } else if (entry.infoArray[0].reference.length === entry.infoArray[0].referenceucs2.length) {
    entry.infoArray[0].ref = [];
    for (var i = 0; i < entry.infoArray[0].reference.length; i++) {
      entry.infoArray[0].ref.push({
        ucs2: entry.infoArray[0].referenceucs2[i].content,
        ch: entry.infoArray[0].reference[i].content
      });
    }
  } else if (entry.infoArray[0].referenceucs2.length < entry.infoArray[0].reference.length) {
    entry.infoArray[0].ref = [];

    // Fix merged reference ucs2 values.
    var ucs2array = entry.infoArray[0].referenceucs2.map(ref => ref.content).join('').match(/.{4}/g);
    for (var i = 0; i < entry.infoArray[0].reference.length; i++) {
      entry.infoArray[0].ref.push({
        ucs2: ucs2array[i],
        ch: entry.infoArray[0].reference[i].content
      });
    }
  } else {
    console.error(entry);
  }

  delete entry.infoArray[0].reference;
  delete entry.infoArray[0].referenceucs2;

  return entry;
}

function replacer(key, value) {
  if (value === null) {
    return undefined;
  }

  if (Array.isArray(value) && value.length === 0) {
    return undefined;
  }

  if (key === 'infoArray' && Object.values(value[0]).every(e => e === null)) {
    return undefined;
  }

  return value;
}

function main(pages) {
  var results = [];

  pages.forEach(function(page, pageNumber) {
    if (pageNumber < 12 || pageNumber > 266) {
      return;
    }

    var grid = calculateGrid(page)
    var pageResults = {};

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

    texts.forEach(function(text) {
      var id = getIdentifier(grid, text);
      if (id === 0) {
        return;
      }

      var fieldName = identifyField(text);
      if (!fieldName) {
        return;
      }

      var content = getContent(text);

      pageResults[id] = pageResults[id] || JSON.parse(JSON.stringify(template));

      var currentEntry = pageResults[id];

      switch (fieldName) {
        case 'reference':
        case 'referenceucs2':
          currentEntry.infoArray[0][fieldName] = currentEntry.infoArray[0][fieldName] || [];
          currentEntry.infoArray[0][fieldName].push({ x: text.x, content: content });
        break;
        case 'en':
        case 'sc':
        case 'jyutping':
          currentEntry.infoArray[0][fieldName] = content;
        break;
        case 'pn':
          currentEntry.infoArray[0][fieldName] = parseInt(content, 10);
        break;
        case 'cl':
          currentEntry.infoArray[0][fieldName] = true;
        break;
        case 'rad':
          currentEntry[fieldName] = true;
        break;
        case 'type':
          currentEntry[fieldName] = content.split(';');
        break;
        case 'rg':
          currentEntry[fieldName] = parseInt(content, 10);
        break;
        default:
          currentEntry[fieldName] = content;
        break;
      }
    });

    results = results.concat(Object.values(pageResults));
  });

  // Process references.
  results = results.map(processReferences);

  // Merge adjacent records.
  results = results.reduce(function(processed, current) {
    if (current.ucs2 === null) {
      processed[processed.length - 1].infoArray.push(current.infoArray[0]);
    } else {
      processed.push(current);
    }

    return processed;
  }, []);

  for (var i = 0; i < results.length; i++) {
    var value = String.fromCodePoint(parseInt(results[i].ucs2, 16));
    results[i].ch = hkscs.convertCharacter(value);

    for (var j = 0; j < results[i].infoArray.length; j++) {
      if (!results[i].infoArray[j].ref) {
        continue;
      }

      for (var k = 0; k < results[i].infoArray[j].ref.length; k++) {
        var value = String.fromCodePoint(parseInt(results[i].infoArray[j].ref[k].ucs2, 16));
        results[i].infoArray[j].ref[k].ch = hkscs.convertCharacter(value);
      }
    }
  }

  return JSON.stringify(results, replacer, 2);
}

module.exports = main;
