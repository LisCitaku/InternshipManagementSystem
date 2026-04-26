import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import type { ChartPoint } from '@/types';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend, Filler);

export function AnalyticsLineChart({ data }: { data: ChartPoint[] }) {
  return (
    <Line
      data={{
        labels: data.map((item) => item.label),
        datasets: [
          {
            label: 'Applications',
            data: data.map((item) => item.value),
            borderColor: '#1d84f3',
            backgroundColor: 'rgba(29, 132, 243, 0.18)',
            fill: true,
            tension: 0.32,
          },
        ],
      }}
      options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }}
    />
  );
}

export function InternshipBarChart({ data }: { data: ChartPoint[] }) {
  return (
    <Bar
      data={{
        labels: data.map((item) => item.label),
        datasets: [
          {
            label: 'Open roles',
            data: data.map((item) => item.value),
            backgroundColor: ['#19b38c', '#1d84f3', '#ef6a4d', '#f5b942', '#1d84f3', '#19b38c', '#ef6a4d'],
            borderRadius: 8,
          },
        ],
      }}
      options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }}
    />
  );
}

export function RoleDistributionChart({ data }: { data: ChartPoint[] }) {
  return (
    <Doughnut
      data={{
        labels: data.map((item) => item.label),
        datasets: [
          {
            data: data.map((item) => item.value),
            backgroundColor: ['#1d84f3', '#19b38c', '#ef6a4d'],
            borderWidth: 0,
          },
        ],
      }}
      options={{ responsive: true, maintainAspectRatio: false }}
    />
  );
}
