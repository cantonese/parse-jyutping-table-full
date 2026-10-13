# @cantonese/parse-jyutping-table-full

This script parses `JPTableFull.pdf` into JSON. The PDF is Hong Kong's Cantonese pronunciation list for the characters in ISO/IEC 10646 and HKSCS-2001.

## Requirements

- Node.js 18 or newer
- npm

## Installation

```sh
npm install
```

## Usage

```sh
node .
```

If `JPTableFull.pdf` is not in the project root, the script downloads it from `http://www.iso10646hk.net/download/jp/doc/JPTableFull.pdf`. When that response is not a PDF, it uses the copy at `https://raw.githubusercontent.com/lshk-org/jyutping-table/master/JPTableFull.pdf`.

The script writes:

- `output/JPTableFull.json` — page text and rectangles used by the table scripts
- `output/table1.json` — character readings (pages 13–267)
- `output/table2.json` — component names (from page 268)

When `output/JPTableFull.json` already exists, parsing is skipped and the two tables are generated again.

`node totsv.js` prints a character, code point, and Jyutping as tab-separated text. `node kCantonese.js` compares `output/table1.json` with a local `kCantonese.txt` from the Unicode Unihan database.

## Testing

Generate the JSON first, then check the known 2004-09-07 record counts:

```sh
node .
npm test
```

`npm test` checks that the PDF JSON has 274 pages, `output/table1.json` has 29145 rows beginning with U+3400 `㐀` / `jau1`, and `output/table2.json` has 265 rows beginning with U+34C1.

## License

This program is free software under the [GNU Affero General Public License v3.0 or later](./LICENSE). There is no license fee. If you distribute the program, or provide it over a network, you must release its source code under the same license.

The parser depends on [mupdf](https://www.npmjs.com/package/mupdf) (`AGPL-3.0-or-later`) and [hkscs_unicode_converter](https://www.npmjs.com/package/hkscs_unicode_converter) (`MIT`). `JPTableFull.pdf` is a separate work and is not covered by this license.
