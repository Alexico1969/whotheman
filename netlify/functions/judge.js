async function fetchWikipediaProfile(name) {
  const response = await fetch(
    "https://en.wikipedia.org/w/api.php?origin=*&action=query&prop=extracts|categories&redirects=1&cllimit=max&titles=" +
      encodeURIComponent(name) +
      "&format=json&exintro=1&explaintext=1"
  );

  if (!response.ok) {
    throw new Error("Wikipedia lookup failed.");
  }

  const payload = await response.json();
  const pages = Object.values(payload.query?.pages || {});
  const page = pages.find((item) => !item.missing);
  if (!page) {
    throw new Error("Wikipedia could not find a page for this person.");
  }

  return {
    title: page.title || name,
    extract: String(page.extract || "").trim(),
    categories: (page.categories || []).map((item) => String(item.title || "").replace(/^Category:/i, "").trim())
  };
}

async function judgeQuestion(currentPerson, question, profile) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.CLAUDE_KEY,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 180,
      messages: [
        {
          role: "user",
          content:
            "You are judging a yes-or-no guessing game using supplied evidence. " +
            "Secret person: " + currentPerson + ". " +
            "Wikipedia page title: " + profile.title + ". " +
            "Wikipedia summary: " + JSON.stringify(profile.extract) + ". " +
            "Wikipedia categories: " + JSON.stringify(profile.categories) + ". " +
            "Player question: " + question + ". " +
            "Return only JSON exactly like " +
            "{\"feedback\":\"yes|no|that is not a yes or no question\",\"guessedCorrectly\":true|false}. " +
            "Rules: " +
            "If the player guessed the secret person correctly, feedback must be yes and guessedCorrectly true. " +
            "If the player guessed a different person, feedback must be no. " +
            "If it is a valid yes-or-no attribute question, answer yes or no using the supplied Wikipedia evidence first. " +
            "Use the summary and categories as your factual grounding. " +
            "If the supplied evidence is insufficient, make the best supported judgment from the evidence instead of inventing extra facts. " +
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

    const profile = await fetchWikipediaProfile(currentPerson);
    const result = await judgeQuestion(currentPerson, question, profile);
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
