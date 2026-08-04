require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const http = require('http');
const https = require('https');
const mongoose = require('mongoose');
const ChildProfile = require('./models/ChildProfile');

const app = express();
const port = process.env.PORT || 3000;
const backendBaseUrl = process.env.BACKEND_URL || 'http://127.0.0.1:8000';
const azureMapsApiKey = process.env.AZURE_MAPS_API_KEY || process.env.PRIMARY_SHARED_KEY || '';
const uploadsDir = path.join(__dirname, 'uploads');

const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (_req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || '';
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({ storage });

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'childSafetyTools')));
app.use(express.static(__dirname));

function requestBackend(pathname, query = {}) {
  const target = new URL(`${backendBaseUrl}${pathname}`);
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      target.searchParams.set(key, value);
    }
  });

  return new Promise((resolve, reject) => {
    const client = target.protocol === 'https:' ? https : http;
    const req = client.get(target, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', reject);
  });
}

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

app.post('/api/children', upload.array('attachments', 10), async (req, res) => {
  try {
    const profile = new ChildProfile({
      name: req.body.name || '',
      dob: req.body.dob || '',
      description: req.body.description || '',
      attachments: (req.files || []).map((file) => ({
        filename: file.filename,
        originalName: file.originalname,
        path: `/uploads/${file.filename}`
      }))
    });

    const savedProfile = await profile.save();
    res.json({ success: true, profile: savedProfile });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Unable to save profile.' });
  }
});

app.get('/api/children', async (_req, res) => {
  try {
    const profiles = await ChildProfile.find().sort({ createdAt: -1 });
    res.json(profiles);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Unable to load profiles.' });
  }
});

app.get('/api/location/resolve', async (req, res) => {
  const city = req.query.city || 'Columbus';
  const state = req.query.state || 'OH';

  try {
    const payload = await requestBackend('/heatmap/overlay', {
      city,
      state,
      radius_km: 8,
      databases: 'Default'
    });

    res.json({
      city,
      state,
      location: payload.location,
      databases: ['Default']
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Backend call failed', details: error.message });
  }
});

app.get('/api/heatmap/overlay', async (req, res) => {
  try {
    const payload = await requestBackend('/heatmap/overlay', {
      city: req.query.city,
      state: req.query.state,
      radius_km: req.query.radius_km || req.query.radiusKm || 8,
      crime_type: req.query.crime_type || 'all',
      databases: req.query.databases || 'Default'
    });

    res.json(payload);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Backend call failed', details: error.message });
  }
});

app.get('/api/config', (_req, res) => {
  res.json({ azureMapsApiKey });
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'childSafetyTools', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
