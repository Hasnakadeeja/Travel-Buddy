require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { GoogleGenAI } = require("@google/genai");

const app = express();

app.use(cors());
app.use(express.json());

const path = require("path");
app.use(express.static(path.join(__dirname)));

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

app.post("/chat", async (req, res) => {

    try {

        const userMessage =
        req.body.message;

        const result = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `
                You are Travel Buddy AI, a helpful and friendly travel companion.
                The user wants a travel plan based on this request: "${userMessage}".
                Provide the travel details in a structured JSON format.
                Include appropriate travel emojis in the introduction, budget items, and itinerary items.
            `,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: "OBJECT",
                    properties: {
                        intro: { type: "STRING" },
                        destination: {
                            type: "OBJECT",
                            properties: {
                                name: { type: "STRING" },
                                budget: {
                                    type: "OBJECT",
                                    properties: {
                                        total: { type: "STRING" },
                                        days: { type: "INTEGER" },
                                        items: {
                                            type: "ARRAY",
                                            items: {
                                                type: "OBJECT",
                                                properties: {
                                                    category: { type: "STRING" },
                                                    amount: { type: "STRING" },
                                                    icon: { type: "STRING" }
                                                },
                                                required: ["category", "amount", "icon"]
                                            }
                                        },
                                        note: { type: "STRING" }
                                    },
                                    required: ["total", "days", "items", "note"]
                                }
                            },
                            required: ["name", "budget"]
                        },
                        itinerary: {
                            type: "ARRAY",
                            items: {
                                type: "OBJECT",
                                properties: {
                                    day: { type: "INTEGER" },
                                    theme: { type: "STRING" },
                                    items: {
                                        type: "ARRAY",
                                        items: { type: "STRING" }
                                    }
                                },
                                required: ["day", "theme", "items"]
                            }
                        },
                        photographySpots: {
                            type: "ARRAY",
                            items: { type: "STRING" }
                        },
                        foodRecommendations: {
                            type: "ARRAY",
                            items: { type: "STRING" }
                        },
                        travelTips: {
                            type: "ARRAY",
                            items: { type: "STRING" }
                        }
                    },
                    required: ["intro", "destination", "itinerary", "photographySpots", "foodRecommendations", "travelTips"]
                }
            }
        });

        res.json({
            reply: result.text
        });

    }
    catch(error){

        console.error(error);

        res.status(500).json({
            reply: JSON.stringify({ error: error.message || "Something went wrong." })
        });
    }

});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(
        `🚀 Travel Buddy running on port ${PORT}`
    );
});