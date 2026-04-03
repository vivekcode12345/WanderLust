const test = require("node:test");
const assert = require("node:assert/strict");

process.env.SKIP_DB = "true";
process.env.SECRET = process.env.SECRET || "test-secret";

const app = require("../app");

test("GET /health returns service status", async () => {
    const server = app.listen(0);

    try {
        const { port } = server.address();
        const response = await fetch(`http://127.0.0.1:${port}/health`);
        const body = await response.json();

        assert.equal(response.status, 200);
        assert.equal(body.status, "ok");
        assert.equal(typeof body.uptimeSeconds, "number");
        assert.equal(typeof body.aiConfigured, "boolean");
        assert.equal(typeof body.db, "object");
    } finally {
        await new Promise((resolve) => server.close(resolve));
    }
});
