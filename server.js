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

// Helper function to call Gemini with automatic retries for transient errors
async function generateContentWithRetry(ai, options, maxRetries = 2, delayMs = 1500) {
    let lastError;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await ai.models.generateContent(options);
        } catch (error) {
            lastError = error;
            const status = error.status || (error.response && error.response.status);
            const message = (error.message || "").toLowerCase();
            
            // Identify transient errors that are safe to retry:
            // 429 (Rate Limit / Quota Exhausted), 503 (Service Unavailable), 500 (Internal Server Error)
            // or error messages containing keywords like busy, overloaded, demand, limit.
            const isTransient = !status || status === 429 || status >= 500 || 
                                message.includes("demand") || message.includes("busy") || 
                                message.includes("overloaded") || message.includes("resource exhausted") ||
                                message.includes("rate limit") || message.includes("quota");
                                
            if (!isTransient || attempt === maxRetries) {
                console.error(`Gemini API call failed permanently: ${error.message}`);
                throw error;
            }
            
            console.warn(`Gemini API call transient failure (attempt ${attempt + 1}/${maxRetries + 1}). Retrying in ${delayMs}ms... Error: ${error.message}`);
            await new Promise(resolve => setTimeout(resolve, delayMs));
            delayMs *= 2; // Exponential backoff
        }
    }
    throw lastError;
}

app.post("/chat", async (req, res) => {

    try {

        const userMessage =
        req.body.message;

        // Gracefully handle simple greetings locally without overloading the LLM/Schema
        const cleanMsg = userMessage.trim().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "").toLowerCase();
        const greetings = ["hello", "hi", "hey", "greetings", "good morning", "good afternoon", "good evening", "yo", "hello travel buddy", "hey travel buddy"];
        
        if (greetings.includes(cleanMsg)) {
            const greetingResponse = {
                intro: "👋 Hello! I'm Travel Buddy, your personal AI travel companion. Tell me where you'd like to go (e.g. *'Plan a 3-day trip to Munnar'* or *'Weekend beach getaway'*) and I will build a custom itinerary, budget breakdown, and local recommendations for you! ✈️",
                destination: {
                    name: "Your Next Destination",
                    budget: {
                        total: "0",
                        days: 1,
                        items: [],
                        note: "Enter a destination to calculate budgets!"
                    }
                },
                itinerary: [],
                photographySpots: [],
                foodRecommendations: [],
                travelTips: []
            };
            return res.json({
                reply: JSON.stringify(greetingResponse)
            });
        }

        const result = await generateContentWithRetry(ai, {
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