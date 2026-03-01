function readBody(request) {
  return new Promise((resolve, reject) => {
    let data = "";
    request.on("data", (chunk) => {
      data += chunk;
      if (data.length > 2_000_000) {
        reject(new Error("Request body too large"));
      }
    });
    request.on("end", () => resolve(data));
    request.on("error", reject);
  });
}

function json(response, status, body) {
  const payload = JSON.stringify(body);
  response.writeHead(status, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(payload),
  });
  response.end(payload);
}

function notFound(response) {
  json(response, 404, { success: false, message: "Not found" });
}

function unauthorized(response) {
  json(response, 401, { success: false, message: "Unauthorized" });
}

function badRequest(response, message) {
  json(response, 400, { success: false, message: message || "Bad request" });
}

module.exports = { readBody, json, notFound, unauthorized, badRequest };
