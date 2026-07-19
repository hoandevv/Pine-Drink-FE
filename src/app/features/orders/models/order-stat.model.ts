export interface OrderStat {
  label: string;
  value: string | number;
  change: number;
  icon: string;
  color: 'amber' | 'blue' | 'orange' | 'green' | 'red' | 'gray' | 'pine';
  trend: 'up' | 'down' | 'neutral';
}