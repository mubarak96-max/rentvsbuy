// Best-guess housing market from the visitor's time zone. Client-side only.

export const TZ_MARKET: Record<string, string> = {
  'Asia/Dubai': 'uae', 'Asia/Muscat': 'uae', 'Asia/Riyadh': 'saudi-arabia', 'Asia/Kolkata': 'india', 'Asia/Calcutta': 'india',
  'Asia/Singapore': 'singapore', 'Asia/Hong_Kong': 'hong-kong', 'Asia/Tokyo': 'japan', 'Europe/London': 'uk', 'Europe/Dublin': 'ireland',
  'Europe/Berlin': 'germany', 'Europe/Paris': 'france', 'Europe/Madrid': 'spain', 'Europe/Amsterdam': 'netherlands', 'Europe/Zurich': 'switzerland',
  'Europe/Rome': 'italy', 'Europe/Lisbon': 'portugal', 'Europe/Stockholm': 'sweden', 'Africa/Johannesburg': 'south-africa',
  'America/Mexico_City': 'mexico', 'America/Sao_Paulo': 'brazil', 'Pacific/Auckland': 'new-zealand', 'America/New_York': 'us', 'America/Toronto': 'canada',
  'America/Vancouver': 'canada', 'America/Edmonton': 'canada', 'America/Winnipeg': 'canada', 'America/Halifax': 'canada',
};

export function guessMarket(): string | null {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (TZ_MARKET[tz]) return TZ_MARKET[tz];
    if (tz.startsWith('Australia/')) return 'australia';
    if (tz.startsWith('America/')) return 'us';
  } catch { /* ignore */ }
  return null;
}
