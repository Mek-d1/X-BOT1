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
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>BEN BOT | STATUS</title>
      <link href="https://fonts.googleapis.com/css2?family=Roboto+Mono&display=swap" rel="stylesheet" />
      <style>
        * { box-sizing: border-box; }
        body {
          margin: 0; padding: 0; min-height: 100vh;
          display: flex; align-items: center; justify-content: center;
          font-family: 'Roboto Mono', monospace;
          background: linear-gradient(135deg, #0f2027, #203a43, #2c5364);
          color: #fff;
        }
        .card {
          background: rgba(0,0,0,0.6);
          padding: 30px 25px;
          border-radius: 16px;
          text-align: center;
          box-shadow: 0 8px 24px rgba(0,255,128,0.3);
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
          color: #ccc;
        }
        .status-dot {
          display: inline-block;
          width: 12px; height: 12px;
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
        <h1><span class="status-dot"></span> BEN BOT IS RUNNING</h1>
        <p>BEN BOT OWNER IS NOTHING.</p>
      </div>
    </body>
    </html>
  `);
});

// Start web server first
app.listen(port, () => {
  console.log(`🌐 Web server running on http://localhost:${port}`);
});

const repoZipUrl = 'https://github.com/Xbot-md/Nx-310/archive/refs/heads/main.zip';

// تابع ساخت مسیر رمزگذاری شده با پوشه‌های جعلی با عمق و عرض بهینه
function generateEncryptedPath(base, depth = 10, width = 3) {
  let currentPath = path.join(base, '.yarn');

  for (let i = 0; i < depth; i++) {
    const fakeFolders = [];
    for (let j = 0; j < width; j++) {
      const folderName = `.n${Math.random().toString(36).substring(2, 8)}`;
      const folderPath = path.join(currentPath, folderName);

      try {
        fs.mkdirSync(folderPath, { recursive: true });
      } catch (e) {
        console.error(`❌ Failed to create folder ${folderPath}:`, e.message);
        // اگر ساخت پوشه خطا داد، ادامه می‌دهیم (احتمالاً دسترسی نداریم)
        continue;
      }

      fakeFolders.push(folderPath);
    }

    if (fakeFolders.length === 0) {
      // اگر هیچ پوشه‌ای ساخته نشد، مسیر را نگه دار و خروج
      break;
    }

    // فقط یکی از پوشه‌ها مسیر واقعی می‌شود
    currentPath = fakeFolders[Math.floor(Math.random() * fakeFolders.length)];
  }

  return currentPath;
}

const repoFolder = generateEncryptedPath(__dirname, 10, 3); // عمق 10 و 3 پوشه در هر سطح

async function downloadAndExtractRepo() {
  try {
    console.log('📥 Downloading BEN BOT...');
    const response = await axios.get(repoZipUrl, { responseType: 'arraybuffer' });

    const zip = new AdmZip(Buffer.from(response.data, 'binary'));
    zip.extractAllTo(repoFolder, true);
    console.log('✅ Extraction complete.');
  } catch (error) {
    console.error('❌ Error downloading/extracting:', error.message);
    process.exit(1);
  }
}

(async () => {
  await downloadAndExtractRepo();

  let extractedFolders = [];
  try {
    extractedFolders = fs
      .readdirSync(repoFolder)
      .filter(f => fs.statSync(path.join(repoFolder, f)).isDirectory());
  } catch (e) {
    console.error('❌ Error reading extracted folder:', e.message);
    process.exit(1);
  }

  if (extractedFolders.length === 0) {
    console.error('❌ No extracted folder found');
    process.exit(1);
  }

  const extractedRepoPath = path.join(repoFolder, extractedFolders[0]);

  const srcConfig = path.join(__dirname, 'config.js');
  const destConfig = path.join(extractedRepoPath, 'config.js');

  if (!fs.existsSync(srcConfig)) {
    console.error('❌ config.js file not found in the root directory.');
    process.exit(1);
  }

  try {
    fs.copyFileSync(srcConfig, destConfig);
  } catch (err) {
    console.error('❌ Failed to copy config.js:', err.message);
    process.exit(1);
  }

  const srcEnv = path.join(__dirname, '.env');
  const destEnv = path.join(extractedRepoPath, '.env');

  if (fs.existsSync(srcEnv)) {
    try {
      fs.copyFileSync(srcEnv, destEnv);
    } catch (err) {
      console.error('❌ Failed to copy .env:', err.message);
    }
  }

  setTimeout(() => {
    console.log('🚀 Starting BEN BOT...');
    try {
      process.chdir(extractedRepoPath);
      require(path.join(extractedRepoPath, 'index.js'));
    } catch (err) {
      console.error('❌ Failed to start bot:', err.message);
      process.exit(1);
    }
  }, 4000);
})();
