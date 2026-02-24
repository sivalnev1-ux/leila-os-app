
import { Department } from "../types";

const USER_SPECIFIED_FOLDER = '1NoVUjJ-_vH5amQjeWb0tW8V11eIiu5PN';
const TOKEN_STORAGE_KEY = 'leila_drive_oauth_token';
const HARDCODED_TOKEN = '';

export class DriveService {
  private accessToken: string | null = null;

  constructor() {
    // 1. Try storage
    const saved = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (saved) {
      this.accessToken = saved;
      console.log("[DriveService] Restored token from storage");
    } else if (HARDCODED_TOKEN) {
      this.accessToken = HARDCODED_TOKEN;
      localStorage.setItem(TOKEN_STORAGE_KEY, HARDCODED_TOKEN);
      console.log("[DriveService] Used pre-configured token");
    }
  }

  setAccessToken(token: string) {
    this.accessToken = token;
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    console.log("[DriveService] Access Token updated and saved");
  }

  disconnect() {
    this.accessToken = null;
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    console.log("[DriveService] Disconnected and token cleared");
  }

  get hasRealAccess() {
    return !!this.accessToken;
  }

  get currentToken() {
    return this.accessToken || '';
  }

  async verifyConnection(): Promise<{ success: boolean; message: string; user?: string }> {
    if (!this.accessToken) return { success: false, message: "Токен не установлен" };

    try {
      const response = await fetch('https://www.googleapis.com/drive/v3/about?fields=user', {
        headers: { 'Authorization': `Bearer ${this.accessToken}` }
      });

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          message: "Соединение с Google Drive активно!",
          user: data.user.displayName
        };
      } else {
        const err = await response.json();
        if (response.status === 401) {
          this.disconnect();
          return { success: false, message: "Токен истек. Получите новый." };
        }
        return { success: false, message: `Ошибка API: ${err.error?.message || 'Невалидный токен'}` };
      }
    } catch (e) {
      return { success: false, message: "Ошибка сети при проверке токена" };
    }
  }

  async listFiles(query: string, department: Department): Promise<any> {
    if (!this.accessToken) {
      return {
        status: 'error',
        source: 'SYSTEM',
        files: [],
        message: "⛔ Доступ запрещен: Токен Google Drive не настроен. Я не могу искать файлы, пока вы не подключите интеграцию в меню настроек."
      };
    }

    try {
      const q = `name contains '${query}' and trashed = false`;
      const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id, name, mimeType, size, webViewLink)&pageSize=15`;

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${this.accessToken}` }
      });

      if (!response.ok) {
        if (response.status === 401) {
          this.disconnect();
          throw new Error("Token expired");
        }
        throw new Error("API Error");
      }

      const data = await response.json();

      if (!data.files || data.files.length === 0) {
        return {
          status: 'success',
          source: 'REAL_API',
          files: [],
          message: `На Google Диске файлов по запросу "${query}" не найдено.`
        };
      }

      return {
        status: 'success',
        source: 'REAL_API',
        files: data.files.map((f: any) => ({
          ...f,
          size: f.size ? `${(parseInt(f.size) / 1024).toFixed(1)} KB` : 'Folder'
        }))
      };
    } catch (e) {
      return { status: 'error', message: "Ошибка связи с Google Drive. Проверьте токен." };
    }
  }

  async createFile(name: string, mimeType: string, base64Data?: string): Promise<any> {
    if (!this.accessToken) {
      return { status: 'error', message: "Нет доступа к Drive. Не могу создать файл." };
    }

    try {
      let response;
      if (!base64Data) {
        // Basic creation in the user specified folder
        const metadata = {
          name: name,
          mimeType: mimeType,
          parents: [USER_SPECIFIED_FOLDER]
        };

        response = await fetch('https://www.googleapis.com/drive/v3/files', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(metadata)
        });
      } else {
        // Multipart upload logic for saving actual files/images
        const boundary = '-------314159265358979323846';
        const delimiter = "\r\n--" + boundary + "\r\n";
        const close_delim = "\r\n--" + boundary + "--";

        const metadata = {
          name: name,
          mimeType: mimeType,
          parents: [USER_SPECIFIED_FOLDER]
        };

        // Clean up base64 payload if it has data URL prefix
        const base64Content = base64Data.includes('base64,') ? base64Data.split('base64,')[1] : base64Data;

        const multipartRequestBody =
          delimiter +
          'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
          JSON.stringify(metadata) +
          delimiter +
          'Content-Type: ' + mimeType + '\r\n' +
          'Content-Transfer-Encoding: base64\r\n\r\n' +
          base64Content +
          close_delim;

        response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': `multipart/related; boundary=${boundary}`
          },
          body: multipartRequestBody
        });
      }

      if (response.ok) {
        const data = await response.json();
        return { status: 'success', name, id: data.id, message: `Файл "${name}" успешно сохранен на Диске.` };
      } else {
        const err = await response.json();
        return { status: 'error', message: `Ошибка API при создании: ${err.error?.message || response.statusText}` };
      }
    } catch (e) {
      return { status: 'error', message: "Сбой сети при создании файла." };
    }
  }
}

export const driveService = new DriveService();
