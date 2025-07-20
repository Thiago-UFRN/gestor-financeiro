// Em components/charts/SummaryBarChart.jsx

"use client";

import { Bar } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { useTheme } from 'next-themes';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import EmptyState from '@/components/EmptyState';
import { FaChartBar } from 'react-icons/fa';

Chart.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ChartDataLabels);

export default function SummaryBarChart({ income, expenses }) {
  const { resolvedTheme } = useTheme();

  if (income === 0 && expenses === 0) {
    return (
       <EmptyState
        icon={<FaChartBar size={24} />}
        title="Sem Movimentações"
        message="Não há rendas ou despesas registradas para este mês."
      />
    )
  }

  const chartData = {
    labels: ['Resumo do Mês'],
    datasets: [
      {
        label: 'Rendas',
        data: [income],
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
      {
        label: 'Despesas',
        data: [expenses],
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
      },
    ],
  };

  const textColor = resolvedTheme === 'dark' ? '#e5e7eb' : '#4b5563';
  const gridColor = resolvedTheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
  const dataLabelColor = resolvedTheme === 'dark' ? '#f9fafb' : '#696468ff'; // cinza-50 (dark), cinza-700 (light)

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: textColor,
          font: { size: 14 }
        }
      },
      datalabels: {
        display: true,
        color: dataLabelColor, // Cor para o texto dentro das barras
        anchor: 'center', // Posição da "âncora" do rótulo
        align: 'center',  // Alinhamento do texto
        font: {
            weight: 'bold',
        },
        // Formata o número como moeda BRL e não exibe se for 0
        formatter: (value) => {
            if (value === 0) return '';
            return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(value);
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { color: textColor },
        grid: { color: gridColor }
      },
      x: {
        ticks: { color: textColor },
        grid: { color: gridColor }
      }
    },
  };

  return <Bar data={chartData} options={chartOptions} />;
}
