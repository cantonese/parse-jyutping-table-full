const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const table1 = require('./table1');
const table2 = require('./table2');
const parsePdf = require('./pdfjson');

const outputDir = path.join(__dirname, 'output');

function outputPath(name) {
  return path.join(outputDir, name);
}

const PDF_SOURCES = [
  'http://www.iso10646hk.net/download/jp/doc/JPTableFull.pdf',
  'https://raw.githubusercontent.com/lshk-org/jyutping-table/master/JPTableFull.pdf'
];

function generateTables() {
  var pdfData = JSON.parse(fs.readFileSync(outputPath('JPTableFull.json')));

  console.log('Generating output/table1.json');
  var table1String = table1(pdfData.formImage.Pages);
  fs.writeFileSync(outputPath('table1.json'), table1String);

  console.log('Generating output/table2.json');
  var table2String = table2(pdfData.formImage.Pages);
  fs.writeFileSync(outputPath('table2.json'), table2String);

  console.log('COMPLETE! Extracted data in output/table1.json & output/table2.json');
}

function isPdf(buffer) {
  return buffer.slice(0, 5).toString() === '%PDF-';
}

function download(url) {
  const client = new URL(url).protocol === 'http:' ? http : https;

  return new Promise((resolve, reject) => {
    const request = client.get(url, { rejectUnauthorized: false }, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        response.resume();
        download(response.headers.location).then(resolve, reject);
        return;
      }

      if (response.statusCode !== 200) {
        response.resume();
        reject(new Error('Download failed: ' + response.statusCode + ' ' + url));
        return;
      }

      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
    });

    request.on('error', reject);
  });
}

async function cachedLoad() {
  fs.mkdirSync(outputDir, { recursive: true });

  if (fs.existsSync(outputPath('JPTableFull.json'))) {
    generateTables();
    return;
  }

  if (!fs.existsSync('./JPTableFull.pdf')) {
    console.log('Downloading JPTableFull.pdf');
    let buffer = null;
    let lastError = null;

    for (const url of PDF_SOURCES) {
      try {
        buffer = await download(url);
        if (isPdf(buffer)) {
          break;
        }
        lastError = new Error('Download was not a PDF: ' + url);
        buffer = null;
      } catch (error) {
        lastError = error;
      }
    }

    if (!buffer) {
      throw lastError;
    }

    fs.writeFileSync('./JPTableFull.pdf', buffer);
  }

  console.log('Parsing JPTableFull.pdf');
  const buffer = fs.readFileSync('./JPTableFull.pdf');
  if (!isPdf(buffer)) {
    throw new Error('JPTableFull.pdf is not a PDF');
  }

  const pdfData = await parsePdf(buffer);
  fs.writeFileSync(outputPath('JPTableFull.json'), JSON.stringify(pdfData));
  generateTables();
}

cachedLoad().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
