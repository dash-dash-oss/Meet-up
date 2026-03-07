import { Box, Typography, Card, Button, Alert, Grid, IconButton } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import cashappLogo from './assets/payment/cashapp.svg';
import paypalLogo from './assets/payment/paypal.svg';
import bitcoinLogo from './assets/payment/bitcoin.svg';
import debitCardLogo from './assets/payment/debit-card.svg';
import stripeLogo from './assets/payment/stripe.svg';

const BOOKING_AMOUNT_MIN = 40;
const BOOKING_AMOUNT_MAX = 1000;

const PaymentMethod = () => {
  const navigate = useNavigate();
  const { state } = useLocation();

  if (!state) {
    return (
      <Typography p={3} color="error">
        Order data not found.
      </Typography>
    );
  }

  const { profile, hours, customer } = state;

  const paymentOptions = [
    {
      key: 'card',
      title: 'Debit/Credit Card',
      desc: 'Pay securely with your card',
      logo: debitCardLogo,
      color: '#667eea',
      available: true,
    },
    {
      key: 'cashapp',
      title: 'CashApp',
      desc: 'Pay with CashApp balance',
      logo: cashappLogo,
      color: '#00d632',
      available: false,
    },
    {
      key: 'paypal',
      title: 'PayPal',
      desc: 'Pay with PayPal',
      logo: paypalLogo,
      color: '#003087',
      available: true,
    },
    {
      key: 'bitcoin',
      title: 'Bitcoin',
      desc: 'Cryptocurrency payment',
      logo: bitcoinLogo,
      color: '#f7931a',
      available: true,
    },
  ];
  
  const getTotal = () => {
    if (!profile || !hours) return 0;
    if (profile.prices && profile.prices[hours]) {
      return profile.prices[hours];
    }
    if (profile.rate) {
      const hourMap = {
        '1 day': profile.rate,
        '2 days': profile.rate * 2,
        '3 days': profile.rate * 3,
        '1 week': profile.rate * 7,
        '1 hour': profile.rate,
        '2 hours': profile.rate * 2,
        '3 hours': profile.rate * 3,
        'overnight': profile.rate * 8,
        'weekend': profile.rate * 24,
        'hour': profile.rate,
        'twoHours': profile.rate * 2,
        'fullNight': profile.rate * 8,
      };
      return hourMap[hours] || profile.rate;
    }
    return 0;
  };
  
  const total = getTotal();

  if (total < BOOKING_AMOUNT_MIN || total > BOOKING_AMOUNT_MAX) {
    return (
      <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Booking amount must be between ${BOOKING_AMOUNT_MIN} and ${BOOKING_AMOUNT_MAX}. Current amount: ${total}.
        </Alert>
        <Button variant="outlined" startIcon={<ArrowBack />} onClick={() => navigate(-1)}>
          Back to Booking
        </Button>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #ffffff 0%, #fdf2f8 50%, #fce7f3 100%)',
        py: { xs: 2.5, sm: 4 },
        px: { xs: 1.5, sm: 2 },
      }}
    >
      <Box sx={{ p: { xs: 1.5, sm: 3 }, maxWidth: 800, mx: 'auto' }}>
      {/* Back Button at Top */}
      <IconButton 
        onClick={() => navigate(-1)} 
        sx={{ mb: 2, bgcolor: '#f3f4f6', '&:hover': { bgcolor: '#e5e7eb' } }}
      >
        <ArrowBack />
      </IconButton>

      <Typography
        fontWeight="bold"
        textAlign="center"
        mb={1}
        sx={{
          fontSize: { xs: '1.6rem', sm: '2.125rem' },
          background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        Select Payment Method
      </Typography>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
          mb: 2.5,
        }}
      >
        <Typography
          variant="caption"
          sx={{
            color: '#6b7280',
            fontWeight: 700,
            letterSpacing: 0.4,
            textTransform: 'uppercase',
          }}
        >
          Powered by
        </Typography>
        <Box
          component="img"
          src={stripeLogo}
          alt="Stripe logo"
          sx={{
            height: 20,
            width: 'auto',
            objectFit: 'contain',
            filter: 'drop-shadow(0 2px 6px rgba(99, 102, 241, 0.25))',
          }}
        />
      </Box>

      {/* Price at Top */}
      <Box 
        sx={{ 
          background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
          color: 'white',
          p: { xs: 1.5, sm: 2 },
          borderRadius: 2, 
          mb: { xs: 2.5, sm: 4 },
          textAlign: 'center',
          boxShadow: '0 8px 24px rgba(236, 72, 153, 0.28)'
        }}
      >
        <Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: 1, opacity: 0.9 }}>
          Total Amount
        </Typography>
        <Typography sx={{ fontSize: { xs: '1.75rem', sm: '2.125rem' }, fontWeight: 800 }}>
          ${total}
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ justifyContent: 'center' }}>
        <Grid item xs={12}>
          {paymentOptions.map((option) => {
            return (
              <Card
                key={option.key}
                sx={{
                  p: { xs: 1.5, sm: 2 },
                  mb: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 1.25,
                  opacity: option.available ? 1 : 0.6,
                  borderRadius: 3,
                  border: '1px solid #f3f4f6',
                  boxShadow: '0 4px 16px rgba(17, 24, 39, 0.06)',
                  textAlign: 'center',
                  '&:hover': { boxShadow: '0 10px 24px rgba(236, 72, 153, 0.16)', borderColor: '#fbcfe8' },
                }}
              >
                <Box
                  sx={{
                    width: { xs: 48, sm: 56 },
                    height: { xs: 48, sm: 56 },
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: '#fff',
                  }}
                >
                  <Box
                    component="img"
                    src={option.logo}
                    alt={`${option.title} logo`}
                    sx={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                    }}
                  />
                </Box>

                <Box sx={{ width: '100%' }}>
                  <Typography fontWeight="bold">{option.title}</Typography>
                  <Typography variant="body2" color="text.secondary">{option.desc}</Typography>
                </Box>

                <Button
                  fullWidth
                  variant="contained"
                  disabled={!option.available}
                  onClick={() => option.available && navigate(`/pay/${option.key}`, { state })}
                  sx={{
                    mt: 0.5,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 700,
                    py: 1.1,
                    bgcolor: option.color,
                    '&:hover': { bgcolor: option.color },
                    '&.Mui-disabled': { bgcolor: '#d1d5db', color: '#6b7280' },
                  }}
                >
                  {option.available ? 'Pay Now' : 'Unavailable'}
                </Button>
              </Card>
            );
          })}
        </Grid>
      </Grid>

      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
        <Button 
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => navigate(-1)}
          sx={{
            width: { xs: '100%', sm: 'auto' },
            borderColor: '#ec4899',
            color: '#db2777',
            '&:hover': { borderColor: '#db2777', backgroundColor: '#fff1f8' },
          }}
        >
          Back to Checkout
        </Button>
      </Box>
      </Box>
    </Box>
  );
};

export default PaymentMethod;
