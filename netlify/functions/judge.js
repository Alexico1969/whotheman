async function judgeQuestion(currentPerson, question) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.CLAUDE_KEY,
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
  if (!match) throw new Error("Claude returned an unexpected response.");
  return JSON.parse(match[0]);
}

exports.handler = async function (event) {
  try {
    if (!process.env.CLAUDE_KEY) {
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({ error: { message: "CLAUDE_KEY is not set for this Netlify Function." } })
      };
    }

    const body = event.body ? JSON.parse(event.body) : {};
    const currentPerson = String(body.currentPerson || "").trim();
    const question = String(body.question || "").trim();

    if (!currentPerson || !question) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({ error: { message: "Both currentPerson and question are required." } })
      };
    }

    const result = await judgeQuestion(currentPerson, question);
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(result)
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ error: { message: error.message || "Unexpected function error." } })
    };
  }
};
