// Em components/charts/AnnualSummaryChart.jsx

"use client";

import { Bar } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { useTheme } from 'next-themes';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

Chart.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function AnnualSummaryChart({ reportData }) {
  const { resolvedTheme } = useTheme();

  const textColor = resolvedTheme === 'dark' ? '#e5e7eb' : '#4b5563';
  const gridColor = resolvedTheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

  const chartData = {
    labels: reportData.map(d => format(new Date(2000, d.month - 1, 1), 'MMM', { locale: ptBR })),
    datasets: [
      {
        label: 'Rendas',
        data: reportData.map(d => d.income),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
      },
      {
        label: 'Despesas',
        data: reportData.map(d => d.expense),
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: textColor, font: { size: 14 } } },
    },
    scales: {
      y: { beginAtZero: true, ticks: { color: textColor }, grid: { color: gridColor } },
      x: { ticks: { color: textColor }, grid: { color: gridColor } },
    },
  };

  return <Bar data={chartData} options={chartOptions} />;
}
