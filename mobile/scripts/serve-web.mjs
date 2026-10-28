import http from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { resolve, extname } from "node:path";
const root = resolve("dist");
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".ttf": "font/ttf",
  ".woff": "font/woff",
  ".svg": "image/svg+xml",
};
http
  .createServer((req, res) => {
    const path = resolve(
      root,
      "." + decodeURIComponent((req.url ?? "/").split("?")[0]),
    );
    if (path !== root && !path.startsWith(root + "/")) {
      res.writeHead(403);
      return res.end();
    }
    const file =
      existsSync(path) && statSync(path).isFile()
        ? path
        : resolve(root, "index.html");
    if (!existsSync(file)) {
      res.writeHead(404);
      return res.end("Run npm run export:web first");
    }
    res.writeHead(200, {
      "Content-Type": types[extname(file)] ?? "application/octet-stream",
    });
    createReadStream(file).pipe(res);
  })
  .listen(8081, "0.0.0.0", () =>
    console.log("Web preview listening on port 8081"),
  );
