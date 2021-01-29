const fs = require('fs');
const table1 = require('./table1');
const table2 = require('./table2');

function cachedLoad() {
  if (fs.existsSync('./JPTableFull.json')) {
    var pdfData = JSON.parse(fs.readFileSync('./JPTableFull.json'));

    console.log('Generating table1.json');
    var table1String = table1(pdfData.formImage.Pages);
    fs.writeFileSync('table1.json', table1String);

    console.log('Generating table2.json');
    var table2String = table2(pdfData.formImage.Pages);
    fs.writeFileSync('table2.json', table2String);

    console.log('COMPLETE! Extracted data in table1.json & table2.json');
  } else if (fs.existsSync('./JPTableFull.pdf')) {
    console.log('Parsing JPTableFull.pdf');

    const PDFParser = require('pdf2json');
    var pdfParser = new PDFParser();

    pdfParser.on('pdfParser_dataReady', pdfData => {
      fs.writeFileSync('./JPTableFull.json', JSON.stringify(pdfData));
      cachedLoad();
    });

    pdfParser.loadPDF('./JPTableFull.pdf');
  } else {
    const https = require('https');

    console.log('Downloading JPTableFull.pdf');
    var file = fs.createWriteStream('./JPTableFull.pdf');
    var request = https.get('https://www.iso10646hk.net/download/jp/doc/JPTableFull.pdf', { rejectUnauthorized: false }, function(response) {
      response.pipe(file);
      file.on('finish', function() {
        file.close(cachedLoad);
      });
    });

    request.on('error', function(error) {
      fs.unlinkSync('./JPTableFull.pdf');
      throw error;
    });
  }
}

cachedLoad();
