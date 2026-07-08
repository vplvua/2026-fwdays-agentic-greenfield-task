import { TicketCategory, TicketPriority, TicketStatus } from './ticket.model';

// Single source of Ukrainian labels for the ticket enums (design D4):
// categories PRD §5.2, priorities §5.3, statuses §5.1. Card and form both
// consume these maps — nothing else translates enum keys.
export const CATEGORY_LABELS: Record<TicketCategory, string> = {
  PLUMBING: 'Сантехніка',
  HEATING: 'Опалення / теплопостачання',
  ELECTRICITY: 'Електропостачання',
  ELEVATOR: 'Ліфт',
  ROOF_FACADE: 'Покрівля та фасад',
  COMMON_AREAS: 'Під’їзд і МЗК',
  GROUNDS: 'Прибудинкова територія / благоустрій',
  ACCESS_SYSTEMS: 'Домофон / шлагбаум / відеоспостереження',
  OTHER: 'Інше',
};

export const PRIORITY_LABELS: Record<TicketPriority, string> = {
  EMERGENCY: 'Аварійна',
  HIGH: 'Висока',
  NORMAL: 'Звичайна',
};

export const STATUS_LABELS: Record<TicketStatus, string> = {
  NEW: 'Нова',
  IN_PROGRESS: 'В роботі',
  DONE: 'Виконана',
  CLOSED: 'Закрита',
  REJECTED: 'Відхилена',
};

interface EnumOption<T extends string> {
  value: T;
  label: string;
}

function toOptions<T extends string>(
  labels: Record<T, string>,
): EnumOption<T>[] {
  return (Object.keys(labels) as T[]).map((value) => ({
    value,
    label: labels[value],
  }));
}

export const CATEGORY_OPTIONS = toOptions(CATEGORY_LABELS);
export const PRIORITY_OPTIONS = toOptions(PRIORITY_LABELS);
