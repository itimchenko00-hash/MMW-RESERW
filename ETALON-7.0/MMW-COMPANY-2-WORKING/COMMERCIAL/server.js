const http = require("http");

const PORT = Number(process.env.PORT || 3000);

const catalog = {
  version: 1,
  status: "draft",
  items: [],
  currency: "UAH"
};

function json(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  res.end(body);
}

function html(res, status, body) {
  res.writeHead(status, {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store"
  });
  res.end(body);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");

  if (url.pathname === "/healthz") {
    return json(res, 200, {
      ok: true,
      service: "mmw-company-commercial",
      stage: "infrastructure-shell"
    });
  }

  if (url.pathname === "/api/catalog" && req.method === "GET") {
    return json(res, 200, catalog);
  }

  if (url.pathname === "/") {
    return html(res, 200, `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>MMW-COMPANY — коммерческий контур</title>
<style>
body{font-family:Arial,sans-serif;margin:0;background:#f5faf7;color:#17352b}
main{max-width:760px;margin:10vh auto;padding:32px}
.card{background:#fff;border:1px solid #dcebe4;border-radius:20px;padding:32px;box-shadow:0 12px 40px rgba(23,53,43,.08)}
h1{margin-top:0}
p{line-height:1.6;color:#4d665d}
</style>
</head>
<body><main><section class="card">
<h1>MMW-COMPANY</h1>
<p>Коммерческий контур подготовлен как отдельный слой компании.</p>
<p>Каталог, конфигуратор, экономика, заказ, подтверждение и журнал будут подключаться поэтапно.</p>
</section></main></body>
</html>`);
  }

  return json(res, 404, { ok: false, error: "not_found" });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`MMW commercial contour listening on :${PORT}`);
});
