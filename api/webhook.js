import crypto from "crypto";

// Product variant IDs → access duration in days
const VARIANT_ACCESS = {
  // BrieflyAI
  "9bdbb630-0778-4cc8-8c5f-0fd9810fb54f": 90,   // Starter 3 months
  "cec06506-b65e-400c-a745-1175e1f7ee12": 365,  // Pro 1 year
  "ebdc7bf6-06d4-4eb8-a901-5bc8b66aa1d0": 36500, // Lifetime
  // CraftCV
  "2fa49e1f-d8e3-4eee-b7d8-ba994422dcbe": 90,   // Starter 3 months
  "0620b4a5-4b67-4f7e-9282-9207e8297bb4": 365,  // Pro 1 year
  "f64fcf1b-191f-43cd-a11a-8e31a437a527": 36500, // Lifetime
};

export const config = { api: { bodyParser: false } };

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", chunk => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret) return res.status(500).json({ error: "Webhook secret not configured" });

  const rawBody = await getRawBody(req);
  const signature = req.headers["x-signature"];

  if (!signature) return res.status(401).json({ error: "No signature" });

  const hmac = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  if (!crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(signature))) {
    return res.status(401).json({ error: "Invalid signature" });
  }

  const payload = JSON.parse(rawBody.toString());
  const eventName = payload?.meta?.event_name;

  if (eventName !== "order_created") {
    return res.status(200).json({ received: true });
  }

  const attrs = payload?.data?.attributes;
  if (attrs?.status !== "paid") {
    return res.status(200).json({ received: true });
  }

  const email = attrs?.user_email?.toLowerCase();
  const variantId = String(attrs?.first_order_item?.variant_id);

  if (!email) return res.status(400).json({ error: "No email in payload" });

  // Find access duration
  const days = VARIANT_ACCESS[variantId] || 365;
  const expiresAt = Date.now() + days * 24 * 60 * 60 * 1000;

  // Store in Upstash Redis via REST API
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  // Store as: email → { expiresAt, variantId, product }
  const key = `access:${email}`;
  const value = JSON.stringify({ expiresAt, variantId, days, grantedAt: Date.now() });

  await fetch(`${redisUrl}/set/${encodeURIComponent(key)}/${encodeURIComponent(value)}`, {
    headers: { Authorization: `Bearer ${redisToken}` },
  });

  console.log(`Access granted to ${email} for ${days} days`);
  return res.status(200).json({ received: true });
}
