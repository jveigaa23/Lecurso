/** Enumerações compartilhadas entre banco, validação e interface (sem dependências). */
export const COURSE_LEVELS = ["iniciante", "intermediario", "avancado", "todos"] as const;
export const COURSE_FORMATS = ["online", "presencial", "hibrido"] as const;
export const ADMIN_ROLES = ["owner", "editor"] as const;
export const PAYMENT_STATUSES = ["pending", "approved", "refunded", "cancelled", "chargeback"] as const;
export const CURRENCIES = ["BRL", "USD", "EUR"] as const;

export type CourseLevel = (typeof COURSE_LEVELS)[number];
export type CourseFormat = (typeof COURSE_FORMATS)[number];
export type AdminRole = (typeof ADMIN_ROLES)[number];
