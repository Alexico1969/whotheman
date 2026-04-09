exports.handler = async function (event) {
  try {
    if (event.httpMethod && event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({ error: { message: "Method not allowed." } })
      };
    }

    const configuredPin = String(process.env.PIN || "").trim();
    if (!configuredPin) {
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({ unlocked: true, pinRequired: false })
      };
    }

    const body = event.body ? JSON.parse(event.body) : {};
    const suppliedPin = String(body.pin || "").trim();

    if (!/^\d{4}$/.test(suppliedPin)) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({ error: { message: "Enter a 4-digit PIN." } })
      };
    }

    return {
      statusCode: suppliedPin === configuredPin ? 200 : 401,
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        unlocked: suppliedPin === configuredPin,
        pinRequired: true
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ error: { message: error.message || "Unexpected function error." } })
    };
  }
};
