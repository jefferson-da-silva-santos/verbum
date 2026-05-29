/**
 * VERBUM — Utils: validations
 *
 * Schemas de validação Zod para todos os formulários do app.
 * Centralizar aqui evita duplicação de regras entre telas.
 *
 * Uso:
 *   const result = registerSchema.safeParse({ name, email });
 *   if (!result.success) {
 *     const errors = result.error.flatten().fieldErrors;
 *   }
 */

import { z } from "zod";

// ─────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────

export const registerSchema = z.object({
  name: z
    .string()
    .min(2, "O nome deve ter pelo menos 2 caracteres.")
    .max(80, "O nome não pode ultrapassar 80 caracteres.")
    .trim(),

  email: z
    .string()
    .email("Informe um e-mail válido.")
    .max(120, "E-mail muito longo.")
    .toLowerCase()
    .trim(),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email("Informe um e-mail válido.").toLowerCase().trim(),
});

export type LoginInput = z.infer<typeof loginSchema>;

// ─────────────────────────────────────────────
// PLANO DE LEITURA
// ─────────────────────────────────────────────

export const createPlanBaseSchema = z.object({
  name: z
    .string()
    .min(2, "O nome do plano deve ter pelo menos 2 caracteres.")
    .max(80, "Nome muito longo.")
    .trim(),

  bookSlugs: z.array(z.string()).min(1, "Selecione pelo menos um livro."),

  skipWeekdays: z
    .array(z.number().int().min(0).max(6))
    .max(6, "Pelo menos um dia da semana deve ser ativo.")
    .default([]),
});

export const chaptersModeSchema = createPlanBaseSchema.extend({
  mode: z.literal("chapters"),
  chaptersPerDay: z
    .number()
    .int()
    .min(1, "Mínimo de 1 capítulo por dia.")
    .max(50, "Máximo de 50 capítulos por dia."),
});

export const timeModeSchema = createPlanBaseSchema.extend({
  mode: z.literal("time"),
  minutesPerDay: z
    .number()
    .min(2, "Mínimo de 2 minutos por dia.")
    .max(480, "Máximo de 8 horas por dia."),
});

export const deadlineModeSchema = createPlanBaseSchema.extend({
  mode: z.literal("deadline"),
  targetDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida. Use o formato AAAA-MM-DD."),
});

export const createPlanSchema = z.discriminatedUnion("mode", [
  chaptersModeSchema,
  timeModeSchema,
  deadlineModeSchema,
]);

export type CreatePlanInput = z.infer<typeof createPlanSchema>;

// ─────────────────────────────────────────────
// ANOTAÇÕES
// ─────────────────────────────────────────────

export const noteSchema = z.object({
  content: z
    .string()
    .min(1, "A anotação não pode estar vazia.")
    .max(5000, "Anotação muito longa (máximo: 5.000 caracteres).")
    .trim(),

  type: z.enum(["reflexao", "interpretacao", "revelacao", "aplicacao"]),

  bookSlug: z.string().min(1),
  chapterNumber: z.number().int().min(1),
  verseNumber: z.number().int().min(1).optional(),
});

export type NoteInput = z.infer<typeof noteSchema>;

// ─────────────────────────────────────────────
// DIÁRIO ESPIRITUAL
// ─────────────────────────────────────────────

export const diaryEntrySchema = z.object({
  title: z.string().max(200, "Título muito longo.").trim().optional(),

  content: z
    .string()
    .min(1, "O diário não pode estar vazio.")
    .max(20000, "Entrada muito longa (máximo: 20.000 caracteres).")
    .trim(),

  mood: z
    .enum(["gratidao", "oracao", "reflexao", "testemunho", "pedido"])
    .optional(),

  entryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida."),
});

export type DiaryEntryInput = z.infer<typeof diaryEntrySchema>;

// ─────────────────────────────────────────────
// PERFIL DO USUÁRIO
// ─────────────────────────────────────────────

export const updateProfileSchema = z.object({
  name: z
    .string()
    .min(2, "O nome deve ter pelo menos 2 caracteres.")
    .max(80)
    .trim()
    .optional(),

  preferredVersion: z.enum(["acf", "nvi", "ara", "naa"]).optional(),

  avgReadingSpeed: z
    .number()
    .min(0.5, "Velocidade muito baixa.")
    .max(30, "Velocidade muito alta.")
    .optional(),

  fontScale: z
    .number()
    .refine((v) => [0.85, 1.0, 1.15, 1.3].includes(v), "Escala inválida.")
    .optional(),

  darkModePreference: z.enum(["light", "dark", "system"]).optional(),

  notificationsEnabled: z.boolean().optional(),

  reminderTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Horário inválido. Use HH:MM.")
    .optional()
    .nullable(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

// ─────────────────────────────────────────────
// HELPER DE FORMATAÇÃO DE ERROS
// ─────────────────────────────────────────────

/**
 * Extrai a primeira mensagem de erro de um ZodError por campo.
 * Útil para exibir erros inline nos inputs.
 *
 * @example
 *   const result = schema.safeParse(data);
 *   if (!result.success) {
 *     const errors = extractFieldErrors(result.error);
 *     // { name: 'O nome deve ter pelo menos 2 caracteres.' }
 *   }
 */
export function extractFieldErrors(error: z.ZodError): Record<string, string> {
  const flat = error.flatten().fieldErrors;
  const result: Record<string, string> = {};
  for (const [key, messages] of Object.entries(flat)) {
    if (messages && messages.length > 0) {
      result[key] = messages[0];
    }
  }
  return result;
}
