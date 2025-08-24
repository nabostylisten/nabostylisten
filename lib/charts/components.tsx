import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CustomDateRange } from './date-utils';
import { TimePeriod, getAvailableTimePeriods } from './time-periods';
import { Margin } from 'recharts/types/util/types';

export interface BaseChartProps {
  isLoading?: boolean;
  onPeriodChange?: (period: TimePeriod, customRange?: CustomDateRange) => void;
  currentPeriod?: TimePeriod;
  showControls?: boolean;
}

interface TimePeriodSelectorProps {
  value: TimePeriod;
  onValueChange: (period: TimePeriod, customRange?: CustomDateRange) => void;
  className?: string;
  customRange?: CustomDateRange;
}

export function TimePeriodSelector({ value, onValueChange, className }: TimePeriodSelectorProps) {
  const periods = getAvailableTimePeriods();

  const handleValueChange = (newPeriod: TimePeriod) => {
    if (newPeriod === 'custom') {
      // For now, we'll skip custom date range implementation
      // Can be added later with a date picker dialog
      return;
    }
    onValueChange(newPeriod);
  };

  return (
    <Select value={value} onValueChange={handleValueChange}>
      <SelectTrigger
        className={`w-[180px] ${className || ''}`}
        aria-label="Velg tidsperiode"
      >
        <SelectValue placeholder="Velg periode" />
      </SelectTrigger>
      <SelectContent>
        {periods
          .filter(p => p.value !== 'custom') // Filter out custom for now
          .map((period) => (
            <SelectItem key={period.value} value={period.value}>
              {period.label}
            </SelectItem>
          ))}
      </SelectContent>
    </Select>
  );
}

export const CHART_MARGINS: Margin = {
  top: 20,
  right: 30,
  left: 20,
  bottom: 5,
};

export const CHART_HEIGHT = 350;