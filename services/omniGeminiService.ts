// Fix: rename for build compatibility
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { LEILA_SYSTEM_INSTRUCTION } from "../constants";
import { Department, Attachment } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.VITE_GEMINI_API_KEY || '' });

const listDriveFilesTool: FunctionDeclaration = {
    name: 'list_drive_files',
    parameters: {
        type: Type.OBJECT,
        description: 'Find files and folders on Google Drive.',
        properties: {
            query: { type: Type.STRING },
            mimeType: { type: Type.STRING },
        },
        required: ['query'],
    },
};

const delegateTaskTool: FunctionDeclaration = {
    name: 'delegate_task',
    parameters: {
        type: Type.OBJECT,
        description: 'Delegates complex tasks to specialized agents: finance, inventor, wix, development, passepartout.',
        properties: {
            target_agent: { type: Type.STRING },
            task_description: { type: Type.STRING }
        },
        required: ['target_agent', 'task_description'],
    },
};

const createTaskTool: FunctionDeclaration = {
    name: 'create_task',
    parameters: {
        type: Type.OBJECT,
        description: 'Creates a task on the Kanban board.',
        properties: {
          title: { type: Type.STRING },
          status: { type: Type.STRING },
          department: { type: Type.STRING }
        },
        required: ['title', 'status'],
    },
};

const createDriveFileTool: FunctionDeclaration = {
    name: 'create_drive_file',
    parameters: {
        type: Type.OBJECT,
        description: 'Find/Create file on Google Drive.',
        properties: {
            name: { type: Type.STRING },
            content: { type: Type.STRING },
            mimeType: { type: Type.STRING },
        },
        required: ['name'],
    },
};

const updateVoiceBridgeTool: FunctionDeclaration = {
    name: 'update_voice_bridge',
    parameters: {
        type: Type.OBJECT,
        description: 'Internal tool for Antigravity to speak through the mobile portal. CALL IN EVERY RESPONSE.',
        properties: {
            text: { type: Type.STRING }
        },
        required: ['text'],
    },
};

const listCalendarEventsTool: FunctionDeclaration = {
    name: 'list_calendar_events',
    parameters: {
        type: Type.OBJECT,
        description: 'Lists upcoming Google Calendar events.',
        properties: {
            timeMin: { type: Type.STRING },
            timeMax: { type: Type.STRING },
        },
        required: ['timeMin', 'timeMax'],
    },
};

const createCalendarEventTool: FunctionDeclaration = {
    name: 'create_calendar_event',
    parameters: {
        type: Type.OBJECT,
        description: 'Creates an event in Google Calendar.',
        properties: {
            summary: { type: Type.STRING },
            date: { type: Type.STRING },
            description: { type: Type.STRING }
        },
        required: ['summary', 'date'],
    },
};

const processReceiptBatchTool: FunctionDeclaration = {
    name: 'process_receipt_batch',
    parameters: {
        type: Type.OBJECT,
        description: 'Extracts items from receipts and invoices.',
        properties: {
            items: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        receipt_number: { type: Type.STRING },
                        file_name: { type: Type.STRING },
                        supplier: { type: Type.STRING },
                        product_name: { type: Type.STRING },
                        quantity: { type: Type.NUMBER },
                        price: { type: Type.NUMBER },
                        cost: { type: Type.NUMBER },
                        date: { type: Type.STRING },
                        category: { type: Type.STRING }
                    },
                    required: ['receipt_number', 'supplier', 'product_name', 'price']
                }
            }
        },
        required: ['items'],
    },
};

const processProductImageTool: FunctionDeclaration = {
    name: 'process_product_image',
    parameters: {
        type: Type.OBJECT,
        description: 'Image processing for Wix catalogue.',
        properties: {
            image_index: { type: Type.INTEGER },
            prompt: { type: Type.STRING }
        },
        required: ['image_index'],
    },
};

const analyzeMarketPriceTool: FunctionDeclaration = {
    name: 'analyze_market_price',
    parameters: {
        type: Type.OBJECT,
        description: 'Search Israel market (.il) for competitor prices.',
        properties: {
            product_name: { type: Type.STRING },
            current_image_index: { type: Type.INTEGER }
        },
        required: ['product_name'],
    },
};

const publishToWixTool: FunctionDeclaration = {
    name: 'publish_to_wix',
    parameters: {
        type: Type.OBJECT,
        description: 'Final publication to Wix Store.',
        properties: {
            product_data: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    description: { type: Type.STRING },
                    price: { type: Type.NUMBER },
                    sku: { type: Type.STRING },
                    image_index: { type: Type.INTEGER }
                },
                required: ['name', 'description', 'price']
              }
        },
        required: ['product_data'],
    },
};

