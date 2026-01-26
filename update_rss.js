import fetch from "node-fetch";
import { parseStringPromise } from "xml2js";
import fs from "fs";

const SOURCE =
  "https://fetchrss.com/feed/1vBf4gGfS2h01vBf4M7VY2YW.rss";

function cdata(text = "") {
  // Prevent accidental CDATA termination
  return `<![CDATA[${text.replace(/]]>/g, "]]]]><![CDATA[>")}]]>`;
}

async function run() {
  const res = await fetch(SOURCE);
  const xml = await res.text();
  const parsed = await parseStringPromise(xml);

  const items = parsed.rss.channel[0].item.slice(0, 5);

  let out = `<?xml version="1.0" encoding="UTF-8"?>`;
  out += `<rss version="2.0"><channel>`;
  out += `<title>WillzTalks</title>`;
  out += `<link>https://willztalks.com</link>`;
  out += `<description>Latest posts from WillzTalks</description>`;

  for (const i of items) {
    out += `<item>`;
    out += `<title>${cdata(i.title?.[0] ?? "")}</title>`;
    out += `<link>${i.link?.[0] ?? ""}</link>`;
    out += `<description>${cdata(i.description?.[0] ?? "")}</description>`;
    out += `<pubDate>${i.pubDate?.[0] ?? ""}</pubDate>`;
    out += `<guid>${i.guid?.[0] ?? i.link?.[0] ?? ""}</guid>`;
    out += `</item>`;
  }

  out += `</channel></rss>`;

  fs.writeFileSync("rss.xml", out);
}

await run();

