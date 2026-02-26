
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

const delegateTaskTool: FunctionDeclaration = {
  name: 'delegate_task',
  parameters: {
    type: Type.OBJECT,
    description: 'Делегирование сложной специализированной задачи профильному субагенту (отделу). ВЫЗЫВАЙ ЭТУ ФУНКЦИЮ всегда, когда запрос касается финансов (чеки, расходы, счета, накладные - отдел finance), программирования/R&D (код, сложные архитектуры - отдел inventor) или управления сайтом (каталог Wix - отдел wix). ТЫ НЕ ДОЛЖНА ДЕЛАТЬ ИХ РАБОТУ САМА. Передай им поручение и дождись ответа.',
    properties: {
      target_agent: { type: Type.STRING, description: 'ID субагента: finance, inventor, wix, development' },
      task_description: { type: Type.STRING, description: 'ПОДРОБНАЯ инструкция для субагента, что именно он должен сделать (включая все детали из оригинального запроса пользователя).' }
    },
    required: ['target_agent', 'task_description'],
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

const listCalendarEventsTool: FunctionDeclaration = {
  name: 'list_calendar_events',
  parameters: {
    type: Type.OBJECT,
    description: 'Поиск и получение списка предстоящих событий из Google Календаря.',
    properties: {
      timeMin: { type: Type.STRING, description: 'Дата начала в формате ISO (e.g. 2024-03-20T00:00:00Z)' },
      timeMax: { type: Type.STRING, description: 'Дата окончания в формате ISO (e.g. 2024-03-25T23:59:59Z)' },
    },
    required: ['timeMin', 'timeMax'],
  },
};

const createCalendarEventTool: FunctionDeclaration = {
  name: 'create_calendar_event',
  parameters: {
    type: Type.OBJECT,
    description: 'Создание нового события (встречи, напоминания, записи о сходе чека) в Google Календаре.',
    properties: {
      summary: { type: Type.STRING, description: 'Заголовок события (например, "Сход чека: 5000₪ [Поставщик]")' },
      date: { type: Type.STRING, description: 'Дата события. Если на весь день, формат YYYY-MM-DD. Если точное время, формат ISO (e.g. "2024-03-20T15:00:00Z")' },
      description: { type: Type.STRING, description: 'Подробное описание события (опционально)' }
    },
    required: ['summary', 'date'],
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
    required: ['receipt_number', 'supplier', 'product_name', 'price'],
  },
};

const processProductImageTool: FunctionDeclaration = {
  name: 'process_product_image',
  parameters: {
    type: Type.OBJECT,
    description: 'Передает фото товара в LensPerfect AI (Photoroom v2). Модуль автоматически: вырезает фон, ставит идеальный белый студийный фон, центрирует (padding) и добавляет профессиональную 3D-тень от источника света. Возвращает JPEG. Используй для красивых карточек товаров!',
    properties: {
      image_index: { type: Type.INTEGER, description: 'Индекс прикрепленного изображения в массиве attachments (начиная с 0), фон которого нужно удалить.' },
      prompt: { type: Type.STRING, description: 'Опционально, НО СТРОГО ОБЯЗАТЕЛЬНО при подготовке товаров для каталога. Текст генеративного промпта. Всегда передавай: "center the product perfectly, pure white background (#FFFFFF), soft natural shadow under the product, square format, remove wrinkles and glare"' }
    },
    required: ['image_index'],
  },
};

const generateCatalogCsvTool: FunctionDeclaration = {
  name: 'generate_catalog_csv',
  parameters: {
    type: Type.OBJECT,
    description: 'Генерирует готовый CSV-файл с товарами для скачивания пользователем. КРИТИЧЕСКИ ВАЖНО: НИКОГДА НЕ ПИШИ В ТЕКСТОВОМ ОТВЕТЕ ССЫЛКИ СОДЕРЖАЩИЕ data:text/csv ИЛИ BASE64. Просто вызови этот инструмент и скажи текстом, что файл сформирован. Система сама сделает кнопку.',
    properties: {
      csv_content: { type: Type.STRING, description: 'Полный текст CSV-файла, включая строку заголовков (например: handle,name,description,price,sku) и все строки с данными, разделенные запятыми.' },
      filename: { type: Type.STRING, description: 'Опционально. Имя файла, например: wix_catalog.csv' }
    },
    required: ['csv_content'],
  },
};

export class GeminiService {
  getOrchestratorConfig() {
    let deptContext = `\nТЕКУЩИЙ КОНТЕКСТ: Отдел ${Department.GENERAL}. Тон деловой, секретарь-адъютант.`;
    deptContext += `\nВНИМАНИЕ ОРКЕСТРАТОР: У тебя в подчинении есть Отделы (finance, inventor, wix). Если запрос пользователя касается ИХ зоны ответственности — ты ОБЯЗАНА вызвать функцию delegate_task. Передай им всю информацию (фотографии и файлы прикрепятся к ним автоматически). Ты получишь их ответ в качестве результата вызова функции, после чего резюмируй его для пользователя. \nОЧЕНЬ ВАЖНО ПРО ФОТОГРАФИИ: Если пользователь просит "сделать красиво", "вырезать фон", "обработать фото" или "сделать для каталога" - ТЫ ДОЛЖНА НЕМЕДЛЕННО ВЫЗВАТЬ ФУНКЦИЮ \`process_product_image\`, НЕ ПЫТАЙСЯ ПРИДУМАТЬ ОТГОВОРКУ. У АПИ НЕТ СБОЕВ, ПРОСТО ВЫЗОВИ ИНСТРУМЕНТ \`process_product_image\` напрямую. ПРИ ВЫЗОВЕ ИНСТРУМЕНТА СТРОГО ОБЯЗАТЕЛЬНО передавать в аргумент 'prompt' следующий текст: "center the product perfectly, pure white background (#FFFFFF), soft natural shadow under the product, square format, remove wrinkles and glare"`;

    return {
      systemInstruction: LEILA_SYSTEM_INSTRUCTION + deptContext,
      tools: [{ functionDeclarations: [delegateTaskTool, listDriveFilesTool, createTaskTool, listCalendarEventsTool, createCalendarEventTool, processProductImageTool] }]
    };
  }

  async sendMessage(
    message: string,
    attachments: Attachment[],
    history: { role: 'user' | 'model', parts: { text?: string, functionCall?: any, functionResponse?: any }[] }[],
    department: Department,
    processedReceipts: string[] = []
  ) {
    try {
      const isInventor = department === Department.INVENTOR;
      const modelName = isInventor ? "gemini-3-pro-preview" : "gemini-2.5-flash";

      let deptContext = `\nТЕКУЩИЙ КОНТЕКСТ: Отдел ${department}. Тон деловой, секретарь-адъютант.`;

      if (department === Department.FINANCE) {
        deptContext += `\nФУНКЦИЯ OCR (РАСПОЗНАВАНИЕ ТЕКСТА): Если пользователь прикрепляет изображение чека/квитанции, твоя задача — автоматически распознать текст и извлечь данные. ВАЖНО: НИКОГДА НЕ ОБЪЕДИНЯЙ ТОВАРЫ В ОБЩУЮ СУММУ ЧЕКА! Ты ОБЯЗАНА вытащить КАЖДУЮ ОТДЕЛЬНУЮ ПОЗИЦИЮ из чека (каждый уникальный товар, вкус, вид, количество, цену) и вызвать функцию \`insert_into_sheet\` для КАЖДОЙ ПОЗИЦИИ отдельно новой строкой! Если в накладной 10 разных кормов, ты должна вызвать функцию 10 раз, чтобы пользователь мог вести точную аналитику по конкретным товарам.`;
        deptContext += `\nФИНАНСОВЫЙ КАЛЕНДАРЬ (CASH FLOW): Если в документе (например, в чеке или счете) указана дата БУДУЩЕГО платежа (отложенный чек, рассрочка, дата оплаты накладной), ты ОБЯЗАНА записать это не только в Таблицу, но И создать событие в Календаре (create_calendar_event) на эту дату, чтобы Сергий видел ожидаемый расход/доход. В названии события пиши сумму и получателя, например "Сход чека: 1540₪ [Reflex]".`;

        if (processedReceipts.length > 0) {
          deptContext += `\nСПИСОК УЖЕ ОБРАБОТАННЫХ ЧЕКОВ (Формат: НомерДокумента_Поставщик): [${processedReceipts.join(', ')}]. ВАЖНО: На каждом чеке найди "Номер документа" (חשבונית מס) и "Поставщика" (supplier). Составь из них ключ вида "Номер_Поставщик". Если этот ключ ЕСТЬ в Списке, это значит файл - дубликат! ДЛЯ ДУБЛИКАТОВ СТРОГО ЗАПРЕЩАЕТСЯ вызывать функцию insert_into_sheet. Вместо этого для дубликата ты ОБЯЗАНА вызвать функцию "create_drive_file" (name="ДУБЛИКАТ_<НомерДокумента>_<Поставщик>", mimeType="image/jpeg"), чтобы отложить этот чек в Google Drive для ручной проверки. В ответе пользователю напиши на иврите, что чек дубликат и отложен (например: "הקבלה היא כפילות והועברה לתיקייה נפרדת לבדיקה").`;
        } else {
          deptContext += `\nОБРАБОТКА ДУБЛИКАТОВ: Всегда находи "Номер документа" (חשבונית מס) и "Поставщика" (supplier). Если ты точно уверена по тексту сообщения, что этот файл - дубликат, используй create_drive_file для загрузки его на Диск с именем "ДУБЛИКАТ_<НомерДокумента>_<Поставщик>".`;
        }
      } else if (department === Department.WIX) {
        deptContext += `\nТВОЯ РОЛЬ: Ты — Гениальный Копирайтер и Контент-Менеджер для интернет-магазина (Bonnie Market, зоотовары). Твоя задача — анализировать фотографии товаров (от 1 до 5 шт), извлекать факты и создавать идеальные карточки товаров для каталога Wix.
        
ПРАВИЛА ДЛЯ ОПИСАНИЙ ТОВАРОВ:
1. Заголовок: Продающий, точный, с ключевыми словами.
2. Маркетинговое описание: Сочное, вкусное, закрывающее боли клиента. Никакой воды, только польза и эмоции. Почему этот товар особенный?
3. Характеристики: Сформируй четкий маркированный список фактов (Вес, Вкус, Возраст, Состав).
4. ЭКСПОРТ ДАННЫХ В CSV: Если пользователь просит подготовить таблицу для импорта (Wix/Shopify) или сформировать файл с результатами текущей работы, ты ОБЯЗАНА вызвать функцию \`generate_catalog_csv\`. В аргумент 'csv_content' передай строго отформатированный CSV текст. Колонки должны быть: handle,name,description,price,sku. Описание (description) должно быть в одной ячейке (используй кавычки для экранирования абзацев). КРИТИЧЕСКИ ВАЖНО: КАТЕГОРИЧЕСКИ ЗАПРЕЩАЕТСЯ ВОЗВРАЩАТЬ В ТЕКСТЕ ОТВЕТА ССЫЛКИ С BASE64 (data:text/csv;base64...). СИСТЕМА САМА СОЗДАСТ ФАЙЛ ПРИ ВЫЗОВЕ ИНСТРУМЕНТА. В текстовом ответе просто скажи на Иврите, что файл מוכן (готов).
5. ФОТОГРАФИИ (АВТОМАТИЗАЦИЯ LensPerfect AI): Если пользователь загрузил фото товара для каталога, ТЫ ОБЯЗАНА вызвать инструмент \`process_product_image\` (передав индекс картинки) для подготовки чистой идеальной карточки. 
ВАЖНО: При каждом вызове \`process_product_image\` ВСЕГДА передавай в аргумент 'prompt' следующий текст, чтобы нейросеть выровняла товар, убрала блики и разгладила складки: "center the product perfectly, pure white background (#FFFFFF), soft natural shadow under the product, square format, remove wrinkles and glare".
Укажи в ответе пользователю на иврите: "התמונה עובדה על ידי LensPerfect AI: ישרה, ללא השתקפויות או קמטים, ונוסף רקע סטודיו לבן".`;
      }

      let tools: any[] = [];
      if (department === Department.GENERAL) {
        // Master Orchestrator: can delegate, list files, create tasks.
        tools = [{ functionDeclarations: [delegateTaskTool, listDriveFilesTool, createTaskTool, listCalendarEventsTool, createCalendarEventTool, processProductImageTool] }];
        deptContext += `\nВНИМАНИЕ ОРКЕСТРАТОР: У тебя в подчинении есть Отделы (finance, inventor, wix). Если запрос пользователя касается ИХ зоны ответственности — ты ОБЯЗАНА вызвать функцию delegate_task. Передай им всю информацию (фотографии и файлы прикрепятся к ним автоматически). Ты получишь их ответ в качестве результата вызова функции, после чего резюмируй его для пользователя на ИВРИТЕ. \nОЧЕНЬ ВАЖНО ПРО ФОТОГРАФИИ: Если пользователь просит "сделать красиво", "вырезать фон", "обработать фото" или "сделать для каталога" - ТЫ ДОЛЖНА НЕМЕДЛЕННО ВЫЗВАТЬ ФУНКЦИЮ \`process_product_image\`, НЕ ПЫТАЙСЯ ПРИДУМАТЬ ОТГОВОРКУ. У АПИ НЕТ СБОЕВ, ПРОСТО ВЫЗОВИ ИНСТРУМЕНТ \`process_product_image\` напрямую. ПРИ ВЫЗОВЕ ИНСТРУМЕНТА СТРОГО ОБЯЗАТЕЛЬНО передавать в аргумент 'prompt' следующий текст: "center the product perfectly, pure white background (#FFFFFF), soft natural shadow under the product, square format, remove wrinkles and glare"`;
      } else {
        // Sub-agents get specific execution tools
        const agentTools = [];
        if (department === Department.FINANCE) agentTools.push(insertIntoSheetTool, createDriveFileTool, listCalendarEventsTool, createCalendarEventTool);
        else if (department === Department.INVENTOR || department === Department.DEVELOPMENT) agentTools.push(listDriveFilesTool, createDriveFileTool);
        else if (department === Department.WIX) agentTools.push(processProductImageTool, createDriveFileTool, generateCatalogCsvTool);

        if (agentTools.length > 0) {
          tools = [{ functionDeclarations: agentTools }];
        }
      }

      const config: any = {
        systemInstruction: LEILA_SYSTEM_INSTRUCTION + deptContext,
        tools: tools.length > 0 ? tools : undefined
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
      const modelName = department === Department.INVENTOR ? "gemini-3-pro-preview" : "gemini-2.5-flash";
      const response = await ai.models.generateContent({
        model: modelName,
        contents: [...history, { role: 'user', parts: toolResults }] as any,
        // When sending tool responses back, usually the config context needs to be preserved if we want role consistency
        config: { systemInstruction: LEILA_SYSTEM_INSTRUCTION + `\nТЕКУЩИЙ КОНТЕКСТ: Отдел ${department}. Тон деловой, секретарь-адъютант.` }
      });
      return response;
    } catch (error) {
      throw error;
    }
  }
}

export const geminiService = new GeminiService();
