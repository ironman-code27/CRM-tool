import type { Lead } from '../types/Lead';

export function initials(l: Lead): string {
  return (((l.fname || '')[0] || '').toUpperCase() + ((l.lname || '')[0] || '').toUpperCase());
}

export function fullName(l: Lead): string {
  return `${l.fname} ${l.lname}`.trim();
}

export function nameInitials(n: string): string {
  return n
    .split(' ')
    .map((w) => w[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
}

export function channelLabel(ch: string): string {
  const m: Record<string, string> = {
    linkedin: '💼 LinkedIn',
    email: '✉️ Email',
    phone: '📞 Phone',
    event: '🤝 In-person',
  };
  return m[ch] || ch;
}

export function avatarColor(id: string, team: any[], colors: string[]): string {
  const m = team.find((t) => t.id === id || t.name === id);
  if (m) return m.color;
  const idx = Math.abs(id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % colors.length;
  return colors[idx];
}
