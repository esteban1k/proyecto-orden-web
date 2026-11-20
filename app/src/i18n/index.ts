import messages from "./messages/es-AR.json";

export type MessageKey = keyof typeof messages;

export function t(key: MessageKey): string {
  return messages[key] ?? key;
}

export const locale = "es-AR" as const;