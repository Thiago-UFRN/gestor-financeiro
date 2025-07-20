// Em components/charts/SavingsLineChart.jsx

"use client";

import { Line } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { useTheme } from 'next-themes';
import EmptyState from '@/components/EmptyState';
import { FaChartLine } from 'react-icons/fa';
import { format } from 'date-fns';

Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

export default function SavingsLineChart({ evolutionData }) {
  const { resolvedTheme } = useTheme();

  if (!evolutionData || evolutionData.length < 2) {
    return (
      <EmptyState
        icon={<FaChartLine size={24} />}
        title="Dados Insuficientes"
        message="É necessário pelo menos dois registros de reserva para exibir a evolução."
      />
    );
  }

  const textColor = resolvedTheme === 'dark' ? '#e5e7eb' : '#4b5563';
  const gridColor = resolvedTheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
  const pointColor = '#14b8a6'; // Teal-500
  const lineColor = '#14b8a6';
  const areaColor = 'rgba(20, 184, 166, 0.2)';

  const chartData = {
    labels: evolutionData.map(item => format(new Date(item.date), 'dd/MM/yy')),
    datasets: [
      {
        label: 'Total Acumulado',
        data: evolutionData.map(item => item.total),
        fill: true,
        backgroundColor: areaColor,
        borderColor: lineColor,
        pointBackgroundColor: pointColor,
        tension: 0.1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: textColor, font: { size: 14 } }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { color: textColor },
        grid: { color: gridColor },
      },
      x: {
        ticks: { color: textColor },
        grid: { color: gridColor },
      },
    },
  };

  return <Line data={chartData} options={chartOptions} />;
}
