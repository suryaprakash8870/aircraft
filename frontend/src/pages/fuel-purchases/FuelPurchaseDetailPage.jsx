import React, { useEffect } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Chip, Button, Divider, Skeleton,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchFuelPurchaseById, clearCurrentItem } from '../../store/slices/fuelPurchasesSlice';
import { showSnackbar } from '../../store/slices/uiSlice';
import { fuelPurchasesApi } from '../../api/fuelPurchasesApi';
import PageHeader from '../../components/common/PageHeader';
import { formatCurrency, formatLiters, formatDate, getStatusColor, downloadBlob } from '../../utils/helpers';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';

const DetailRow = ({ label, value, highlight }) => (
  <Box sx={{ display: 'flex', py: 1.25, borderBottom: '1px solid', borderColor: 'divider', '&:last-child': { border: 0 } }}>
    <Typography variant="body2" color="text.secondary" sx={{ minWidth: 200, fontWeight: 500 }}>{label}</Typography>
    <Typography variant="body2" fontWeight={highlight ? 700 : 400} color={highlight ? 'primary.main' : 'text.primary'}>{value}</Typography>
  </Box>
);

const FuelPurchaseDetailPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentItem: purchase, loading } = useSelector((s) => s.fuelPurchases);
  const [pdfLoading, setPdfLoading] = React.useState(false);

  useEffect(() => {
    dispatch(fetchFuelPurchaseById(id));
    return () => dispatch(clearCurrentItem());
  }, [id, dispatch]);

  const handleDownloadPdf = async () => {
    setPdfLoading(true);
    try {
      const response = await fuelPurchasesApi.downloadPdf(id);
      downloadBlob(response.data, `purchase-${purchase?.purchase_id || id}.pdf`);
      dispatch(showSnackbar({ message: 'PDF downloaded', severity: 'success' }));
    } catch {
      dispatch(showSnackbar({ message: 'PDF download failed', severity: 'error' }));
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <Box>
      <PageHeader
        title="Purchase Details"
        subtitle={purchase ? `Purchase #${purchase.purchase_id}` : 'Loading...'}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Fuel Purchases', href: '/fuel-purchases' },
          { label: 'Details' },
        ]}
        secondaryAction={{ label: 'Back', icon: <ArrowBackIcon />, onClick: () => navigate('/fuel-purchases'), color: 'inherit' }}
        action={{ label: 'Edit', icon: <EditIcon />, onClick: () => navigate(`/fuel-purchases/${id}/edit`) }}
      />

      <Grid container spacing={2.5}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="subtitle1" fontWeight={700}>Purchase Information</Typography>
                {purchase && (
                  <Chip
                    label={purchase.payment_status || 'pending'}
                    color={getStatusColor(purchase.payment_status)}
                    sx={{ fontWeight: 600, textTransform: 'capitalize' }}
                  />
                )}
              </Box>
              {loading ? (
                [0,1,2,3,4,5].map((i) => <Skeleton key={i} variant="text" height={36} sx={{ mb: 0.5 }} />)
              ) : purchase ? (
                <>
                  <DetailRow label="Purchase ID" value={purchase.purchase_id || '-'} />
                  <DetailRow label="Purchase Date" value={formatDate(purchase.purchase_date)} />
                  <DetailRow label="Fuel Agent" value={purchase.agent_name || '-'} />
                  <DetailRow label="Airport" value={`${purchase.airport_name} (${purchase.airport_code})`} />
                  <DetailRow label="Fuel Type" value={purchase.fuel_type || 'ATF'} />
                  <DetailRow label="Quantity Purchased" value={formatLiters(purchase.quantity_purchased)} />
                  <DetailRow label="Purchase Rate" value={`${formatCurrency(purchase.purchase_rate)} / L`} />
                  <DetailRow label="Total Amount" value={formatCurrency(purchase.total_amount)} highlight />
                  <DetailRow label="Invoice Number" value={purchase.invoice_number || '-'} />
                  <DetailRow label="Remarks" value={purchase.remarks || '-'} />
                </>
              ) : (
                <Typography color="text.secondary">Purchase not found</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Card>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="subtitle1" fontWeight={700} gutterBottom>Actions</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Button
                      fullWidth variant="contained" startIcon={<PictureAsPdfIcon />}
                      onClick={handleDownloadPdf} disabled={pdfLoading} color="secondary"
                    >
                      {pdfLoading ? 'Downloading...' : 'Download PDF'}
                    </Button>
                    <Button
                      fullWidth variant="outlined" startIcon={<EditIcon />}
                      onClick={() => navigate(`/fuel-purchases/${id}/edit`)}
                    >
                      Edit Purchase
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {purchase?.agent_name && (
              <Grid item xs={12}>
                <Card>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="subtitle2" fontWeight={600} color="text.secondary" gutterBottom>
                      Fuel Agent
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>{purchase.agent_name}</Typography>
                    {purchase.agent_company && <Typography variant="caption" color="text.secondary">{purchase.agent_company}</Typography>}
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

export default FuelPurchaseDetailPage;
