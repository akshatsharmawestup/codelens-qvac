import http from "node:http";
import { readFile } from "node:fs/promises";
import { join, normalize, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { loadModel, LLAMA_3_2_1B_INST_Q4_0, completion } from "@qvac/sdk";

const root = fileURLToPath(new URL(".", import.meta.url));
const publicDir = join(root, "public");
const PORT = process.env.PORT || 3000;
let modelPromise;

async function getModel() {
  if (!modelPromise) {
    console.log("Loading QVAC model...");
    modelPromise = loadModel({
      modelSrc: LLAMA_3_2_1B_INST_Q4_0,
      onProgress: p => {
        if (typeof p?.percentage === "number")
          process.stdout.write(`\rQVAC model: ${p.percentage.toFixed(0)}%`);
        if (p?.percentage >= 100) process.stdout.write("\n");
      }
    });
  }
  return modelPromise;
}

function prompt(language, code) {
  return `You are CodeLens, a beginner-friendly programming tutor.
Analyze this ${language} code and return ONLY valid JSON with exactly these fields:
overview, steps, complexity, improvements.
overview = simple explanation of the whole program.
steps = numbered step-by-step explanation as plain text.
complexity = time and space complexity with a short reason.
improvements = 2 or 3 practical improvements or learning tips.
Do not use markdown code fences.

CODE:
${code}`;
}

function parse(raw) {
  const cleaned = raw.trim().replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  try {
    const x = JSON.parse(cleaned);
    return {
      overview: String(x.overview || ""),
      steps: String(x.steps || ""),
      complexity: String(x.complexity || ""),
      improvements: String(x.improvements || "")
    };
  } catch {
    return {
      overview: raw.trim(),
      steps: "The model returned an unstructured explanation.",
      complexity: "Not detected automatically.",
      improvements: "Try again with a shorter code snippet."
    };
  }
}

async function explain(language, code) {
  const modelId = await getModel();
  const result = completion({
    modelId,
    history: [{ role: "user", content: prompt(language, code) }],
    stream: true
  });
  let text = "";
  for await (const token of result.tokenStream) text += token;
  return parse(text);
}

function json(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body)
  });
  res.end(body);
}

async function staticFile(req, res) {
  let pathname = decodeURIComponent(new URL(req.url, `http://${req.headers.host}`).pathname);
  if (pathname === "/") pathname = "/index.html";
  const file = normalize(join(publicDir, pathname));
  if (!file.startsWith(publicDir)) return res.end("Forbidden");
  try {
    const data = await readFile(file);
    const types = {".html":"text/html; charset=utf-8",".css":"text/css; charset=utf-8",".js":"text/javascript; charset=utf-8"};
    res.writeHead(200, {"Content-Type": types[extname(file)] || "application/octet-stream"});
    res.end(data);
  } catch { res.writeHead(404); res.end("Not found"); }
}

http.createServer(async (req, res) => {
  try {
    if (req.method === "GET") return staticFile(req, res);
    if (req.method === "POST" && req.url === "/api/explain") {
      let body = "";
      for await (const chunk of req) body += chunk;
      const { language = "code", code = "" } = JSON.parse(body);
      if (!String(code).trim()) return json(res, 400, {error:"Please paste some code first."});
      if (String(code).length > 30000) return json(res, 400, {error:"Keep code under 30,000 characters."});
      console.log(`Explaining ${language} code locally with QVAC...`);
      return json(res, 200, await explain(String(language), String(code)));
    }
    res.writeHead(404); res.end("Not found");
  } catch (e) {
    console.error(e);
    json(res, 500, {error:e?.message || "Local inference failed."});
  }
}).listen(PORT, () => console.log(`\nCodeLens: http://localhost:${PORT}\nQVAC inference runs locally.`));
