const OpenAI = require("openai");

const MODEL = process.env.OPENAI_BILL_MODEL || "gpt-4o-mini";

function getApiKey() {
  return (
    process.env.OPENAI_API_KEY ||
    process.env.OPENAI_KEY ||
    process.env.OPEN_AI_KEY ||
    process.env.OPENAI_SECRET_KEY ||
    ""
  )
    .trim()
    .replace(/^["']|["']$/g, "");
}

/**
 * Rule-based tips so the app never shows an empty panel if the model fails.
 * @param {object} ctx
 * @returns {string[]}
 */
function buildRuleBasedRecommendations(ctx) {
  const zone = String(ctx.climateZone || "Intermediate").toLowerCase();
  const res = Number(ctx.numberOfResidents) || 1;
  const prop = ctx.propertyType || "house";
  const city = ctx.location?.city || "your area";
  const bill = Number(ctx.predictedBill) || 0;

  const tips = [];

  if (zone.includes("dry")) {
    tips.push(
      "Dry climate: shorten showers slightly and fix silent toilet leaks—they waste hundreds of liters per week."
    );
    tips.push("Water outdoor plants in early morning or evening to reduce evaporation and repeat watering.");
  } else if (zone.includes("wet")) {
    tips.push(
      "Wetter season: capture roof runoff in barrels for garden use (non-potable) to lower metered consumption."
    );
  } else {
    tips.push(
      "Intermediate climate: track usage monthly; unexpected jumps often mean leaks or irrigation issues."
    );
  }

  tips.push(
    `For ${res} resident(s) in ${city}: run dishwashers and washing machines only on full loads.`
  );

  if (prop === "apartment") {
    tips.push("Apartment living: report dripping taps or running toilets to building maintenance promptly.");
  } else {
    tips.push("House: check garden taps, hose connections, and any auto-irrigation timers each month.");
  }

  tips.push("Rinse vegetables and fruit in a bowl; reuse that water for plants or cleaning where safe.");
  tips.push("Install or maintain aerators on taps and prefer a bucket over a running hose for washing.");

  if (bill > 0) {
    tips.push(
      `Rough guide: cutting usage by ~10% could save around Rs. ${(bill * 0.1).toFixed(0)} on your estimated Rs. ${bill.toFixed(0)} bill.`
    );
  }

  return tips.slice(0, 7);
}

function normalizeRecommendationList(parsed) {
  if (!parsed || typeof parsed !== "object") return [];

  let list =
    parsed.recommendations ||
    parsed.tips ||
    parsed.items ||
    parsed.suggestions ||
    parsed.advice;

  if (typeof list === "string") list = [list];
  if (!Array.isArray(list)) {
    if (typeof parsed.recommendation === "string") list = [parsed.recommendation];
    else return [];
  }

  return list
    .map((s) => (typeof s === "string" ? s.trim() : ""))
    .filter(Boolean)
    .slice(0, 8);
}

/**
 * Models often wrap JSON in ```json ... ``` — strip and parse safely.
 * @param {string} raw
 * @returns {string[]}
 */
function parseRecommendationsFromContent(raw) {
  if (!raw || typeof raw !== "string") return [];

  let s = raw.trim();
  const fence = /^```(?:json)?\s*([\s\S]*?)```/i;
  const fenced = s.match(fence);
  if (fenced) s = fenced[1].trim();

  const tryParse = (str) => {
    try {
      return JSON.parse(str);
    } catch {
      return null;
    }
  };

  let parsed = tryParse(s);
  if (parsed) return normalizeRecommendationList(parsed);

  const brace = s.match(/\{[\s\S]*\}/);
  if (brace) {
    parsed = tryParse(brace[0]);
    if (parsed) return normalizeRecommendationList(parsed);
  }

  return [];
}

/**
 * @param {object} ctx
 * @returns {Promise<{ recommendations: string[] }>}
 */
async function getBillRecommendationsForHousehold(ctx) {
  const fallback = { recommendations: buildRuleBasedRecommendations(ctx) };

  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn("billRecommendationService: no OpenAI API key; using rule-based tips.");
    return fallback;
  }

  const {
    name,
    numberOfResidents,
    propertyType,
    location,
    predictedBill,
    estimatedMonthlyLiters,
    estimatedMonthlyUnits,
    climateZone,
  } = ctx;

  const city = location?.city || "Unknown";
  const country = location?.country || "Sri Lanka";

  const userPayload = {
    householdName: name,
    residents: numberOfResidents,
    propertyType,
    city,
    country,
    climateZone: climateZone || "Intermediate",
    estimatedMonthlyLiters: Number(estimatedMonthlyLiters) || 0,
    estimatedMonthlyUnits: Number(estimatedMonthlyUnits) || 0,
    predictedMonthlyBillRs: Number(predictedBill) || 0,
  };

  const client = new OpenAI({ apiKey });

  try {
    const completion = await client.chat.completions.create({
      model: MODEL,
      temperature: 0.5,
      max_tokens: 700,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a concise water-efficiency advisor for households in Sri Lanka. " +
            "Respond ONLY with valid JSON (no markdown fences) in this exact shape: " +
            '{"recommendations": ["string", ...] } with 5 to 7 items. ' +
            "Each string is one short actionable tip (1-2 sentences). " +
            "Tailor to climate zone, property type, household size, and estimated bill. " +
            "No markdown or bullet characters inside strings.",
        },
        {
          role: "user",
          content: JSON.stringify(userPayload),
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content?.trim() || "";
    const fromModel = parseRecommendationsFromContent(raw);

    if (fromModel.length > 0) {
      return { recommendations: fromModel };
    }

    console.warn("billRecommendationService: empty or unparseable model output; using rule-based tips.");
    return fallback;
  } catch (err) {
    console.error("billRecommendationService:", err.message || err);
    return fallback;
  }
}

module.exports = {
  getBillRecommendationsForHousehold,
  buildRuleBasedRecommendations,
};
