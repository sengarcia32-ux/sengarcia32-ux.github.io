// Local preview server: `node dev-server.js`, then open http://localhost:5500
const http = require("http");
const fs = require("fs");
const path = require("path");

const root = __dirname;
const port = process.env.PORT || 5500;
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

http.createServer((req, res) => {
  const urlPath = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  let file = path.join(root, urlPath);
  if (!file.startsWith(root)) {
    res.writeHead(403);
    return res.end();
  }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
    // Match GitHub Pages: /admin → /admin/ so relative links resolve.
    if (!urlPath.endsWith("/")) {
      res.writeHead(301, { Location: urlPath + "/" });
      return res.end();
    }
    file = path.join(file, "index.html");
  }
  fs.readFile(file, (err, data) => {
    if (err) {
      res.writeHead(404);
      return res.end("Not found");
    }
    res.writeHead(200, { "Content-Type": types[path.extname(file)] || "application/octet-stream" });
    res.end(data);
  });
}).listen(port, () => console.log(`Store: http://localhost:${port}/  Admin: http://localhost:${port}/admin/`));
