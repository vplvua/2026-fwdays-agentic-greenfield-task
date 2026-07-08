// Enum keys mirror the API/Prisma enums (english on the wire, S-02 D6);
// Ukrainian labels live in ticket-labels.ts only.
export type TicketCategory =
  | 'PLUMBING'
  | 'HEATING'
  | 'ELECTRICITY'
  | 'ELEVATOR'
  | 'ROOF_FACADE'
  | 'COMMON_AREAS'
  | 'GROUNDS'
  | 'ACCESS_SYSTEMS'
  | 'OTHER';

export type TicketPriority = 'EMERGENCY' | 'HIGH' | 'NORMAL';

export type TicketStatus =
  'NEW' | 'IN_PROGRESS' | 'DONE' | 'CLOSED' | 'REJECTED';

// The writable FR-TICKET-01 fields — what create/edit send to the API
export interface TicketInput {
  title: string;
  description: string | null;
  houseId: number;
  category: TicketCategory;
  priority: TicketPriority;
  requesterName: string | null;
  requesterPhone: string | null;
  executor: string | null;
  dueDate: string | null; // YYYY-MM-DD or null to clear (FR-DUE-01)
}

// What the API answers with: the writable fields plus server-owned ones
export interface TicketDto extends TicketInput {
  id: number; // doubles as the human-visible number #N (FR-TICKET-02)
  houseName: string;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
}

// Field limits mirror the API validation (tickets.service.ts)
export const TICKET_TITLE_MAX = 255;
export const TICKET_DESCRIPTION_MAX = 10_000;
export const TICKET_REQUESTER_NAME_MAX = 255;
export const TICKET_REQUESTER_PHONE_MAX = 32;
export const TICKET_EXECUTOR_MAX = 255;

// The due date is a calendar date: convert between the datepicker's local
// Date and the YYYY-MM-DD wire format without UTC round-trips (design D5) —
// toISOString() would shift the day for timezones east of UTC.
export function toWireDate(date: Date | null): string | null {
  if (!date) return null;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function fromWireDate(value: string | null): Date | null {
  if (!value) return null;
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// Mirror of the API error contract (api: ticket-errors.ts).
// The API is locale-free; Ukrainian copy lives here.
type TicketErrorCode =
  | 'TICKET_TITLE_INVALID'
  | 'TICKET_DESCRIPTION_INVALID'
  | 'TICKET_CATEGORY_INVALID'
  | 'TICKET_PRIORITY_INVALID'
  | 'TICKET_REQUESTER_INVALID'
  | 'TICKET_EXECUTOR_INVALID'
  | 'TICKET_DUE_DATE_INVALID'
  | 'TICKET_HOUSE_INVALID'
  | 'TICKET_HOUSE_NOT_FOUND'
  | 'TICKET_NOT_FOUND';

const MESSAGES: Record<TicketErrorCode, string> = {
  TICKET_TITLE_INVALID: 'Вкажіть назву заявки',
  TICKET_DESCRIPTION_INVALID: 'Опис задовгий — до 10 000 символів',
  TICKET_CATEGORY_INVALID: 'Оберіть категорію зі списку',
  TICKET_PRIORITY_INVALID: 'Оберіть пріоритет зі списку',
  TICKET_REQUESTER_INVALID: 'Поле заявника задовге',
  TICKET_EXECUTOR_INVALID: 'Поле виконавця задовге',
  TICKET_DUE_DATE_INVALID: 'Невірна дата цільового терміну',
  TICKET_HOUSE_INVALID: 'Оберіть будинок зі списку',
  TICKET_HOUSE_NOT_FOUND: 'Будинок не знайдено',
  TICKET_NOT_FOUND: 'Заявку не знайдено',
};

const FALLBACK_MESSAGE = 'Щось пішло не так. Спробуйте ще раз';

export function ticketErrorMessage(error: unknown): string {
  const code = (error as { error?: { code?: string } })?.error?.code;
  return MESSAGES[code as TicketErrorCode] ?? FALLBACK_MESSAGE;
}
