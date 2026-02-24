
import React from 'react';
import {
  Briefcase,
  TrendingUp,
  Calculator,
  Palette,
  Code,
  Megaphone,
  User,
  Globe,
  Lightbulb
} from 'lucide-react';
import { Department, BotMetadata, Assignee } from './types';

// Using a local image file provided by the user for the avatar
export const LEILA_AVATAR_URL = '/leila-avatar.jpg';

export const LINKED_WORKSPACES = [
  { id: '1wTXks-o9O_eI-BHW6B68kUZPon4679sn', label: 'Primary Workspace', type: 'General' },
  { id: '1NoVUjJ-_vH5amQjeWb0tW8V11eIiu5PN', label: 'Inventor Project Data', type: 'Technical' }
];

// Target Spreadsheet for OCR receipts/invoices
export const FINANCE_SPREADSHEET_ID = '1Y79CQpn315bupgAvmg74q3urb1Ax4U0rQwtam4Ddi0U';

export const LEILA_SYSTEM_INSTRUCTION = `
Ты — Лейла, профессиональный личный секретарь и офис-менеджер Сергея.
Местоположение: Израиль, Беэр-Шева (IST/UTC+3).

ТВОЯ МИССИЯ:
Максимально облегчить Сергею управление личными и рабочими делами (Gmail, WhatsApp, Telegram, Google Calendar, Drive, подготовка сценариев звонков на иврите/русском).

ПРАВИЛА ПОВЕДЕНИЯ (СТРОГО):
1. СО МНОЙ (СЕРГЕЙ) ОБЩАЙСЯ ТОЛЬКО НА РУССКОМ ЯЗЫКЕ. Никакого иврита в приветствиях или ответах. Иврит только внутри черновиков для внешних лиц.
2. ЛАКОНИЧНОСТЬ: Пиши строго по делу, без «воды», философии и советов по жизни.
3. ТОН: Сдержанный, профессиональный, уверенный, чуть тёплый.
4. УТОЧНЕНИЯ: Если задача неясна — задай 1–2 коротких вопроса.
5. ПОДТВЕРЖДЕНИЕ: После любого поручения заканчивай ответом:
   ✅ Задача принята: [суть]
   Срок/статус: [когда напомнить / результат]
6. ЧЕСТНОСТЬ: Никогда не придумывай информацию (пароли, контакты, даты). Если данных нет — говори прямо: «Нет данных по этому пункту, уточните пожалуйста».
7. ИНТЕГРАЦИЯ: Используй доступ к Gmail, Calendar и Drive для выполнения задач.
8. ИВРИТ: Черновики для израильтян пиши на иврите с обязательным кратким переводом на русский ниже.
9. ИСПОЛЬЗОВАНИЕ ИНСТРУМЕНТОВ: Не вызывай поиск файлов или другие функции, если пользователь не попросил об этом ЯВНО. На вопросы "Как дела?", "Кто ты?" и обычный диалог отвечай текстом.

ТЕКУЩИЕ РАБОЧИЕ ПРОСТРАНСТВА:
${LINKED_WORKSPACES.map(ws => `- ${ws.label}: ${ws.id}`).join('\n')}
`;

export const TEAM_MEMBERS: Assignee[] = [
  { id: 'sergey', name: 'Сергей', avatarLabel: 'S', color: 'bg-indigo-600' },
  { id: 'leila', name: 'Лейла (AI)', avatarLabel: 'L', color: 'bg-purple-600', avatarUrl: LEILA_AVATAR_URL },
  { id: 'alex', name: 'Алекс (Dev)', avatarLabel: 'A', color: 'bg-orange-600' },
  { id: 'maya', name: 'Майя (Creative)', avatarLabel: 'M', color: 'bg-pink-600' },
];

export const DEPARTMENT_BOTS: BotMetadata[] = [
  {
    id: Department.GENERAL,
    name: 'Лейла (Секретарь)',
    description: 'Основной координатор и офис-менеджер',
    icon: 'User',
    color: 'bg-indigo-500',
    avatarUrl: LEILA_AVATAR_URL
  },
  {
    id: Department.INVENTOR,
    name: 'Inventor Bot',
    description: 'Глубокое R&D мышление и инновации',
    icon: 'Lightbulb',
    color: 'bg-amber-500'
  },
  {
    id: Department.FINANCE,
    name: 'Finance Bot',
    description: 'Инвестиции, крипто и бюджеты',
    icon: 'TrendingUp',
    color: 'bg-emerald-500'
  },
  {
    id: Department.WIX,
    name: 'Wix Bot',
    description: 'Веб-платформы и SEO-оптимизация',
    icon: 'Globe',
    color: 'bg-blue-600'
  },
  {
    id: Department.DEVELOPMENT,
    name: 'Dev Bot',
    description: 'Техническая архитектура и код',
    icon: 'Code',
    color: 'bg-orange-500'
  }
];

export const getBotIcon = (id: string, size = 20) => {
  const bot = DEPARTMENT_BOTS.find(b => b.id === id);
  // Note: We avoid returning an <img> here to prevent refetching/flicker in some contexts,
  // instead allowing the caller to handle avatarUrl logic if available.

  switch (id) {
    case Department.FINANCE: return <TrendingUp size={size} />;
    case Department.ACCOUNTING: return <Calculator size={size} />;
    case Department.CREATIVE: return <Palette size={size} />;
    case Department.DEVELOPMENT: return <Code size={size} />;
    case Department.MARKETING: return <Megaphone size={size} />;
    case Department.WIX: return <Globe size={size} />;
    case Department.INVENTOR: return <Lightbulb size={size} />;
    default: return <User size={size} />;
  }
};
