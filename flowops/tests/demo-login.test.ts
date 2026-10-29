import assert from "node:assert/strict";
import { canUseDemoLogin } from "../lib/auth-cookie";

assert.equal(canUseDemoLogin({ email: "luca@schedio.it", passwordHash: "demo_hash" }), true);
assert.equal(canUseDemoLogin({ email: " Sara@Schedio.IT ", passwordHash: "demo_hash" }), true);

// Utente reale registrato: hash bcrypt, mai accessibile con la password demo
assert.equal(
  canUseDemoLogin({ email: "mario@example.com", passwordHash: "$2a$12$abcdefghijklmnopqrstuv" }),
  false
);
// Utente Google senza password
assert.equal(canUseDemoLogin({ email: "mario@example.com", passwordHash: null }), false);
// Email demo ma hash reale (es. account registrato davvero con quell'email)
assert.equal(canUseDemoLogin({ email: "luca@schedio.it", passwordHash: "$2a$12$abc" }), false);
// Utenti creati automaticamente da WhatsApp con hash demo ma fuori allowlist
assert.equal(canUseDemoLogin({ email: "handyman-1712345678@schedio.it", passwordHash: "demo_hash" }), false);

process.env.DISABLE_DEMO_LOGIN = "true";
assert.equal(canUseDemoLogin({ email: "luca@schedio.it", passwordHash: "demo_hash" }), false);
delete process.env.DISABLE_DEMO_LOGIN;

console.log("demo login tests passed");
