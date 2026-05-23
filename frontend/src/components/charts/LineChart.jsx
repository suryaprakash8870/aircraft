import React from 'react';
import { Box, Typography, Skeleton } from '@mui/material';
import ReactApexChart from 'react-apexcharts';

const LineChart = ({
  title,
  series = [],
  categories = [],
  height = 300,
  colors = ['#1565C0', '#FF6F00', '#2E7D32'],
  loading = false,
  yAxisFormatter,
  tooltipFormatter,
}) => {
  const options = {
    chart: {
      type: 'line',
      toolbar: { show: false },
      zoom: { enabled: false },
      fontFamily: '"Inter", sans-serif',
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 600,
      },
    },
    colors,
    stroke: {
      curve: 'smooth',
      width: 2.5,
    },
    markers: {
      size: 4,
      strokeWidth: 2,
      hover: { size: 6 },
    },
    xaxis: {
      categories,
      labels: {
        style: { colors: '#637381', fontSize: '12px', fontFamily: '"Inter", sans-serif' },
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
      position: 'top',
      horizontalAlign: 'right',
      fontSize: '12px',
      fontFamily: '"Inter", sans-serif',
      fontWeight: 500,
      labels: { colors: '#637381' },
      markers: { width: 10, height: 10, radius: 2 },
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.15,
        opacityTo: 0,
        stops: [0, 100],
      },
    },
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
        type="area"
        height={height}
      />
    </Box>
  );
};

export default LineChart;
