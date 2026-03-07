const http = require("http");
const fs = require("fs");
const { Pool } = require("pg");

const pool = new Pool({
  host: "db",
  user: "postgres",
  password: "postgres",
  database: "postgres",
  port: 5432,
});

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => resolve(JSON.parse(body)));
    req.on("error", reject);
  });
}

async function handleRequest(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    return res.end();
  }

  try {
    if (req.method === "GET" && req.url === "/") {
      res.setHeader("Content-Type", "text/html");
      res.end(fs.readFileSync("public/index.html", "utf-8"));
      return;
    }

    if (req.method === "GET" && req.url === "/entries") {
      const result = await pool.query("SELECT * FROM entries ORDER BY created_at DESC");
      res.setHeader("Content-Type", "application/json");
      return res.end(JSON.stringify(result.rows));
    }

    if (req.method === "POST" && req.url === "/entries") {
      const { content } = await parseBody(req);
      const result = await pool.query(
        "INSERT INTO entries (content) VALUES ($1) RETURNING *",
        [content]
      );
      res.setHeader("Content-Type", "application/json");
      res.writeHead(201);
      return res.end(JSON.stringify(result.rows[0]));
    }

    if (req.method === "PUT" && req.url.startsWith("/entries/")) {
      const id = req.url.split("/")[2];
      const { content } = await parseBody(req);
      const result = await pool.query(
        "UPDATE entries SET content = $1 WHERE id = $2 RETURNING *",
        [content, id]
      );
      res.setHeader("Content-Type", "application/json");
      return res.end(JSON.stringify(result.rows[0]));
    }

    if (req.method === "DELETE" && req.url.startsWith("/entries/")) {
      const id = req.url.split("/")[2];
      await pool.query("DELETE FROM entries WHERE id = $1", [id]);
      res.setHeader("Content-Type", "application/json");
      return res.end(JSON.stringify({ deleted: true }));
    }

    res.writeHead(404);
    res.end(JSON.stringify({ error: "Not found" }));
  } catch (err) {
    console.error(err);
    res.writeHead(500);
    res.end(JSON.stringify({ error: err.message }));
  }
}

const server = http.createServer(handleRequest);
server.listen(3000, () => console.log("Server running on port 3000"));
