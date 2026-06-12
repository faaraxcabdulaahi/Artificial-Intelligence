import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import readline from "readline";

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const messageTopic = "Enter a topic ?";
const messageTemperatureInput =
  "Creativity (0 - 1, optional, press enter for default): ";

const askQuestion = (question) => {
  return new Promise((resolve) => rl.question(question, resolve));
};

const smartContent = async () => {
  try {
    const topic = await askQuestion(messageTopic);
    const tempInput = await askQuestion(messageTemperatureInput);
    const temperature = tempInput ? Number(tempInput) : 0.7;

    console.log("\nGenerating outline...\n");

    const prompt = `Generate a detailed blog outline about: ${topic}
                        Include:
                        - Title
                        - Introduction
                        - Main sections
                        - Conclusion`;

    const stream = await ai.models.generateContentStream({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        temperature,
      },
    });

    let outline = "";

    for await (const chunk of stream) {
      const text = chunk.text;
      console.log(text);
      process.stdout.write(text);
      outline += text;
    }

    console.log("\n\nOutline generated successfully!");
    console.log("\nOutline stored for future use.\n");

    // STEP D: Summary
    const summaryPrompt = `Summarize the following blog outline in exactly 2 sentences:${outline}`;

    const summaryResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: summaryPrompt,
      config: {
        temperature,
      },
    });

    const summary = summaryResponse.text;

    console.log("\nSummary:");
    console.log(summary);

    // STEP E: Follow-up loop
    while (true) {
      const question = await askQuestion(
        "\nAsk a question about the topic (or type exit): ",
      );

      if (question.toLowerCase() === "exit") break;

      const followUpPrompt = `Topic: ${topic}Outline:${outline} User question: ${question}`;

      const answer = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: followUpPrompt,
        config: {
          temperature,
        },
      });

      console.log("\nAnswer:");
      console.log(answer.text);
    }

    console.log("\nGoodbye!");
    rl.close();
  } catch (error) {
    console.error("Error:", error.message);
    rl.close();
  }
};

smartContent();
