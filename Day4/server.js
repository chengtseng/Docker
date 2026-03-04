const http = require("http");
const { Client } = require("pg");

const client = new Client({
  host: "db",
  user: "postgres",
  password: "postgres",
  database: "postgres",
  port: 5432,
});

async function start() {
  await client.connect();

  const server = http.createServer(async (req, res) => {
    const result = await client.query("SELECT NOW()");
    res.end(result.rows[0].now.toString());
  });

  server.listen(3000, () => {
    console.log("Server running");
  });
}

start();