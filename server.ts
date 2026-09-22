import "dotenv/config";
import express from "express";
import path from "path";
import { handleChat, handleInsight, healthPayload, clientIpFrom } from "./lib/ai";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.set("trust proxy", true);
app.use(express.json({ limit: "256kb" }));

// ---------------------------------------------------------------------------
// Routes — thin adapters over the shared AI logic in lib/ai.ts, which is the
// same code the Vercel functions in /api execute in production.
// ---------------------------------------------------------------------------

const apiRouter = express.Router();

apiRouter.get("/health", (_req, res) => {
  res.json(healthPayload());
});

apiRouter.post("/chat", async (req, res) => {
  const { status, body } = await handleChat({ body: req.body, ip: clientIpFrom(req.headers, req.ip) });
  res.status(status).json(body);
});

apiRouter.post("/insight", async (req, res) => {
  const { status, body } = await handleInsight({ body: req.body, ip: clientIpFrom(req.headers, req.ip) });
  res.status(status).json(body);
});

app.use("/api", apiRouter);

// ---------------------------------------------------------------------------
// Serving
// ---------------------------------------------------------------------------

async function start() {
  if (process.env.NODE_ENV !== "production") {
    // Lazily loaded so the Vercel lambda never bundles Vite (dev-only).
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
  start();
}

export default app;
