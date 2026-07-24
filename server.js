require("dotenv").config({ path: __dirname + "/.env" });

const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const fs = require("fs");
const path = require("path");
const os = require("os");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3000;

// Root project directory to browse — defaults to current working directory
const PROJECT_DIR = process.env.PROJECT_DIR
  ? path.resolve(process.env.PROJECT_DIR)
  : process.cwd();

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(express.json({ limit: "2mb" }));
app.use(express.static(path.join(__dirname, "public")));

// ─── Helper: get local IP ──────────────────────────────────────────────────────
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return "localhost";
}

// ─── Helper: safe path resolution ─────────────────────────────────────────────
function safePath(relPath) {
  const resolved = path.resolve(PROJECT_DIR, relPath || "");
  if (!resolved.startsWith(PROJECT_DIR)) {
    throw new Error("Path traversal attempt blocked");
  }
  return resolved;
}

// ─── REST API: List files ──────────────────────────────────────────────────────
app.get("/api/files", (req, res) => {
  const dir = req.query.dir ? safePath(req.query.dir) : PROJECT_DIR;
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const files = entries
      .filter((e) => !e.name.startsWith(".") && e.name !== "node_modules")
      .map((e) => ({
        name: e.name,
        isDir: e.isDirectory(),
        path: path.relative(PROJECT_DIR, path.join(dir, e.name)),
      }))
      .sort((a, b) => {
        if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
    res.json({ files, cwd: path.relative(PROJECT_DIR, dir) || "." });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─── REST API: Read file ───────────────────────────────────────────────────────
app.get("/api/file", (req, res) => {
  try {
    const filePath = safePath(req.query.path);
    const content = fs.readFileSync(filePath, "utf8");
    res.json({ content, path: req.query.path });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─── REST API: Write file ──────────────────────────────────────────────────────
app.post("/api/file/write", (req, res) => {
  try {
    const { path: relPath, content } = req.body;
    if (!relPath || content === undefined) {
      return res.status(400).json({ error: "path and content are required" });
    }
    const filePath = safePath(relPath);
    fs.writeFileSync(filePath, content, "utf8");
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─── REST API: Chat with Groq ──────────────────────────────────────────────────
app.post("/api/chat", async (req, res) => {
  try {
    const { message, fileContent, filePath } = req.body;
    if (!message) return res.status(400).json({ error: "message is required" });

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: "GROQ_API_KEY not set. Add it to your .env file.",
      });
    }

    const Groq = require("groq-sdk");
    const groq = new Groq({ apiKey });

    const systemPrompt = fileContent
      ? `You are a helpful coding assistant. The user is working on a file called "${filePath || "file"}".\n\nCurrent file content:\n\`\`\`\n${fileContent}\n\`\`\`\n\nWhen suggesting code changes, always wrap your code in fenced code blocks with the language specified (e.g. \`\`\`html). Keep explanations short and practical.`
      : "You are a helpful coding assistant. Keep explanations short and practical. Wrap code in fenced code blocks.";

    const completion = await groq.chat.completions.create({
      model: "llama3-8b-8192",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      max_tokens: 2048,
    });

    const reply = completion.choices[0]?.message?.content || "No response.";
    res.json({ reply });
  } catch (err) {
    console.error("Groq error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── WebSocket: File watcher ───────────────────────────────────────────────────
const watchers = new Map(); // filePath -> fs.FSWatcher

wss.on("connection", (ws) => {
  console.log("📱 Phone connected");

  ws.on("message", (data) => {
    try {
      const msg = JSON.parse(data.toString());

      if (msg.type === "watch") {
        // Stop previous watcher for this client
        if (ws._watchedPath && watchers.has(ws._watchedPath)) {
          const prev = watchers.get(ws._watchedPath);
          prev.close();
          watchers.delete(ws._watchedPath);
        }

        const filePath = safePath(msg.path);
        ws._watchedPath = filePath;

        let debounce = null;
        const watcher = fs.watch(filePath, () => {
          clearTimeout(debounce);
          debounce = setTimeout(() => {
            try {
              const content = fs.readFileSync(filePath, "utf8");
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(
                  JSON.stringify({ type: "fileUpdate", path: msg.path, content })
                );
              }
            } catch (_) {}
          }, 200);
        });

        watchers.set(filePath, watcher);
        ws.send(JSON.stringify({ type: "watchAck", path: msg.path }));
      }
    } catch (_) {}
  });

  ws.on("close", () => {
    console.log("📱 Phone disconnected");
    if (ws._watchedPath && watchers.has(ws._watchedPath)) {
      watchers.get(ws._watchedPath).close();
      watchers.delete(ws._watchedPath);
    }
  });
});

// ─── Start server ──────────────────────────────────────────────────────────────
server.listen(PORT, "0.0.0.0", () => {
  const ip = getLocalIP();
  const url = `http://${ip}:${PORT}`;

  console.log("\n╔════════════════════════════════════════╗");
  console.log("║        GhostMove is running!           ║");
  console.log("╠════════════════════════════════════════╣");
  console.log(`║  Local:   http://localhost:${PORT}         ║`);
  console.log(`║  Phone:   ${url.padEnd(30)}║`);
  console.log("╠════════════════════════════════════════╣");
  console.log(`║  Project: ${PROJECT_DIR.slice(0, 30).padEnd(30)}║`);
  console.log("╚════════════════════════════════════════╝\n");

  // QR code for phone
  try {
    const qr = require("qrcode-terminal");
    console.log("Scan to open on your phone:");
    qr.generate(url, { small: true });
  } catch (_) {}
});
