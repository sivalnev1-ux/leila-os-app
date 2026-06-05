import { geminiService } from './services/omniGeminiService';
import { Department } from './types';

// API key must be set via GEMINI_API_KEY environment variable
if (!process.env.GEMINI_API_KEY) { console.error('GEMINI_API_KEY not set'); process.exit(1); }
geminiService['ai'] = new (require('@google/genai').GoogleGenAI)({ apiKey: process.env.GEMINI_API_KEY });

const dummyImage = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVQYV2NgYAAAAAMAAWgmWQ0AAAAASUVORK5CYII=";

async function test() {
    const attachments = [{ data: dummyImage, mimeType: 'image/png', name: 'test.png', url: '' }];
    const history = [];

    try {
        const response = await geminiService.sendMessage(
            "Создай карточку товара для этого корма. Вырежи фон, сделай красиво для Wix.",
            attachments,
            history,
            Department.GENERAL
        );

        const functionCalls = response.functionCalls ? response.functionCalls() : [];
        if (functionCalls && functionCalls.length > 0) {
            console.log("TOOL CALLED:", functionCalls[0].name);
        } else {
            console.log("NO TOOL CALLED - TEXT:", response.text ? response.text() : "No text");
        }
    } catch (e) {
        console.error(e);
    }
}

test();
