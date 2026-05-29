/**
 * VERBUM — Utils: exportUtils
 *
 * Exportação de anotações, destaques e devocionais nos formatos
 * Markdown e texto plano. A geração de PDF usa expo-print em cima
 * do HTML gerado aqui.
 *
 * Dependências necessárias (instalar quando implementar):
 *   expo-print, expo-sharing, expo-file-system
 */

import type { Note, Highlight, DiaryEntry } from "../database/types";
import { formatShortDate } from "./dateUtils";
import { NOTE_TYPE_LABELS, DIARY_MOOD_LABELS } from "./formatters";

// ─────────────────────────────────────────────
// MARKDOWN EXPORT
// ─────────────────────────────────────────────

/**
 * Exporta anotações como documento Markdown estruturado.
 *
 * Formato:
 *   # Minhas Anotações — Verbum
 *   ## Gênesis 1:1
 *   **Reflexão** · 15 jan. 2025
 *   Texto da anotação...
 */
export function exportNotesAsMarkdown(notes: Note[]): string {
  if (notes.length === 0)
    return "# Minhas Anotações — Verbum\n\n*Nenhuma anotação encontrada.*";

  const lines: string[] = [
    "# Minhas Anotações — Verbum",
    "",
    `*Exportado em ${formatShortDate(new Date().toISOString().slice(0, 10))}*`,
    `*Total: ${notes.length} anotaçõe${notes.length !== 1 ? "s" : ""}*`,
    "",
    "---",
    "",
  ];

  // Agrupar por livro + capítulo
  const grouped = new Map<string, Note[]>();
  for (const note of notes) {
    const key = `${note.bookSlug}-${note.chapterNumber}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(note);
  }

  for (const [, groupNotes] of grouped) {
    const first = groupNotes[0];
    const ref = first.verseNumber
      ? `${first.bookSlug.toUpperCase()} ${first.chapterNumber}:${first.verseNumber}`
      : `${first.bookSlug.toUpperCase()} ${first.chapterNumber}`;

    lines.push(`## ${ref}`, "");

    for (const note of groupNotes) {
      const label = NOTE_TYPE_LABELS[note.type] ?? note.type;
      const date = formatShortDate(note.createdAt.slice(0, 10));

      lines.push(`**${label}** · *${date}*`);
      lines.push("");
      lines.push(note.content);
      lines.push("");
      lines.push("---");
      lines.push("");
    }
  }

  return lines.join("\n");
}

/**
 * Exporta destaques como documento Markdown.
 */
export function exportHighlightsAsMarkdown(highlights: Highlight[]): string {
  if (highlights.length === 0) {
    return "# Meus Destaques — Verbum\n\n*Nenhum destaque encontrado.*";
  }

  const EMOJI: Record<string, string> = {
    yellow: "⭐",
    red: "🔴",
    blue: "🔵",
    green: "🟢",
  };

  const TAG_LABEL: Record<string, string> = {
    promessa: "Promessa",
    alerta: "Alerta",
    doutrina: "Doutrina",
    esperanca: "Esperança",
  };

  const lines: string[] = [
    "# Meus Destaques — Verbum",
    "",
    `*Exportado em ${formatShortDate(new Date().toISOString().slice(0, 10))}*`,
    `*Total: ${highlights.length} destaque${highlights.length !== 1 ? "s" : ""}*`,
    "",
    "---",
    "",
  ];

  for (const h of highlights) {
    const ref = `${h.bookSlug.toUpperCase()} ${h.chapterNumber}:${h.verseNumber}`;
    const emoji = EMOJI[h.color] ?? "📌";
    const tag = TAG_LABEL[h.tag] ?? h.tag;

    lines.push(`${emoji} **${ref}** — *${tag}*`);
    lines.push("");
    lines.push(`> ${h.verseText}`);
    lines.push("");
  }

  return lines.join("\n");
}

/**
 * Exporta entradas do diário como Markdown.
 */
export function exportDiaryAsMarkdown(entries: DiaryEntry[]): string {
  if (entries.length === 0) {
    return "# Diário Espiritual — Verbum\n\n*Nenhuma entrada encontrada.*";
  }

  const lines: string[] = [
    "# Diário Espiritual — Verbum",
    "",
    `*Exportado em ${formatShortDate(new Date().toISOString().slice(0, 10))}*`,
    `*Total: ${entries.length} entrada${entries.length !== 1 ? "s" : ""}*`,
    "",
    "---",
    "",
  ];

  for (const entry of entries) {
    const date = formatShortDate(entry.entryDate);
    const mood = entry.mood ? DIARY_MOOD_LABELS[entry.mood] : "";

    lines.push(`## ${date}${mood ? " · " + mood : ""}`);

    if (entry.title) {
      lines.push("");
      lines.push(`### ${entry.title}`);
    }

    lines.push("");
    lines.push(entry.content);
    lines.push("");
    lines.push("---");
    lines.push("");
  }

  return lines.join("\n");
}

// ─────────────────────────────────────────────
// HTML PARA PDF
// ─────────────────────────────────────────────

/**
 * Gera HTML estilizado para exportação em PDF via expo-print.
 * O CSS é inline para compatibilidade máxima.
 */
export function notesToHtml(notes: Note[], userName?: string): string {
  const date = formatShortDate(new Date().toISOString().slice(0, 10));

  const noteItems = notes
    .map((note) => {
      const ref = note.verseNumber
        ? `${note.bookSlug.toUpperCase()} ${note.chapterNumber}:${note.verseNumber}`
        : `${note.bookSlug.toUpperCase()} ${note.chapterNumber}`;
      const label = NOTE_TYPE_LABELS[note.type] ?? note.type;
      const noteDate = formatShortDate(note.createdAt.slice(0, 10));

      return `
      <div style="margin-bottom:24px;padding:16px;border-left:3px solid #8B6340;background:#F7F1E3;">
        <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
          <strong style="color:#4A2C1A;">${ref}</strong>
          <span style="font-size:12px;color:#8B6340;">${label} · ${noteDate}</span>
        </div>
        <p style="margin:0;color:#2C1810;line-height:1.7;font-family:Georgia,serif;">${note.content.replace(/\n/g, "<br>")}</p>
      </div>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Minhas Anotações — Verbum</title>
</head>
<body style="font-family:system-ui,-apple-system,sans-serif;max-width:680px;margin:0 auto;padding:32px;background:#FAF6EE;color:#2C1810;">
  <h1 style="font-family:Georgia,serif;color:#4A2C1A;border-bottom:2px solid #C4975A;padding-bottom:12px;">
    Minhas Anotações
  </h1>
  <p style="color:#8B6340;margin-bottom:32px;">
    ${userName ? `${userName} · ` : ""}Exportado em ${date} via Verbum
  </p>
  ${noteItems}
  <footer style="margin-top:48px;text-align:center;color:#C4975A;font-size:12px;">
    Verbum — A Palavra
  </footer>
</body>
</html>`;
}

// ─────────────────────────────────────────────
// COMPARTILHAMENTO DE VERSÍCULO
// ─────────────────────────────────────────────

/**
 * Formata um versículo para compartilhamento via Share API do React Native.
 *
 * @example
 *   "João 3:16\n\nPorque Deus amou o mundo...\n\n— via Verbum"
 */
export function formatVerseForSharing(reference: string, text: string): string {
  return `${reference}\n\n"${text}"\n\n— via Verbum`;
}

/**
 * Trunca um versículo para uso em notificações e previews.
 */
export function truncateVerseForPreview(
  text: string,
  maxLength: number = 100,
): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 1).trimEnd() + "…";
}
