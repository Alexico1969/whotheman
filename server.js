const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = Number(process.env.PORT || 3000);
const HOST = "127.0.0.1";
const INDEX_PATH = path.join(__dirname, "index.html");
const CLAUDE_KEY = process.env.CLAUDE_KEY || "";

function sendJson(res, status, payload) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function sendHtml(res) {
  fs.readFile(INDEX_PATH, "utf8", (error, data) => {
    if (error) {
      sendJson(res, 500, { error: { message: "Could not read index.html." } });
      return;
    }
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(data);
  });
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error("Request body too large."));
      }
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

async function judgeQuestion(currentPerson, question) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": CLAUDE_KEY,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: "claude-3-5-sonnet-latest",
      max_tokens: 180,
      messages: [
        {
          role: "user",
          content:
            "You are judging a yes-or-no guessing game. " +
            "Secret person: " + currentPerson + ". " +
            "Player question: " + question + ". " +
            "Return only JSON exactly like " +
            "{\"feedback\":\"yes|no|that is not a yes or no question\",\"guessedCorrectly\":true|false}. " +
            "Rules: " +
            "If the player guessed the secret person correctly, feedback must be yes and guessedCorrectly true. " +
            "If the player guessed a different person, feedback must be no. " +
            "If it is a valid yes-or-no attribute question, answer yes or no correctly. " +
            "If it is open-ended or non-yes-no, return that is not a yes or no question."
        }
      ]
    })
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error?.message || ("Claude error " + response.status));
  }

  const payload = await response.json();
  const text = payload.content?.[0]?.text || "";
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new Error("Claude returned an unexpected response.");
  }
  return JSON.parse(match[0]);
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (req.method === "GET" && url.pathname === "/") {
      sendHtml(res);
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/config") {
      sendJson(res, 200, { hasClaudeKey: Boolean(CLAUDE_KEY) });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/judge") {
      if (!CLAUDE_KEY) {
        sendJson(res, 500, { error: { message: "CLAUDE_KEY is not set in the server environment." } });
        return;
      }

      const raw = await readBody(req);
      const body = raw ? JSON.parse(raw) : {};
      const currentPerson = String(body.currentPerson || "").trim();
      const question = String(body.question || "").trim();

      if (!currentPerson || !question) {
        sendJson(res, 400, { error: { message: "Both currentPerson and question are required." } });
        return;
      }

      const result = await judgeQuestion(currentPerson, question);
      sendJson(res, 200, result);
      return;
    }

    sendJson(res, 404, { error: { message: "Not found." } });
  } catch (error) {
    sendJson(res, 500, { error: { message: error.message || "Unexpected server error." } });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Who The Man server running at http://${HOST}:${PORT}`);
  console.log(CLAUDE_KEY ? "CLAUDE_KEY detected." : "CLAUDE_KEY is missing.");
});
