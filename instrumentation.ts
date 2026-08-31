export function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Fix: Node's c-ares DNS resolver sometimes picks up 127.0.0.1 from a
    // disconnected VPN adapter. Nothing listens on loopback port 53, so every
    // DNS lookup returns ECONNREFUSED — which breaks the MongoDB +srv connection.
    // Setting known-good DNS servers here (before any DB connect) fixes it globally.
    const dns = require("dns");
    try {
      dns.setServers(["8.8.8.8", "1.1.1.1"]);
    } catch (_) {}
  }
}
