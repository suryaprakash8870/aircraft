import React from 'react';
import { Box, Typography, Skeleton } from '@mui/material';
import ReactApexChart from 'react-apexcharts';

const PieChart = ({
  title,
  series = [],
  labels = [],
  height = 300,
  colors = ['#1565C0', '#FF6F00', '#2E7D32', '#0288D1', '#9C27B0', '#00897B'],
  loading = false,
  donut = true,
  tooltipFormatter,
}) => {
  const options = {
    chart: {
      type: donut ? 'donut' : 'pie',
      fontFamily: '"Inter", sans-serif',
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 600,
      },
    },
    colors,
    labels,
    dataLabels: {
      enabled: true,
      formatter: (val) => `${val.toFixed(1)}%`,
      style: {
        fontSize: '12px',
        fontFamily: '"Inter", sans-serif',
        fontWeight: 500,
      },
      dropShadow: { enabled: false },
    },
    plotOptions: {
      pie: {
        donut: {
          size: '70%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total',
              fontSize: '14px',
              fontWeight: 600,
              fontFamily: '"Inter", sans-serif',
              color: '#1A2027',
              formatter: (w) => {
                const total = w.globals.seriesTotals.reduce((a, b) => a + b, 0);
                return tooltipFormatter ? tooltipFormatter(total) : total.toLocaleString('en-IN');
              },
            },
          },
        },
      },
    },
    legend: {
      position: 'bottom',
      fontSize: '12px',
      fontFamily: '"Inter", sans-serif',
      fontWeight: 500,
      labels: { colors: '#637381' },
      markers: { width: 10, height: 10, radius: 2 },
      itemMargin: { horizontal: 8, vertical: 4 },
    },
    tooltip: {
      y: {
        formatter: tooltipFormatter || ((val) => val?.toLocaleString('en-IN')),
      },
      style: { fontFamily: '"Inter", sans-serif', fontSize: '12px' },
    },
    stroke: { width: 2 },
    responsive: [
      {
        breakpoint: 600,
        options: {
          chart: { height: 250 },
          legend: { position: 'bottom' },
        },
      },
    ],
  };

  if (loading) {
    return (
      <Box>
        {title && <Skeleton variant="text" width="40%" height={24} sx={{ mb: 1 }} />}
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Skeleton variant="circular" width={height * 0.7} height={height * 0.7} />
        </Box>
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
        type={donut ? 'donut' : 'pie'}
        height={height}
      />
    </Box>
  );
};

export default PieChart;
