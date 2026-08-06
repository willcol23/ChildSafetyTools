require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const http = require('http');
const https = require('https');

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
app.use(express.static(__dirname));

function requestBackend(pathname, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const body = options.body;
  const headers = options.headers || {};
  const query = options.query || options;
  const target = new URL(`${backendBaseUrl}${pathname}`);

  Object.entries(query).forEach(([key, value]) => {
    if (key !== 'method' && key !== 'body' && key !== 'headers' && key !== 'query' && value !== undefined && value !== null && value !== '') {
      target.searchParams.set(key, value);
    }
  });

  const requestHeaders = { ...headers };
  if (body !== undefined && body !== null) {
    if (!requestHeaders['Content-Type']) {
      requestHeaders['Content-Type'] = 'application/json';
    }
    if (typeof body === 'string' && !requestHeaders['Content-Length']) {
      requestHeaders['Content-Length'] = Buffer.byteLength(body);
    }
  }

  return new Promise((resolve, reject) => {
    const client = target.protocol === 'https:' ? https : http;
    const req = client.request(target, { method, headers: requestHeaders }, (res) => {
      let responseBody = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => (responseBody += chunk));
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 400) {
          reject(new Error(`Backend returned ${res.statusCode}: ${responseBody}`));
          return;
        }

        try {
          resolve(responseBody ? JSON.parse(responseBody) : {});
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', reject);
    if (body !== undefined && body !== null) {
      req.write(body);
    }
    req.end();
  });
}

app.post('/api/children', upload.array('attachments', 10), async (req, res) => {
  try {
    const payload = await requestBackend('/v1/vault/profiles', {
      method: 'POST',
      body: JSON.stringify({
        name: req.body.name || '',
        dob: req.body.dob || '',
        description: req.body.description || '',
        attachments: (req.files || []).map((file) => ({
          name: file.originalname,
          content_type: file.mimetype || 'application/octet-stream',
          url: `/uploads/${file.filename}`
        }))
      })
    });

    res.json({ success: true, profile: payload });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Unable to save profile.' });
  }
});

app.get('/api/children', async (_req, res) => {
  try {
    const profiles = await requestBackend('/v1/vault/profiles');
    res.json(profiles);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Unable to load profiles.' });
  }
});

app.get('/api/safety/heatmaps/overlay', async (req, res) => {
  try {
    const payload = await requestBackend('/v1/heatmaps/overlay', {
      city: req.query.city,
      state: req.query.state,
      radius_km: req.query.radius_km || req.query.radiusKm || 8,
      crime_type: req.query.crime_type || 'all'
    });

    res.json(payload);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Backend call failed', details: error.message });
  }
});

app.get('/api/safety/locations/resolve', async (req, res) => {
  try {
    const payload = await requestBackend('/v1/locations:resolve', {
      city: req.query.city,
      state: req.query.state
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
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
