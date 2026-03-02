// Основная функция — запускается по триггеру при новых файлах в INBOX
function processInbox() {
  const ROOT_FOLDER_NAME = "bonnie_finance_system";
  const INBOX_FOLDER_NAME = "00_INBOX";
  const PARSED_FOLDER_NAME = "01_PARSED";
  const MASTER_SHEETS_FOLDER_NAME = "Master_Sheets";
  const SPREADSHEET_NAME = "Finance_Master_2026";
  const RAW_SHEET_NAME = "raw_docs"; // лист для метаданных файлов
  const PARSED_SHEET_NAME = "parsed_data"; // новый лист для полных данных

  const root = getFolderByNameOrThrow(ROOT_FOLDER_NAME);
  const inbox = getSubFolderByNameOrThrow(root, INBOX_FOLDER_NAME);
  const parsed = getSubFolderByNameOrThrow(root, PARSED_FOLDER_NAME);
  const masterSheets = getSubFolderByNameOrThrow(root, MASTER_SHEETS_FOLDER_NAME);
  const ssFile = getGoogleSheetByNameOrThrow(masterSheets, SPREADSHEET_NAME);
  const ss = SpreadsheetApp.openById(ssFile.getId());

  // Лист для метаданных (как раньше)
  let rawSheet = ss.getSheetByName(RAW_SHEET_NAME) || ss.insertSheet(RAW_SHEET_NAME);
  if (rawSheet.getLastRow() === 0) {
    rawSheet.appendRow(["timestamp", "file_id", "file_name", "file_url", "size_bytes", "status"]);
  }

  // Новый лист для полных данных (если нет — создаём)
  let parsedSheet = ss.getSheetByName(PARSED_SHEET_NAME) || ss.insertSheet(PARSED_SHEET_NAME);
  if (parsedSheet.getLastRow() === 0) {
    // Заголовки — адаптируй под структуру твоих файлов (добавь/убери столбцы)
    parsedSheet.appendRow([
      "timestamp", "file_id", "file_name", 
      "supplier", "product_name", "quantity", "price", "cost", "margin", 
      "date", "category", "notes" // + любые другие метрики
    ]);
  }

  // Existing IDs to prevent duplicates
  const existingIds = new Set();
  const lastRow = rawSheet.getLastRow();
  if (lastRow > 1) {
    const ids = rawSheet.getRange(2, 2, lastRow - 1, 1).getValues(); // col B
    ids.forEach(r => { if (r[0]) existingIds.add(String(r[0])); });
  }

  const files = inbox.getFiles();
  let processedCount = 0;

  while (files.hasNext()) {
    const file = files.next();
    const id = String(file.getId());
    if (existingIds.has(id)) continue;

    // Записываем метаданные
    rawSheet.appendRow([
      new Date(), id, file.getName(), file.getUrl(), file.getSize(), "PROCESSED"
    ]);

    // Полный парсинг файла
    parseAndInsertData(file, parsedSheet, id);

    // Перемещаем файл в PARSED
    file.moveTo(parsed);

    processedCount++;
    Logger.log(`Processed ${file.getName()}: ${processedCount} files total`);
  }

  if (processedCount > 0) {
    // Опционально: отправь email с отчётом о обработке
    sendProcessingReport(processedCount, root.getUrl());
  }
}

// Полный парсинг файла и разбор по столбцам
function parseAndInsertData(file, parsedSheet, fileId) {
  let spreadsheet;
  if (file.getMimeType() === MimeType.MICROSOFT_EXCEL) {
    // Конвертируем Excel в Google Sheets
    const resource = {
      title: file.getName() + ' (parsed)',
      mimeType: MimeType.GOOGLE_SHEETS
    };
    spreadsheet = Drive.Files.insert(resource, file.getBlob(), {convert: true});
    spreadsheet = SpreadsheetApp.openById(spreadsheet.id);
  } else {
    spreadsheet = SpreadsheetApp.openById(file.getId());
  }

  const sheet = spreadsheet.getSheets()[0]; // первый лист
  const data = sheet.getDataRange().getValues(); // все данные

  if (data.length <= 1) return; // пустой файл

  // Адаптируй индексы столбцов под свою структуру Excel (0 = A, 1 = B и т.д.)
  const headers = data[0]; // первая строка — заголовки
  for (let i = 1; i < data.length; i++) { // пропускаем заголовки
    const row = data[i];
    if (row.length < 3) continue; // пропускаем пустые строки

    parsedSheet.appendRow([
      new Date(), fileId, file.getName(),
      row[0] || '', // supplier (поставщик, столбец A)
      row[1] || '', // product_name (наименование товара, столбец B)
      row[2] || 0,  // quantity (количество, столбец C)
      row[3] || 0,  // price (цена, столбец D)
      row[4] || 0,  // cost (себестоимость, столбец E)
      (row[3] - row[4]) || 0, // margin (маржа = цена - себестоимость, столбец F)
      row[5] || '', // date (дата, столбец G)
      row[6] || '', // category (категория, столбец H)
      row[7] || ''  // notes (примечания, столбец I)
    ]);
  }

  // Удаляем временный Sheet, если конвертировали Excel
  if (file.getMimeType() === MimeType.MICROSOFT_EXCEL) {
    DriveApp.getFileById(spreadsheet.getId()).setTrashed(true);
  }
}

