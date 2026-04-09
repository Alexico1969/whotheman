exports.handler = async function () {
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      hasClaudeKey: Boolean(process.env.CLAUDE_KEY),
      hasPin: Boolean(String(process.env.PIN || "").trim())
    })
  };
};
