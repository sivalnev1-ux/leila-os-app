import { GoogleGenAI, Type } from "@google/genai";
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const insertIntoSheetTool = {
    name: 'insert_into_sheet',
    parameters: {
        type: Type.OBJECT,
        description: 'CALL THIS ДЛЯ ДОБАВЛЕНИЯ РАСПОЗНАННЫХ ДАННЫХ ИЗ ЧЕКА В ТАБЛИЦУ. Извлекай и заполняй все возможные поля.',
        properties: {
            file_name: { type: Type.STRING, description: 'Название файла или документа' },
            supplier: { type: Type.STRING, description: 'Поставщик / Магазин / Контрагент' },
            product_name: { type: Type.STRING, description: 'Название товара или услуги' },
            quantity: { type: Type.NUMBER, description: 'Количество' },
            price: { type: Type.NUMBER, description: 'Цена за единицу (число)' },
            cost: { type: Type.NUMBER, description: 'Общая стоимость / Итоговая сумма (число)' },
            margin: { type: Type.NUMBER, description: 'Маржа (если применимо)' },
            date: { type: Type.STRING, description: 'Дата документа (ДД.ММ.ГГГГ)' },
            category: { type: Type.STRING, description: 'Категория расхода' },
            notes: { type: Type.STRING, description: 'Дополнительные заметки' }
        },
        required: ['supplier', 'cost', 'date'],
    },
};

async function test() {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: [{ role: 'user', parts: [{ text: "У меня тут чек из Макдональдса на 500 рублей от 10 марта. Добавь в таблицу." }] }],
            config: {
                tools: [{ functionDeclarations: [insertIntoSheetTool] }]
            }
        });
        console.log("Response:", JSON.stringify(response.functionCalls, null, 2));
    } catch (e: any) {
        console.error("ERROR CAUGHT:");
        console.error(e.message);
        if (e.statusDetails) console.error(JSON.stringify(e.statusDetails, null, 2));
    }
}

test();
