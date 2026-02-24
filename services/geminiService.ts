
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { LEILA_SYSTEM_INSTRUCTION } from "../constants";
import { Department, Attachment } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const listDriveFilesTool: FunctionDeclaration = {
  name: 'list_drive_files',
  parameters: {
    type: Type.OBJECT,
    description: 'CALL THIS ONLY IF THE USER EXPLICITLY ASKS TO LIST, FIND, OR READ FILES OR FOLDERS. DO NOT CALL FOR GENERAL CHAT. Поиск файлов и папок на Google Drive.',
    properties: {
      query: { type: Type.STRING, description: 'Ключевые слова для поиска (например, "папки", "отчет", "pdf").' },
      mimeType: { type: Type.STRING, description: 'Тип файла (опционально).' },
    },
    required: ['query'],
  },
};

const createTaskTool: FunctionDeclaration = {
  name: 'create_task',
  parameters: {
    type: Type.OBJECT,
    description: 'Создание новой задачи для пользователя на Канбан доске.',
    properties: {
      title: { type: Type.STRING, description: 'Заголовок или краткое описание задачи' },
      status: { type: Type.STRING, description: 'Один из статусов: todo, in-progress, done' },
      department: { type: Type.STRING, description: 'Отдел, к которому относится задача (например, general, finance, inventor)' }
    },
    required: ['title', 'status'],
  },
};

const createDriveFileTool: FunctionDeclaration = {
  name: 'create_drive_file',
  parameters: {
    type: Type.OBJECT,
    description: 'CALL THIS ONLY IF THE USER EXPLICITLY ASKS TO CREATE A FILE. Создание документа или папки (права Редактора).',
    properties: {
      name: { type: Type.STRING },
      content: { type: Type.STRING },
      mimeType: { type: Type.STRING },
    },
    required: ['name'],
  },
};

const insertIntoSheetTool: FunctionDeclaration = {
  name: 'insert_into_sheet',
  parameters: {
    type: Type.OBJECT,
    description: 'CALL THIS ДЛЯ ДОБАВЛЕНИЯ РАСПОЗНАННЫХ ДАННЫХ ИЗ ЧЕКА В ТАБЛИЦУ. Извлекай и заполняй все возможные поля.',
    properties: {
      receipt_number: { type: Type.STRING, description: 'Уникальный номер чека, квитанции или Invoice (напр. מספר חשבונית)' },
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
    required: ['supplier', 'cost', 'date', 'receipt_number'],
  },
};

export class GeminiService {
  async sendMessage(
    message: string,
    attachments: Attachment[],
    history: { role: 'user' | 'model', parts: { text?: string, functionCall?: any, functionResponse?: any }[] }[],
    department: Department,
    processedReceipts: string[] = []
  ) {
    try {
      const isInventor = department === Department.INVENTOR;
      const modelName = isInventor ? "gemini-3-pro-preview" : "gemini-3-flash-preview";

      let deptContext = `\nТЕКУЩИЙ КОНТЕКСТ: Отдел ${department}. Тон деловой, секретарь-адъютант.`;

      if (department === Department.FINANCE) {
        deptContext += `\nФУНКЦИЯ OCR (РАСПОЗНАВАНИЕ ТЕКСТА): Если пользователь прикрепляет изображение чека/квитанции, твоя задача — автоматически распознать текст и извлечь данные. ВАЖНО: НИКОГДА НЕ ОБЪЕДИНЯЙ ТОВАРЫ В ОБЩУЮ СУММУ ЧЕКА! Ты ОБЯЗАНА вытащить КАЖДУЮ ОТДЕЛЬНУЮ ПОЗИЦИЮ из чека (каждый уникальный товар, вкус, вид, количество, цену) и вызвать функцию \`insert_into_sheet\` для КАЖДОЙ ПОЗИЦИИ отдельно новой строкой! Если в накладной 10 разных кормов, ты должна вызвать функцию 10 раз, чтобы пользователь мог вести точную аналитику по конкретным товарам.`;

        if (processedReceipts.length > 0) {
          deptContext += `\nСПИСОК УЖЕ ОБРАБОТАННЫХ ЧЕКОВ (Формат: НомерДокумента_Поставщик): [${processedReceipts.join(', ')}]. ВАЖНО: На каждом чеке найди "Номер документа" (חשבונית מס) и "Поставщика" (supplier). Составь из них ключ вида "Номер_Поставщик". Если этот ключ ЕСТЬ в Списке, это значит файл - дубликат! ДЛЯ ДУБЛИКАТОВ СТРОГО ЗАПРЕЩАЕТСЯ вызывать функцию insert_into_sheet. Вместо этого для дубликата ты ОБЯЗАНА вызвать функцию "create_drive_file" (name="ДУБЛИКАТ_<НомерДокумента>_<Поставщик>", mimeType="image/jpeg"), чтобы отложить этот чек в Google Drive для ручной проверки. В ответе пользователю напиши, что чек дубликат и отложен.`;
        } else {
          deptContext += `\nОБРАБОТКА ДУБЛИКАТОВ: Всегда находи "Номер документа" (חשבונית מס) и "Поставщика" (supplier). Если ты точно уверена по тексту сообщения, что этот файл - дубликат, используй create_drive_file для загрузки его на Диск с именем "ДУБЛИКАТ_<НомерДокумента>_<Поставщик>".`;
        }
      }

      // Prioritizing Function Declarations for Drive management.
      const tools: any[] = [{ functionDeclarations: [listDriveFilesTool, createDriveFileTool, insertIntoSheetTool, createTaskTool] }];

      const config: any = {
        systemInstruction: LEILA_SYSTEM_INSTRUCTION + deptContext,
        tools: tools
      };

      if (isInventor) {
        config.thinkingConfig = { thinkingBudget: 8192 };
      }

      // Construct the user message part with text and optional attachments (multimodal)
      const userParts: any[] = [{ text: message }];

      if (attachments && attachments.length > 0) {
        attachments.forEach(att => {
          // Gemini API expects 'inlineData' for base64 media
          userParts.push({
            inlineData: {
              mimeType: att.mimeType,
              data: att.data
            }
          });
        });
      }

      const contents = [
        ...history.map(h => ({ role: h.role, parts: h.parts })),
        { role: 'user', parts: userParts }
      ];

      const response = await ai.models.generateContent({
        model: modelName,
        contents: contents as any,
        config: config,
      });

      return response;
    } catch (error: any) {
      console.error("Gemini Error:", error);
      throw error;
    }
  }

  async sendToolResponse(history: any[], toolResults: any, department: Department) {
    try {
      const modelName = department === Department.INVENTOR ? "gemini-3-pro-preview" : "gemini-3-flash-preview";
      const response = await ai.models.generateContent({
        model: modelName,
        contents: [...history, { role: 'user', parts: toolResults }] as any,
        config: { systemInstruction: LEILA_SYSTEM_INSTRUCTION }
      });
      return response;
    } catch (error) {
      throw error;
    }
  }
}

export const geminiService = new GeminiService();
