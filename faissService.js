const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { IndexFlatIP, IndexFlatL2, Index } = require('faiss-node');
const axios = require('axios');

const DATA_DIR = path.join(__dirname, 'data');
const SCRAPED_TXT_PATH = path.join(DATA_DIR, 'scraped.txt');
const FAISS_INDEX_PATH = path.join(DATA_DIR, 'faiss.index');
const FAISS_META_PATH = path.join(DATA_DIR, 'faiss_meta.json');
const SCRAPED_JSON_PATH = path.join(DATA_DIR, 'scraped.json');

function requireGoogleKey() {
  const key = process.env.GOOGLE_API_KEY;
  if (!key) {
    throw new Error('Missing GOOGLE_API_KEY in environment. Set it in your .env file.');
  }
  return key;
}

function getGenAI() {
  const apiKey = requireGoogleKey();
  return new GoogleGenerativeAI(apiKey);
}

async function embedOne(text) {
  const key = requireGoogleKey();
  const base = 'https://generativelanguage.googleapis.com';
  const payload = { content: { parts: [{ text }] } };
  // Try textembedding-005 first
  try {
    console.log('[FAISS] Embedding with textembedding-005');
    const url = `${base}/v1/models/textembedding-005:embedContent?key=${key}`;
    const resp = await axios.post(url, payload);
    const values = resp?.data?.embedding?.values || [];
    if (!values.length) throw new Error('Empty embedding from 005');
    return values;
  } catch (err) {
    console.warn('[FAISS] 005 failed, falling back to text-embedding-004');
    const url2 = `${base}/v1/models/text-embedding-004:embedContent?key=${key}`;
    const resp2 = await axios.post(url2, payload);
    const values2 = resp2?.data?.embedding?.values || [];
    if (!values2.length) throw new Error('Empty embedding from 004');
    return values2;
  }
}

function chunkText(raw) {
  const parts = raw
    .split(/\n\s*\n/g)
    .map(s => s.trim())
    .filter(s => s.length > 0);
  const chunks = [];
  let buffer = '';
  for (const p of parts) {
    if ((buffer + '\n\n' + p).length > 1000 && buffer.length > 0) {
      chunks.push(buffer.trim());
      buffer = p;
    } else {
      buffer = buffer ? buffer + '\n\n' + p : p;
    }
  }
  if (buffer.trim().length > 0) chunks.push(buffer.trim());
  return chunks;
}

function normalize(vec) {
  let sumSq = 0;
  for (const v of vec) sumSq += v * v;
  const norm = Math.sqrt(sumSq) || 1;
  return vec.map(v => v / norm);
}

async function embedTexts(texts) {
  const embeddings = [];
  for (const t of texts) {
    const values = await embedOne(t);
    embeddings.push(normalize(values));
  }
  return embeddings;
}

function writeMeta(meta) {
  fs.writeFileSync(FAISS_META_PATH, JSON.stringify(meta, null, 2), 'utf8');
}

function readMeta() {
  if (!fs.existsSync(FAISS_META_PATH)) return null;
  return JSON.parse(fs.readFileSync(FAISS_META_PATH, 'utf8'));
}

function writeIndex(index) {
  index.write(FAISS_INDEX_PATH);
}

function readIndex() {
  if (!fs.existsSync(FAISS_INDEX_PATH)) return null;
  try {
    return IndexFlatIP.read(FAISS_INDEX_PATH);
  } catch (e) {
    try { return IndexFlatL2.read(FAISS_INDEX_PATH); } catch (e2) { return null; }
  }
}

let _index = null;
let _meta = null;
let _dim = null;