const generateCatalogCsvTool: FunctionDeclaration = {
    name: 'generate_catalog_csv',
    parameters: {
        type: Type.OBJECT,
        description: 'Generates a CSV file for download.',
        properties: {
            csv_content: { type: Type.STRING },
            filename: { type: Type.STRING }
        },
        required: ['csv_content'],
    },
};

const saveToInboxTool: FunctionDeclaration = {
    name: 'save_to_inbox',
    parameters: {
        type: Type.OBJECT,
        description: 'Saves file directly to INBOX on Google Drive.',
        properties: {
            name: { type: Type.STRING },
            mimeType: { type: Type.STRING }
        },
        required: ['name'],
    },
};

const switchDepartmentTool: FunctionDeclaration = {
    name: 'switch_department',
    parameters: {
        type: Type.OBJECT,
        description: 'Switches the UI view to a specific department.',
        properties: {
            target_department: { type: Type.STRING }
        },
        required: ['target_department'],
    },
};

export class GeminiService {
    getOrchestratorConfig() {
        return {
            systemInstruction: LEILA_SYSTEM_INSTRUCTION + "\n🛑 КРИТИЧЕСКОЕ ПРАВИЛО ЯЗЫКА: ОБЩАЙСЯ С СЕРГЕЕМ (USER) ТОЛЬКО НА РУССКОМ ЯЗЫКЕ.\n🛑 ПРАВИЛО \"АТТАСИ\": Если слышишь команду \"Аттаси\" или \"Отставить\" — немедленно отменяй текущую операцию.\n🛑 КИБЕР-ПОРТАЛ: В КОНЦЕ КАЖДОГО СВОЕГО ОТВЕТА ВЫЗЫВАЙ update_voice_bridge(text=\"Твой ответ здесь\"), чтобы Сергей слышал тебя на телефоне.",
            tools: [{ functionDeclarations: [delegateTaskTool, switchDepartmentTool, updateVoiceBridgeTool, listDriveFilesTool, createTaskTool, listCalendarEventsTool, createCalendarEventTool, processProductImageTool] }]
        };
    }

    async sendMessage(
        message: string,
        attachments: Attachment[],
        history: any[],
        department: Department,
        processedReceipts: string[] = []
    ) {
        try {
            const modelName = department === Department.INVENTOR ? 'gemini-1.5-pro' : 'gemini-1.5-flash';
            let deptContext = "\nЯЗЫКОВОЕ ПРАВИЛО: ОТВЕЧАЙ ТОЛЬКО НА РУССКОМ ЯЗЫКЕ.\n🛑 КИБЕР-ПОРТАЛ: ВСЕГДА В КОНЦЕ ВЫЗЫВАЙ update_voice_bridge.\nCURRENT CONTEXT: Department ${department}. Role: AI Assistant for Sergey.";

            const agentTools = [];
            if (department === Department.FINANCE) agentTools.push(processReceiptBatchTool, createDriveFileTool, listCalendarEventsTool, createCalendarEventTool, updateVoiceBridgeTool);
            else if (department === Department.WIX) agentTools.push(processProductImageTool, createDriveFileTool, generateCatalogCsvTool, analyzeMarketPriceTool, publishToWixTool, updateVoiceBridgeTool);
            else if (department === Department.PASSEPARTOUT) agentTools.push(saveToInboxTool, updateVoiceBridgeTool);
            else agentTools.push(listDriveFilesTool, createDriveFileTool, delegateTaskTool, createTaskTool, listCalendarEventsTool, createCalendarEventTool, processProductImageTool, switchDepartmentTool, updateVoiceBridgeTool);

            const config: any = {
                systemInstruction: LEILA_SYSTEM_INSTRUCTION + deptContext,
                tools: agentTools.length > 0 ? [{ functionDeclarations: agentTools }] : undefined
            };

            const userParts: any[] = [{ text: message }];
            if (attachments) {
                attachments.forEach(att => {
                    userParts.push({ inlineData: { mimeType: att.mimeType, data: att.data } });
                });
            }

            const response = await ai.getGenerativeModel({
                model: modelName,
                systemInstruction: config.systemInstruction,
                tools: config.tools
            }).generateContent({
                contents: [...history, { role: 'user', parts: userParts }]
            });

            return response.response;
        } catch (error) {
            console.error('Gemini Service Error:', error);
            throw error;
        }
    }

    async sendToolResponse(history: any[], toolResults: any, department: Department) {
        try {
            const modelName = department === Department.INVENTOR ? "gemini-1.5-pro" : "gemini-1.5-flash";
            const response = await ai.getGenerativeModel({
                model: modelName,
            }).generateContent({
                contents: [...history, { role: 'user', parts: toolResults }] as any
            });
            return response.response;
        } catch (error) {
            throw error;
        }
    }
}

export const geminiService = new GeminiService();
