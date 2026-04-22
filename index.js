import express from "express";
import OpenAI from "openai";

const app = express();
app.use(express.urlencoded({ extended: true }));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.post("/sms", async (req, res) => {
  const msg = req.body.Body;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "Your name is David. You are a helpful, real, human-like mentor."
      },
      { role: "user", content: msg }
    ]
  });

  const reply = response.choices[0].message.content;

  res.send(`<Response><Message>${reply}</Message></Response>`);
});

app.get("/", (req, res) => {
  res.send("David AI is running");
});

app.listen(3000, () => console.log("Server running"));