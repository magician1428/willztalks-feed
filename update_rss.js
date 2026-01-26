import fetch from "node-fetch";
import { parseStringPromise } from "xml2js";
import fs from "fs";

const SOURCE = "https://fetchrss.com/feed/1vBf4gGfS2h01vBf4M7VY2YW.rss";

function cdata(text = "") {
  return `<![CDATA[${text.replace(/]]>/g, "]]]]><![CDATA[>")}]]>`;
}

function sanitizeDescription(html = "") {
  return html
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "");
}

async function run() {
  const res = await fetch(SOURCE);
  const xml = await res.text();
  const parsed = await parseStringPromise(xml);

  const items = parsed.rss.channel[0].item.slice(0, 5);

  let out = `<?xml version="1.0" encoding="UTF-8"?>`;
  out += `<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel>`;
  out += `<title>WillzTalks</title>`;
  out += `<link>https://willztalks.com</link>`;
  out += `<description>Latest posts from WillzTalks</description>`;
  out += `<language>en-gb</language>`;
  out += `<atom:link href="https://willztalks.com/rss.xml" rel="self" type="application/rss+xml" />`;

  for (const i of items) {
    // safe guid
    let guid = i.guid?.[0];
    if (typeof guid === "object" && guid._) guid = guid._;
    else if (typeof guid !== "string") guid = i.link?.[0] ?? "urn:uuid:" + Math.random().toString(36).slice(2);

    out += `<item>`;
    out += `<title>${cdata(i.title?.[0] ?? "")}</title>`;
    out += `<link>${i.link?.[0] ?? ""}</link>`;
    out += `<description>${cdata(sanitizeDescription(i.description?.[0] ?? ""))}</description>`;
    out += `<pubDate>${i.pubDate?.[0] ?? ""}</pubDate>`;
    out += `<guid>${guid}</guid>`;
    out += `</item>`;
  }

  out += `</channel></rss>`;

  fs.writeFileSync("rss.xml", out);
}

await run();
