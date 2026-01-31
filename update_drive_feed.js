import fetch from "node-fetch";
import fs from "fs";

const FOLDER_ID = "1_kmLbJhpG8xJaY3Rhf-vNXSYq7L9RFnH";
const API_KEY = process.env.GOOGLE_API_KEY;

function cdata(text = "") {
  return `<![CDATA[${text.replace(/]]>/g, "]]]]><![CDATA[>")}]]>`;
}

function getEmbedUrl(fileId) {
  return `https://drive.google.com/file/d/${fileId}/preview`;
}

function getDirectUrl(fileId) {
  return `https://drive.google.com/file/d/${fileId}/view`;
}

async function listDriveFiles() {
  const url = `https://www.googleapis.com/drive/v3/files?q='${FOLDER_ID}'+in+parents+and+mimeType+contains+'video'&key=${API_KEY}&fields=files(id,name,createdTime,modifiedTime,mimeType,size)&orderBy=createdTime+desc`;

  const res = await fetch(url);
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to fetch Drive files: ${res.status} ${errorText}`);
  }

  const data = await res.json();
  return data.files || [];
}

function extractCaption(filename) {
  // Remove file extension to get caption
  return filename.replace(/\.(mp4|mov|avi|mkv|webm|m4v)$/i, "").trim();
}

function formatDate(isoDate) {
  return new Date(isoDate).toUTCString();
}

async function run() {
  if (!API_KEY) {
    console.error("GOOGLE_API_KEY environment variable is required");
    process.exit(1);
  }

  console.log("Fetching files from Google Drive folder...");
  const files = await listDriveFiles();
  console.log(`Found ${files.length} video files`);

  let out = `<?xml version="1.0" encoding="UTF-8"?>`;
  out += `<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/">`;
  out += `<channel>`;
  out += `<title>WillzTalks - Google Drive Videos</title>`;
  out += `<link>https://drive.google.com/drive/folders/${FOLDER_ID}</link>`;
  out += `<description>Video feed from WillzTalks Google Drive</description>`;
  out += `<language>en-gb</language>`;
  out += `<atom:link href="https://feed.willztalks.com/drive-feed.xml" rel="self" type="application/rss+xml" />`;

  for (const file of files) {
    const caption = extractCaption(file.name);
    const pubDate = formatDate(file.createdTime);
    const embedUrl = getEmbedUrl(file.id);
    const viewUrl = getDirectUrl(file.id);

    out += `<item>`;
    out += `<title>${cdata(caption)}</title>`;
    out += `<link>${viewUrl}</link>`;
    out += `<description>${cdata(`<p>${caption}</p><iframe src="${embedUrl}" width="640" height="360" allow="autoplay" allowfullscreen></iframe>`)}</description>`;
    out += `<pubDate>${pubDate}</pubDate>`;
    out += `<guid isPermaLink="false">${file.id}</guid>`;
    out += `<media:content url="${viewUrl}" type="${file.mimeType}" />`;
    out += `</item>`;
  }

  out += `</channel></rss>`;

  fs.writeFileSync("drive-feed.xml", out);
  console.log(`Wrote drive-feed.xml with ${files.length} items`);
}

await run();
