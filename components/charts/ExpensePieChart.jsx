// Em components/charts/ExpensePieChart.jsx

"use client";

import { Pie } from 'react-chartjs-2';
import { Chart, ArcElement, Tooltip, Legend } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { useTheme } from 'next-themes';
import EmptyState from '@/components/EmptyState';
import { FaChartPie } from 'react-icons/fa'; 

Chart.register(ArcElement, Tooltip, Legend, ChartDataLabels);

const categoriesLabels = {
  compras_internet: 'Compras (Internet)',
  mercado: 'Mercado',
  assinaturas: 'Assinaturas',
  dividas: 'Dívidas',
  contas_casa: 'Contas da Casa',
  medico_saude: 'Médico/Saúde',
  entretenimento: 'Entretenimento',
  outros: 'Outros',
};

const categoryColors = [
  '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#E7E9ED', '#8D6E63'
];

export default function ExpensePieChart({ expensesData }) {
  const { resolvedTheme } = useTheme();

  if (!expensesData || expensesData.length === 0) {
    return (
      <EmptyState
        icon={<FaChartPie size={24} />}
        title="Sem Despesas"
        message="Não há dados de despesas para exibir no gráfico deste mês."
      />
    );
  }

  const chartData = {
    labels: expensesData.map(item => categoriesLabels[item._id] || item._id),
    datasets: [
      {
        data: expensesData.map(item => item.total),
        backgroundColor: categoryColors.slice(0, expensesData.length),
        hoverBackgroundColor: categoryColors.slice(0, expensesData.length),
        borderColor: '#fff', // Adiciona uma borda branca entre as fatias
        borderWidth: 2,
      },
    ],
  };

  const textColor = resolvedTheme === 'dark' ? '#e5e7eb' : '#4b5563'; // Cor: gray-200 (dark) e gray-600 (light)

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top', // Posição da legenda
        labels: {
          color: textColor,
          font: {
            size: 14,
          }
        },
      },
      datalabels: {
        // Formata o valor para exibir a porcentagem
        formatter: (value, ctx) => {
          const datapoints = ctx.chart.data.datasets[0].data;
          const total = datapoints.reduce((total, datapoint) => total + datapoint, 0);
          const percentage = (value / total) * 100;
          // Só exibe a porcentagem se for maior que 5% para não poluir o gráfico
          return percentage > 5 ? `${percentage.toFixed(1)}%` : '';
        },
        color: '#fff', // Cor do texto da porcentagem
        font: {
          weight: 'bold',
          size: 14,
        },
        // Adiciona uma pequena sombra para melhor legibilidade
        textStrokeColor: 'black',
        textStrokeWidth: 1,
      },
    },
  };

  return <Pie data={chartData} options={chartOptions} />;
}
