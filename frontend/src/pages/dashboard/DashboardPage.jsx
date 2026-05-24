import React, { useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  LinearProgress,
  Skeleton,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchDashboardStats,
  fetchDashboardCharts,
  fetchRecentTransactions,
} from '../../store/slices/dashboardSlice';
import StatCard from '../../components/common/StatCard';
import LineChart from '../../components/charts/LineChart';
import BarChart from '../../components/charts/BarChart';
import PieChart from '../../components/charts/PieChart';
import {
  formatCurrency,
  formatLiters,
  formatDateTime,
  getStockLevelColor,
  getStockPercentage,
} from '../../utils/helpers';
import InventoryIcon from '@mui/icons-material/Inventory';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import AirplanemodeActiveIcon from '@mui/icons-material/AirplanemodeActive';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';

const typeChipProps = {
  purchase: { label: 'Purchase', color: 'success' },
  filling: { label: 'Filling', color: 'primary' },
  adjustment: { label: 'Adjustment', color: 'warning' },
};

const AirportStockCard = ({ stock }) => {
  const pct = getStockPercentage(stock.current_stock, stock.fuel_storage_capacity);
  const color = getStockLevelColor(stock.current_stock, stock.fuel_storage_capacity);
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 1.5,
              bgcolor: 'rgba(21, 101, 192, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <FlightTakeoffIcon sx={{ fontSize: 18, color: 'primary.main' }} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight={600} noWrap>
              {stock.airport_name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {stock.airport_code}
            </Typography>
          </Box>
        </Box>
        <LinearProgress
          variant="determinate"
          value={pct}
          color={color}
          sx={{ mb: 1, height: 6, borderRadius: 3 }}
        />
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="caption" color="text.secondary">
            {formatLiters(stock.current_stock)}
          </Typography>
          <Typography variant="caption" color="text.secondary" fontWeight={500}>
            {pct.toFixed(0)}%
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {formatLiters(stock.fuel_storage_capacity)}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

const DashboardPage = () => {
  const dispatch = useDispatch();
  const { stats, charts, recentTransactions, loading, chartsLoading, transactionsLoading } =
    useSelector((state) => state.dashboard);

  useEffect(() => {
    dispatch(fetchDashboardStats());
    dispatch(fetchDashboardCharts());
    dispatch(fetchRecentTransactions());
  }, [dispatch]);

  // Prepare chart data
  const purchaseSeries = charts.monthlyPurchase
    ? [{ name: 'Fuel Purchased (L)', data: charts.monthlyPurchase.values || [] }]
    : [{ name: 'Fuel Purchased (L)', data: [12000, 19000, 14000, 21000, 17000, 23000, 18000, 25000, 20000, 28000, 22000, 30000] }];

  const purchaseCategories = charts.monthlyPurchase?.labels ||
    ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const consumptionSeries = charts.monthlyConsumption
    ? [{ name: 'Fuel Consumed (L)', data: charts.monthlyConsumption.values || [] }]
    : [{ name: 'Fuel Consumed (L)', data: [10000, 16000, 12000, 18000, 15000, 20000, 16000, 22000, 18000, 24000, 19000, 26000] }];

  const consumptionCategories = charts.monthlyConsumption?.labels || purchaseCategories;

  const vendorSeries = charts.vendorAnalytics?.values || [35, 25, 20, 12, 8];
  const vendorLabels = charts.vendorAnalytics?.labels || ['BPCL', 'HPCL', 'IOC', 'Shell', 'Others'];

  const airportUsageSeries = charts.airportUsage
    ? [{ name: 'Fuel Used (L)', data: charts.airportUsage.values || [] }]
    : [{ name: 'Fuel Used (L)', data: [45000, 38000, 29000, 22000, 18000] }];
  const airportUsageCategories = charts.airportUsage?.labels || ['DEL', 'BOM', 'BLR', 'HYD', 'MAA'];

  const airportStocks = stats.airportStocks || [];

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Dashboard</Typography>
        <Typography variant="body2" color="text.secondary">
          Aviation Fuel Management Overview
        </Typography>
      </Box>

      {/* Airport Stock Cards */}
      {(loading || airportStocks.length > 0) && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" fontWeight={600} sx={{ mb: 1.5, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem' }}>
            Airport Fuel Levels
          </Typography>
          <Grid container spacing={2}>
            {loading
              ? [0, 1, 2, 3].map((i) => (
                  <Grid item xs={12} sm={6} md={3} key={i}>
                    <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 2 }} />
                  </Grid>
                ))
              : airportStocks.map((stock) => (
                  <Grid item xs={12} sm={6} md={3} key={stock.airport_id}>
                    <AirportStockCard stock={stock} />
                  </Grid>
                ))}
          </Grid>
        </Box>
      )}

      {/* Stat Cards Row */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Fuel Stock"
            value={loading ? '...' : formatLiters(stats.totalFuelStock)}
            icon={InventoryIcon}
            color="primary"
            trend={stats.stockTrend}
            subtitle="across all airports"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Purchased This Month"
            value={loading ? '...' : formatCurrency(stats.purchasedThisMonth)}
            icon={ShoppingCartIcon}
            color="success"
            trend={stats.purchaseTrend}
            subtitle="fuel purchases"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Consumed This Month"
            value={loading ? '...' : formatLiters(stats.consumedThisMonth)}
            icon={LocalGasStationIcon}
            color="warning"
            trend={stats.consumptionTrend}
            subtitle="aircraft fillings"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Fueled"
            value={loading ? '...' : formatLiters(stats.totalFueled)}
            icon={AirplanemodeActiveIcon}
            color="secondary"
            trend={stats.fueledTrend}
            subtitle="all time"
            loading={loading}
          />
        </Grid>
      </Grid>

      {/* Charts Row 1 */}
      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        <Grid item xs={12} md={7}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Monthly Fuel Purchase Trends
              </Typography>
              <LineChart
                series={purchaseSeries}
                categories={purchaseCategories}
                height={280}
                colors={['#1565C0']}
                loading={chartsLoading}
                yAxisFormatter={(val) => `${(val / 1000).toFixed(0)}k L`}
                tooltipFormatter={(val) => `${val?.toLocaleString('en-IN')} L`}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={5}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Fuel Consumption Trends
              </Typography>
              <BarChart
                series={consumptionSeries}
                categories={consumptionCategories}
                height={280}
                colors={['#FF6F00']}
                loading={chartsLoading}
                yAxisFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                tooltipFormatter={(val) => `${val?.toLocaleString('en-IN')} L`}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Row 2 */}
      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        <Grid item xs={12} md={5}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Vendor Analytics
              </Typography>
              <PieChart
                series={vendorSeries}
                labels={vendorLabels}
                height={280}
                colors={['#1565C0', '#FF6F00', '#2E7D32', '#0288D1', '#9C27B0']}
                loading={chartsLoading}
                tooltipFormatter={(val) => `${val?.toLocaleString('en-IN')} L`}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={7}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Airport Fuel Usage
              </Typography>
              <BarChart
                series={airportUsageSeries}
                categories={airportUsageCategories}
                height={280}
                colors={['#1565C0', '#FF6F00', '#2E7D32', '#0288D1', '#9C27B0']}
                loading={chartsLoading}
                tooltipFormatter={(val) => `${val?.toLocaleString('en-IN')} L`}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Transactions */}
      <Card>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Recent Transactions
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>Date/Time</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>Airport</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>Reference</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>Quantity</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>Amount</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactionsLoading
                  ? [0, 1, 2, 3, 4].map((i) => (
                      <TableRow key={i}>
                        {[0, 1, 2, 3, 4, 5].map((j) => (
                          <TableCell key={j}><Skeleton variant="text" /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  : recentTransactions.length === 0
                  ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                          No recent transactions
                        </TableCell>
                      </TableRow>
                    )
                  : recentTransactions.slice(0, 10).map((tx, idx) => {
                      const chipConfig = typeChipProps[tx.type] || { label: tx.type, color: 'default' };
                      return (
                        <TableRow key={tx.id || idx} hover sx={{ '&:last-child td': { border: 0 } }}>
                          <TableCell sx={{ fontSize: '0.8125rem' }}>{formatDateTime(tx.date)}</TableCell>
                          <TableCell>
                            <Chip label={chipConfig.label} color={chipConfig.color} size="small" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600 }} />
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.8125rem' }}>{tx.airport || '-'}</TableCell>
                          <TableCell sx={{ fontSize: '0.8125rem', color: 'text.secondary' }}>{tx.reference || '-'}</TableCell>
                          <TableCell align="right" sx={{ fontSize: '0.8125rem', fontWeight: 500 }}>{formatLiters(tx.quantity)}</TableCell>
                          <TableCell align="right" sx={{ fontSize: '0.8125rem', fontWeight: 600, color: tx.type === 'purchase' ? 'success.main' : 'primary.main' }}>
                            {formatCurrency(tx.amount)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default DashboardPage;
