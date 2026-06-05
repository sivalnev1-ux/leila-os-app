import { GoogleGenAI } from "@google/genai";

async function run() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) { console.error('GEMINI_API_KEY not set'); return; }
    const ai = new GoogleGenAI({ apiKey });
    try {
        let pageToken;
        do {
            const response = await ai.models.list({ pageSize: 50, pageToken: pageToken });
            for (const model of response.models) {
                if (model.name.includes('flash') || model.name.includes('pro')) {
                    console.log(model.name);
                }
            }
            pageToken = response.nextPageToken;
        } while (pageToken);
    } catch (e) {
        console.error(e);
    }
}

run();
