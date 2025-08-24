import { format, getWeek, startOfMonth, startOfWeek } from 'date-fns';
import { nb } from 'date-fns/locale';

export type TimePeriod =
  | 'last_7_days'
  | 'last_30_days'
  | 'last_3_months'
  | 'last_6_months'
  | 'last_year'
  | 'this_month'
  | 'this_year'
  | 'custom';

export const TIME_PERIOD_CONFIG = {
  last_7_days: {
    label: 'Siste 7 dager',
    selectLabel: 'Siste 7 dager',
  },
  last_30_days: {
    label: 'Siste 30 dager',
    selectLabel: 'Siste 30 dager',
  },
  last_3_months: {
    label: 'Siste 3 måneder',
    selectLabel: 'Siste 3 måneder',
  },
  last_6_months: {
    label: 'Siste 6 måneder',
    selectLabel: 'Siste 6 måneder',
  },
  last_year: {
    label: 'Siste år',
    selectLabel: 'Siste år',
  },
  this_month: {
    label: 'Denne måneden',
    selectLabel: 'Denne måneden',
  },
  this_year: {
    label: 'Dette året',
    selectLabel: 'Dette året',
  },
  custom: {
    label: 'Egendefinert periode',
    selectLabel: 'Egendefinert',
  },
} as const;

export function getPeriodLabel(period: TimePeriod): string {
  return TIME_PERIOD_CONFIG[period].label;
}

export function getSelectLabel(period: TimePeriod): string {
  return TIME_PERIOD_CONFIG[period].selectLabel;
}

export function getDateFormatter(period: TimePeriod) {
  switch (period) {
    case 'last_7_days':
    case 'last_30_days':
    case 'this_month':
      return (value: string) => {
        const date = new Date(value);
        return date.toLocaleDateString('nb-NO', {
          month: 'short',
          day: 'numeric',
        });
      };
    case 'last_3_months':
    case 'last_6_months':
      return (value: string) => {
        const date = new Date(value);
        const weekNumber = getWeek(date, { locale: nb });
        return `Uke ${weekNumber}`;
      };
    case 'last_year':
    case 'this_year':
      return (value: string) => {
        const date = new Date(value);
        return date.toLocaleDateString('nb-NO', {
          month: 'short',
          year: '2-digit',
        });
      };
    case 'custom':
      return (value: string) => {
        const date = new Date(value);
        return date.toLocaleDateString('nb-NO', {
          month: 'short',
          day: 'numeric',
        });
      };
    default:
      return (value: string) => value;
  }
}

export function getDateGrouper(period: TimePeriod) {
  switch (period) {
    case 'last_7_days':
    case 'last_30_days':
    case 'this_month':
    case 'custom':
      return (date: Date) => format(date, 'yyyy-MM-dd');
    case 'last_3_months':
    case 'last_6_months':
      return (date: Date) => format(startOfWeek(date, { locale: nb }), 'yyyy-MM-dd');
    case 'last_year':
    case 'this_year':
      return (date: Date) => format(startOfMonth(date), 'yyyy-MM-dd');
    default:
      return (date: Date) => format(startOfMonth(date), 'yyyy-MM-dd');
  }
}

export function getTooltipDateFormatter() {
  return (value: string | number | Date) => {
    const date = new Date(value);
    return date.toLocaleDateString('nb-NO', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };
}

export function getAvailableTimePeriods(): Array<{ value: TimePeriod; label: string }> {
  return Object.entries(TIME_PERIOD_CONFIG).map(([key, config]) => ({
    value: key as TimePeriod,
    label: config.selectLabel,
  }));
}