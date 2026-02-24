import { driveService } from './driveService';
import { Department } from '../types';

export class SheetsService {
    async appendRow(spreadsheetId: string, values: any[], range: string = 'A1'): Promise<any> {
        const token = driveService.currentToken;
        if (!token) {
            return {
                status: 'error',
                message: "Не установлен токен авторизации. Перейдите в настройки интеграций и подключите Google Диск/Таблицы."
            };
        }

        try {
            // Имя листа или диапазон берется из параметра range
            const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED`;

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    values: [values]
                })
            });

            if (!response.ok) {
                if (response.status === 401) {
                    driveService.disconnect();
                    throw new Error("Token expired");
                }
                const err = await response.json();
                throw new Error(err.error?.message || "API Error");
            }

            const data = await response.json();
            return {
                status: 'success',
                message: `Строка успешно добавлена в таблицу.`,
                data: data
            };
        } catch (e: any) {
            console.error("[SheetsService] Error appending row:", e);
            return {
                status: 'error',
                message: `Ошибка связи с Google Таблицами: ${e.message}`
            };
        }
    }
}

export const sheetsService = new SheetsService();
