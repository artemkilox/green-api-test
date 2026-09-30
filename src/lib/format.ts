export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

export function toPhoneNumber(value: string): number | null {
  let digits = digitsOnly(value);
  if (digits.startsWith("8") && digits.length === 11) {
    digits = `7${digits.slice(1)}`;
  }
  if (digits.length === 10) {
    digits = `7${digits}`;
  }
  if (digits.length !== 11 && digits.length !== 12) {
    return null;
  }
  return Number(digits);
}

export function formatPhone(value: string): string {
  const digits = digitsOnly(value);
  if (digits.length === 11 && digits.startsWith("7")) {
    return `+7 ${digits.slice(1, 4)} ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9)}`;
  }
  if (digits.startsWith("375") && digits.length === 12) {
    return `+375 ${digits.slice(3, 5)} ${digits.slice(5, 8)}-${digits.slice(8, 10)}-${digits.slice(10)}`;
  }
  return value;
}

export function toMillis(timestamp: number): number {
  return timestamp < 1e12 ? timestamp * 1000 : timestamp;
}

export function formatClock(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatListTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  if (sameDay) {
    return formatClock(timestamp);
  }
  return date.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

export function normalizeApiUrl(value: string): string {
  return value.trim().replace(/\/+$/, "");
}
