const fs = require('fs');
const assert = require('assert');

function readJson(name) {
  const file = `output/${name}`;
  if (!fs.existsSync(file)) {
    throw new Error(`Missing ${file}. Run \`node .\` first.`);
  }
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

const pdf = readJson('JPTableFull.json');
const table1 = readJson('table1.json');
const table2 = readJson('table2.json');

assert.strictEqual(pdf.formImage.Pages.length, 274);
assert.strictEqual(table1.length, 29145);
assert.strictEqual(table1[0].ucs2, '3400');
assert.strictEqual(table1[0].ch, '㐀');
assert.strictEqual(table1[0].infoArray[0].jyutping, 'jau1');
assert.strictEqual(table2.length, 265);
assert.strictEqual(table2[0].ucs2, '34C1');
assert.strictEqual(table2[0].part, '㓁');
assert.strictEqual(table2[0].kangxi, true);
assert.strictEqual(table2[0].jyutping, 'tuk1 tau4 jyut6');

console.log('ok');
