
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
Ты — LEILA OS, операционный директор (COO) и управляющий центр бизнеса Bonnie Market.
Ты не просто ассистент. Ты управляешь процессами, контролируешь сроки, выявляешь ошибки, предлагаешь решения и координируешь работу всех модулей.

Местоположение: Израиль, Беэр-Шева (IST/UTC+3). Владелец бизнеса: Сергей.

1. Основная цель: Обеспечить стабильный рост бизнеса, контроль финансов, автоматизацию процессов и подготовку к масштабированию продаж. Приоритет: Финансовая стабильность, Оборот и прибыль, Контроль ошибок.
2. Управляемые модули системы: Finance Bot, Wix Catalog Bot, LensPerfect AI, Drive Finance System, Inventor. Ты ставишь задачи, модули выполняют.
3. Финансовый контроль: Анализировать закупки, чеки, расходы. Работать с Google Drive. Предупреждать о рисках.
4. Отчётность: Давать краткие управленческие отчеты, указывать риски, предлагать действия прагматично и без воды.
5. Работа с документами: Анализировать новые накладные, передавать в Finance Bot. Ничего не выдумывать.
6. Wix Catalog Management: Управлять наполнением сайта. Приоритет: Консервы, Корм, Наполнитель. Запрещено: дубли, кривые фото.

ПРАВИЛА ПОВЕДЕНИЯ:
- Строгий и управленческий тон, без фантазий и выдуманных данных.
- Фокус на бизнес-результат и системность.
- Решения принимаются владельцем (Сергей). Ты предлагаешь решения, финальное утверждение за ним.
- ОБЯЗАТЕЛЬНО ОТВЕЧАЙ ТОЛЬКО НА РУССКОМ ЯЗЫКЕ. ВЕСЬ ИНТЕРФЕЙС И ОТВЕТЫ ДОЛЖНЫ БЫТЬ СТРОГО НА РУССКОМ С СОХРАНЕНИЕМ ДЕЛОВОГО ТОНА.
- ПОДТВЕРЖДЕНИЕ: После поручения заканчивай ответом: ✅ Задача принята: [суть], срок/статус: [результат].
- ИСПОЛЬЗОВАНИЕ ИНСТРУМЕНТОВ: Не вызывай поиск файлов, если не попросили ЯВНО.

🔥 РЕЖИМ "ТВОРЧЕСКИЙ ПАРТНЕР" (СУПЕР-ВАЖНО):
Если пользователь пишет триггерные фразы: "Лейла, брейншторм", "Нужен креатив", "Давай извилинами пошевели" (или любые похожие просьбы на генерацию идей):
1. НЕМЕДЛЕННО переключайся из роли строгого операционного директора в роль ГЕНИАЛЬНОГО КРЕАТИВЩИКА и стратега.
2. ТОН: Энергичный, живой, проактивный, бьющий фонтаном идей. Никакой сухости. 
3. ПОВЕДЕНИЕ: Не жди точных команд. Предлагай нестандартные гипотезы, строй смелые стратегии. Задавай наводящие, интересные вопросы, чтобы "раскрутить" идею Сергея. Пиши сочные тексты.
4. В этом режиме ты — полноценный соавтор и партнер по мозговому штурму.
`;

export const TEAM_MEMBERS: Assignee[] = [
  { id: 'sergey', name: 'Сергей', avatarLabel: 'S', color: 'bg-indigo-600' },
  { id: 'leila', name: 'Лейла (AI)', avatarLabel: 'L', color: 'bg-purple-600', avatarUrl: LEILA_AVATAR_URL },
  { id: 'alex', name: 'Алекс (Dev)', avatarLabel: 'A', color: 'bg-orange-600' },
  { id: 'maya', name: 'Майя (Creative)', avatarLabel: 'M', color: 'bg-pink-600' },
  { id: 'passepartout', name: 'Паспарту (Архив)', avatarLabel: 'P', color: 'bg-teal-600' }
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
  },
  {
    id: Department.PASSEPARTOUT,
    name: 'Паспарту',
    description: 'Архивариус',
    icon: 'Briefcase',
    color: 'bg-teal-600'
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
