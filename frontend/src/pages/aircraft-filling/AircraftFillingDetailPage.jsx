import React, { useEffect } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Button, Skeleton, Divider, Chip,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchAircraftFillingById, clearCurrentItem } from '../../store/slices/aircraftFillingSlice';
import { showSnackbar } from '../../store/slices/uiSlice';
import { aircraftFillingApi } from '../../api/aircraftFillingApi';
import PageHeader from '../../components/common/PageHeader';
import { formatCurrency, formatLiters, formatDateTime, downloadBlob } from '../../utils/helpers';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import AirplanemodeActiveIcon from '@mui/icons-material/AirplanemodeActive';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';

const DetailRow = ({ label, value, highlight }) => (
  <Box sx={{ display: 'flex', py: 1.25, borderBottom: '1px solid', borderColor: 'divider', '&:last-child': { border: 0 } }}>
    <Typography variant="body2" color="text.secondary" sx={{ minWidth: 200, fontWeight: 500 }}>{label}</Typography>
    <Typography variant="body2" fontWeight={highlight ? 700 : 400} color={highlight ? 'primary.main' : 'text.primary'}>{value}</Typography>
  </Box>
);

const AircraftFillingDetailPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentItem: record, loading } = useSelector((s) => s.aircraftFilling);
  const [pdfLoading, setPdfLoading] = React.useState(false);

  useEffect(() => {
    dispatch(fetchAircraftFillingById(id));
    return () => dispatch(clearCurrentItem());
  }, [id, dispatch]);

  const handleDownloadPdf = async () => {
    setPdfLoading(true);
    try {
      const response = await aircraftFillingApi.downloadPdf(id);
      downloadBlob(response.data, `filling-receipt-${record?.filling_id || id}.pdf`);
      dispatch(showSnackbar({ message: 'Receipt downloaded', severity: 'success' }));
    } catch {
      dispatch(showSnackbar({ message: 'Download failed', severity: 'error' }));
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <Box>
      <PageHeader
        title="Filling Receipt"
        subtitle={record ? `Record #${record.filling_id}` : 'Loading...'}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Aircraft Filling', href: '/aircraft-filling' },
          { label: 'Details' },
        ]}
        secondaryAction={{ label: 'Back', icon: <ArrowBackIcon />, onClick: () => navigate('/aircraft-filling'), color: 'inherit' }}
        action={{ label: 'Edit', icon: <EditIcon />, onClick: () => navigate(`/aircraft-filling/${id}/edit`) }}
      />

      <Grid container spacing={2.5}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3, pb: 2, borderBottom: '2px solid', borderColor: 'primary.main' }}>
                <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: 'rgba(21,101,192,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <LocalGasStationIcon sx={{ color: 'primary.main', fontSize: 28 }} />
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight={700}>Fuel Filling Receipt</Typography>
                  <Typography variant="caption" color="text.secondary">AeroFuel Management System</Typography>
                </Box>
              </Box>

              {loading ? (
                [0,1,2,3,4,5,6].map((i) => <Skeleton key={i} variant="text" height={36} sx={{ mb: 0.5 }} />)
              ) : record ? (
                <>
                  <DetailRow label="Filling ID" value={record.filling_id || '-'} />
                  <DetailRow label="Date & Time" value={formatDateTime(record.filling_datetime)} />
                  <DetailRow label="Aircraft" value={`${record.aircraft_number} ${record.aircraft_model ? `(${record.aircraft_model})` : ''}`} />
                  <DetailRow label="Airline" value={record.airline_name || '-'} />
                  <DetailRow label="Airport" value={`${record.airport_name} (${record.airport_code})`} />
                  <DetailRow label="Flight Number" value={record.flight_number || '-'} />
                  <DetailRow label="Fuel Quantity" value={formatLiters(record.fuel_quantity)} />
                  <DetailRow label="Fuel Rate per Liter" value={formatCurrency(record.fuel_rate)} />
                  <DetailRow label="Total Cost" value={formatCurrency(record.total_cost)} highlight />
                  <DetailRow label="Operator" value={record.operator_name || '-'} />
                  <DetailRow label="Remarks" value={record.remarks || '-'} />
                </>
              ) : (
                <Typography color="text.secondary">Record not found</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>Actions</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Button
                  fullWidth variant="contained" startIcon={<PictureAsPdfIcon />}
                  onClick={handleDownloadPdf} disabled={pdfLoading} color="secondary"
                >
                  {pdfLoading ? 'Downloading...' : 'Download Receipt PDF'}
                </Button>
                <Button
                  fullWidth variant="outlined" startIcon={<EditIcon />}
                  onClick={() => navigate(`/aircraft-filling/${id}/edit`)}
                >
                  Edit Record
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AircraftFillingDetailPage;
