import express from "express";
import OpenAI from "openai";
import pkg from "@supabase/supabase-js";

const { createClient } = pkg;

const app = express();
app.use(express.urlencoded({ extended: true }));

const openai = new OpenAI({ apiKey: "YOUR_OPENAI_KEY" });

const supabase = createClient(
  "YOUR_SUPABASE_URL",
  "YOUR_SUPABASE_KEY"
);

let memory = {};

app.post("/sms", async (req, res) => {
  const from = req.body.From;
  const msg = req.body.Body;

  if (!memory[from]) memory[from] = [];

  // 🔁 Get memory
  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("phone", from)
    .single();

  const profile = data?.profile || {};

  memory[from].push({ role: "user", content: msg });

  // 🧠 DAVID (main brain)
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `
Your name is David.

You are a calm, intelligent, real human-like mentor.

User profile:
${JSON.stringify(profile)}

You help with:
- life advice
- discipline
- mindset
- relationships
- decision making

Style:
- Talk like a normal person texting
- Not robotic
- Not overly long
- Honest when needed
- Ask questions sometimes

Goal:
Feel like a real person the user can text anytime.
`
      },
      ...memory[from].slice(-10)
    ]
  });

  const reply = response.choices[0].message.content;

  memory[from].push({ role: "assistant", content: reply });

  // 🧠 Update long-term memory
  const update = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "Extract user goals, habits, personality traits. Return JSON."
      },
      { role: "user", content: msg }
    ]
  });

  let newData;
  try {
    newData = JSON.parse(update.choices[0].message.content);
  } catch {
    newData = {};
  }

  await supabase.from("users").upsert({
    phone: from,
    profile: { ...profile, ...newData }
  });

  res.send(`<Response><Message>${reply}</Message></Response>`);
});

app.listen(3000);