export interface SuggestionItem {
  id: string;

  heading?: string;
  body: string;
}

const NUMBERED = /^\*{0,2}(\d+)[.)]\s+(.*?)\*{0,2}$/;
const BULLET = /^[-*]\s+(.*)$/;

export function parseSuggestions(raw: string): SuggestionItem[] {
  const blocks = raw
    .trim()
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  const items: SuggestionItem[] = [];

  for (const block of blocks) {
    const lines = block
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    if (lines.length === 0) continue;

    if (lines.length > 1 && lines.every((line) => BULLET.test(line))) {
      for (const line of lines) {
        const body = line.replace(BULLET, "$1").trim();
        if (body) items.push({ id: `i${items.length}`, body });
      }
      continue;
    }

    const numbered = lines[0].match(NUMBERED);
    if (numbered) {
      items.push({
        id: `i${items.length}`,
        heading: stripEmphasis(numbered[2]),
        body: lines.slice(1).join(" ").trim(),
      });
      continue;
    }

    const bullet = lines[0].match(BULLET);
    if (bullet) {
      items.push({
        id: `i${items.length}`,
        body: [stripEmphasis(bullet[1]), ...lines.slice(1)].join(" ").trim(),
      });
      continue;
    }

    items.push({ id: `i${items.length}`, body: lines.join(" ").trim() });
  }

  return items;
}

function stripEmphasis(text: string): string {
  return text.replace(/\*\*/g, "").trim();
}

export function itemToPlainText(item: SuggestionItem): string {
  return [item.heading, item.body].filter(Boolean).join("\n").replace(/\*\*/g, "").trim();
}

export function emphasisParts(text: string): { text: string; bold: boolean }[] {
  return text
    .split(/(\*\*[^*]+\*\*)/g)
    .filter(Boolean)
    .map((part) =>
      part.startsWith("**") && part.endsWith("**")
        ? { text: part.slice(2, -2), bold: true }
        : { text: part, bold: false },
    );
}
