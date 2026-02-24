export type PeriodType = 'week' | 'month' | 'quarter' | 'semi' | 'year';

export const PERIOD_LABELS: Record<PeriodType, string> = {
  week: 'Week',
  month: 'Month',
  quarter: 'Quarter',
  semi: '6 Months',
  year: 'Year',
};

function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function getPeriodDateRange(period: PeriodType): { start: string; end: string } {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  let start: Date;

  switch (period) {
    case 'week': {
      start = getStartOfWeek(now);
      break;
    }
    case 'month': {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    }
    case 'quarter': {
      const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
      start = new Date(now.getFullYear(), quarterMonth, 1);
      break;
    }
    case 'semi': {
      const semiMonth = now.getMonth() < 6 ? 0 : 6;
      start = new Date(now.getFullYear(), semiMonth, 1);
      break;
    }
    case 'year': {
      start = new Date(now.getFullYear(), 0, 1);
      break;
    }
    default:
      start = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  start.setHours(0, 0, 0, 0);
  return { start: toDateStr(start), end: toDateStr(end) };
}

export function isDateInRange(dateStr: string, start: string, end: string): boolean {
  return dateStr >= start && dateStr <= end;
}