// Функция для запросов ботов (фильтрация данных)
function queryData(query) {
  const ROOT_FOLDER_NAME = "bonnie_finance_system";
  const MASTER_SHEETS_FOLDER_NAME = "Master_Sheets";
  const SPREADSHEET_NAME = "Finance_Master_2026";
  const PARSED_SHEET_NAME = "parsed_data";

  const root = getFolderByNameOrThrow(ROOT_FOLDER_NAME);
  const masterSheets = getSubFolderByNameOrThrow(root, MASTER_SHEETS_FOLDER_NAME);
  const ss = SpreadsheetApp.openById(getGoogleSheetByNameOrThrow(masterSheets, SPREADSHEET_NAME).getId());
  const sheet = ss.getSheetByName(PARSED_SHEET_NAME);

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return "Нет данных для анализа";

  let result = [];
  const rows = data.slice(1); // пропускаем заголовки

  // Пример фильтрации по запросу (адаптируй под твои вопросы)
  if (query.includes("корма у Ави за последние три месяца")) {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    rows.forEach(row => {
      const date = new Date(row[9]); // столбец J — дата
      const supplier = row[3]; // столбец D — поставщик
      const product = row[4]; // столбец E — товар
      const quantity = row[5]; // столбец F — количество

      if (date >= threeMonthsAgo && supplier.toLowerCase().includes("ави") && product.toLowerCase().includes("корм")) {
        result.push({
          date: date.toLocaleDateString(),
          supplier: supplier,
          product: product,
          quantity: quantity
        });
      }
    });

    if (result.length > 0) {
      const totalQuantity = result.reduce((sum, r) => sum + r.quantity, 0);
      return `За последние 3 месяца купили корма у Ави: ${totalQuantity} единиц. Детали: ${JSON.stringify(result, null, 2)}`;
    } else {
      return "Нет данных по корму у Ави за 3 месяца";
    }
  }

  // Добавь здесь другие примеры запросов (маржа, остатки и т.д.)
  return "Запрос не распознан. Примеры: 'маржа по аксессуарам за январь', 'сколько корма у Ави за 3 месяца'";
}

// Отправка отчёта по email (опционально)
function sendProcessingReport(count, folderUrl) {
  MailApp.sendEmail(
    "твой_email@gmail.com",
    "Обработано файлов в Finance System",
    `Загружено ${count} новых файлов. Ссылка на папку: ${folderUrl}\nПроверь мастер-таблицу: ${SpreadsheetApp.getActiveSpreadsheet().getUrl()}`
  );
}

// Helpers (как раньше)
function getFolderByNameOrThrow(name) {
  const it = DriveApp.getFoldersByName(name);
  if (!it.hasNext()) throw new Error(`Folder not found: "${name}"`);
  return it.next();
}

function getSubFolderByNameOrThrow(parentFolder, subName) {
  const it = parentFolder.getFoldersByName(subName);
  if (!it.hasNext()) throw new Error(`Subfolder not found: "${subName}" inside "${parentFolder.getName()}"`);
  return it.next();
}

function getGoogleSheetByNameOrThrow(folder, fileName) {
  const files = folder.getFilesByType(MimeType.GOOGLE_SHEETS);
  while (files.hasNext()) {
    const f = files.next();
    if (f.getName() === fileName) return f;
  }
  throw new Error(`Google Sheet "${fileName}" not found in folder "${folder.getName()}"`);
}
