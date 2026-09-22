import { healthPayload } from "../lib/ai.js";

export default function handler(_req: any, res: any) {
  return res.status(200).json(healthPayload());
}
