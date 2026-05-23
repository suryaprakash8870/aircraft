import React from 'react';
import { Box, Typography, Skeleton } from '@mui/material';
import ReactApexChart from 'react-apexcharts';

const BarChart = ({
  title,
  series = [],
  categories = [],
  height = 300,
  colors = ['#1565C0', '#FF6F00', '#2E7D32'],
  loading = false,
  horizontal = false,
  stacked = false,
  yAxisFormatter,
  tooltipFormatter,
}) => {
  const options = {
    chart: {
      type: 'bar',
      toolbar: { show: false },
      fontFamily: '"Inter", sans-serif',
      stacked,
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 600,
      },
    },
    colors,
    plotOptions: {
      bar: {
        horizontal,
        borderRadius: horizontal ? 4 : 4,
        columnWidth: '55%',
        barHeight: '60%',
        distributed: series.length === 1,
      },
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories,
      labels: {
        style: { colors: '#637381', fontSize: '12px', fontFamily: '"Inter", sans-serif' },
        rotate: categories.length > 6 ? -30 : 0,
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: {
        style: { colors: '#637381', fontSize: '12px', fontFamily: '"Inter", sans-serif' },
        formatter: yAxisFormatter || ((val) => val?.toLocaleString('en-IN')),
      },
    },
    grid: {
      borderColor: '#E8EDF2',
      strokeDashArray: 4,
      yaxis: { lines: { show: true } },
      xaxis: { lines: { show: false } },
    },
    tooltip: {
      shared: true,
      intersect: false,
      y: {
        formatter: tooltipFormatter || ((val) => val?.toLocaleString('en-IN')),
      },
      style: { fontFamily: '"Inter", sans-serif', fontSize: '12px' },
    },
    legend: {
      show: series.length > 1,
      position: 'top',
      horizontalAlign: 'right',
      fontSize: '12px',
      fontFamily: '"Inter", sans-serif',
      fontWeight: 500,
      labels: { colors: '#637381' },
      markers: { width: 10, height: 10, radius: 2 },
    },
    fill: { opacity: 1 },
    responsive: [
      {
        breakpoint: 600,
        options: {
          chart: { height: 220 },
          legend: { position: 'bottom' },
        },
      },
    ],
  };

  if (loading) {
    return (
      <Box>
        {title && <Skeleton variant="text" width="40%" height={24} sx={{ mb: 1 }} />}
        <Skeleton variant="rectangular" height={height} sx={{ borderRadius: 1 }} />
      </Box>
    );
  }

  return (
    <Box>
      {title && (
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          {title}
        </Typography>
      )}
      <ReactApexChart
        options={options}
        series={series}
        type="bar"
        height={height}
      />
    </Box>
  );
};

export default BarChart;