async function buildFaissFromFile(filePath = SCRAPED_TXT_PATH) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Scraped file not found at ${filePath}`);
  }
  const raw = fs.readFileSync(filePath, 'utf8');
  const chunks = chunkText(raw);
  if (chunks.length === 0) {
    throw new Error('No content chunks to index');
  }
  const embeddings = await embedTexts(chunks);
  const dim = embeddings[0].length;
  const index = new IndexFlatIP(dim);
  embeddings.forEach((vec) => index.add(vec));
  writeIndex(index);
  const meta = {
    dim,
    count: embeddings.length,
    texts: chunks,
  };
  writeMeta(meta);
  _index = index;
  _meta = meta;
  _dim = dim;
  return { dim, count: embeddings.length };
}

function ensureLoaded() {
  if (_index && _meta && _dim) return true;
  const meta = readMeta();
  const index = readIndex();
  if (!meta || !index) return false;
  _meta = meta;
  _index = index;
  _dim = meta.dim;
  return true;
}

function extractLinkFromText(text) {
  const m = text.match(/\(link:\s*([^\)]+)\)/i);
  if (!m) return null;
  let href = m[1].trim();
  // Normalize relative anchors to full URL pointing to main site
  if (href.startsWith('#')) {
    href = `http://localhost:8888/${href}`;
  } else if (href.startsWith('/')) {
    href = `http://localhost:8888${href}`;
  }
  return href;
}

function loadScrapedJson() {
  if (!fs.existsSync(SCRAPED_JSON_PATH)) return [];
  try {
    const raw = fs.readFileSync(SCRAPED_JSON_PATH, 'utf8');
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch (e) {
    return [];
  }
}

function bestSourceForChunk(chunkText, scrapedDocs) {
  let best = null;
  for (const doc of scrapedDocs) {
    const t = (doc.text || '').trim();
    if (!t || t.length < 20) continue;
    // If scraped text is contained within chunk, prefer it
    if (chunkText.includes(t.slice(0, Math.min(60, t.length)))) {
      const link = extractLinkFromText(t);
      best = { title: doc.source || 'Section', link };
      break;
    }
    // Or if chunk is contained within scraped doc (rare), also accept
    if (t.includes(chunkText.slice(0, Math.min(60, chunkText.length)))) {
      const link = extractLinkFromText(t);
      best = { title: doc.source || 'Section', link };
      break;
    }
  }
  return best;
}

async function enrichCitations(hits) {
  const scraped = loadScrapedJson();
  return hits.map(h => {
    const meta = bestSourceForChunk(h.text, scraped) || {};
    return { index: h.index, score: h.score, text: h.text, title: meta.title, link: meta.link };
  });
}

async function searchFaiss(query, k = 4) {
  const ready = ensureLoaded();
  if (!ready) throw new Error('FAISS index not loaded. Build it first.');
  const values = await embedOne(query);
  const qvec = normalize(values);
  if (!qvec.length) throw new Error('Empty query embedding');
  const results = _index.search(qvec, k);
  const { labels, distances } = results;
  const out = [];
  for (let i = 0; i < labels.length; i++) {
    const idx = labels[i];
    if (idx === -1) continue;
    const text = _meta.texts[idx] || '';
    const score = distances[i];
    out.push({ index: idx, score, text });
  }
  return out;
}

async function answerWithGemini(query, k = 4) {
  const hits = await searchFaiss(query, k);
  const context = hits.map((h, i) => `[#${i+1} score=${h.score.toFixed(3)}]\n${h.text}`).join('\n\n');
  const prompt = [
    'You are a helpful assistant answering questions using the provided context.',
    'Use only the context to answer. If missing, say you do not know.',
    'Cite sources using bracketed numbers [#1], [#2] matching context chunks.',
    '',
    `Question: ${query}`,
    '',
    'Context:',
    context,
  ].join('\n');

  const genAI = getGenAI();
  let model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
  try {
    const resp = await model.generateContent(prompt);
    const text = resp?.response?.text?.() || resp?.response?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const citations = await enrichCitations(hits);
    return { answer: text, citations };
  } catch (err) {
    model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const resp2 = await model.generateContent(prompt);
    const text2 = resp2?.response?.text?.() || resp2?.response?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const citations2 = await enrichCitations(hits);
    return { answer: text2, citations: citations2 };
  }
}

module.exports = {
  buildFaissFromFile,
  searchFaiss,
  answerWithGemini,
  enrichCitations,
  paths: {
    SCRAPED_TXT_PATH,
    FAISS_INDEX_PATH,
    FAISS_META_PATH,
    SCRAPED_JSON_PATH,
  },
};