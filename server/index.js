import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.post("/api/conversation", async (req, res) => {
  try {
    const userMessage = req.body.message;

    if (!userMessage) {
      return res.status(400).json({ error: "No message provided" });
    }

    const prompt = `
You are an English tutor. Correct grammar, improve vocabulary, and explain corrections clearly.
User: ${userMessage}
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash", // ✅ use if confirmed available
      contents: prompt,
    });

    res.json({ reply: response.text });
  } catch (error) {
    console.error("Gemini API error:", error);
    res.status(500).json({ error: error.message || "Something went wrong" });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
