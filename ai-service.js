const { GoogleGenerativeAI } = require('@google/generative-ai');
const { getSystemPrompt } = require('./ai-prompt');

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

function sanitizeAndParseJson(rawText) {
    // The AI might return a string wrapped in ```json ... ```, so we extract it.
    const match = rawText.match(/```json\s*([\s\S]*?)\s*```/);
    const jsonString = match ? match[1] : rawText;

    try {
        return JSON.parse(jsonString);
    } catch (error) {
        console.error("Failed to parse AI JSON response:", jsonString);
        // If parsing fails, we wrap the raw response in a standard error message.
        return {
            action: 'answer',
            message: `I seem to have encountered a formatting error. Here is the raw response I generated:\n\n---\n${rawText}`
        };
    }
}

async function handleQuery(query, tenant, resources, allBookings, user) {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const userBookings = allBookings.filter(b => b.userEmail === user.email);

    const systemPrompt = getSystemPrompt(tenant, resources, allBookings, userBookings);

    const chat = model.startChat({
        history: [
            { role: "user", parts: [{ text: systemPrompt }] },
            { role: "model", parts: [{ text: "{\"action\": \"answer\", \"message\": \"I am ready to assist you. How can I help?\"}" }] }
        ],
        generationConfig: {
            maxOutputTokens: 2000,
            temperature: 0.3,
            responseMimeType: "application/json",
        },
    });

    const result = await chat.sendMessage(query);
    const response = result.response;
    const rawText = response.text();
    
    return sanitizeAndParseJson(rawText);
}

module.exports = { handleQuery }; 