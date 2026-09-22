import { handleChat, clientIpFrom } from "../lib/ai";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed.", code: "METHOD_NOT_ALLOWED" });
  }

  const { status, body } = await handleChat({
    body: req.body,
    ip: clientIpFrom(req.headers, req.socket?.remoteAddress),
  });
  return res.status(status).json(body);
}
