// pdf2json 1.x draws at scale 1.5, then converts viewport pixels to form
// units by dividing by 24. 1.5 / 24 = 1/16, so form units are PDF points / 16.
// Text x/y also subtract the offsets applied in pdf2json's pdffont.js.
const FORM_PER_POINT = 1.5 / 24;

function toForm(point) {
  return parseFloat((point * FORM_PER_POINT).toFixed(3));
}

function textRun(text, origin) {
  return {
    x: toForm(origin.x) - 0.25,
    y: toForm(origin.y) - 0.75,
    R: [{ T: encodeURIComponent(text) }]
  };
}

function parsePage(page) {
  const bounds = page.getBounds();
  const structured = page.toStructuredText("preserve-spans,vectors");
  const Fills = [];
  const Texts = [];
  let chars = [];

  structured.walk({
    beginLine() {
      chars = [];
    },
    onChar(c, origin) {
      chars.push({ c, x: origin[0], y: origin[1] });
    },
    endLine() {
      const text = chars.map((ch) => ch.c).join("").trim();
      if (!text) {
        return;
      }

      // MuPDF joins adjacent codes such as "9418 937E" into one line.
      // pdf2json emitted each code as its own text run, which table1 pairs by x.
      if (/^[A-F0-9]{4}(?:\s+[A-F0-9]{4})+$/i.test(text)) {
        let part = "";
        let origin = null;
        const flush = () => {
          if (!part) {
            return;
          }
          Texts.push(textRun(part, origin));
          part = "";
          origin = null;
        };
        for (const ch of chars) {
          if (!ch.c.trim()) {
            flush();
            continue;
          }
          if (!origin) {
            origin = ch;
          }
          part += ch.c;
        }
        flush();
        return;
      }

      const origin = chars.find((ch) => ch.c.trim()) || chars[0];
      Texts.push(textRun(text, origin));
    },
    onVector(bbox, flags) {
      if (!flags.isRectangle || flags.isStroked) {
        return;
      }
      const width = toForm(bbox[2] - bbox[0]);
      const height = toForm(bbox[3] - bbox[1]);
      if (width < 2 && height < 2) {
        return;
      }
      Fills.push({
        x: toForm(bbox[0]),
        y: toForm(bbox[1]),
        w: width,
        h: height
      });
    }
  });

  return {
    Width: toForm(bounds[2] - bounds[0]),
    Height: toForm(bounds[3] - bounds[1]),
    HLines: [],
    VLines: [],
    Fills,
    Texts
  };
}

async function parsePdf(buffer) {
  const mupdf = await import("mupdf");
  const doc = mupdf.Document.openDocument(buffer, "application/pdf");
  const Pages = [];
  const pageCount = doc.countPages();

  for (let i = 0; i < pageCount; i++) {
    Pages.push(parsePage(doc.loadPage(i)));
  }

  return { formImage: { Pages } };
}

module.exports = parsePdf;
