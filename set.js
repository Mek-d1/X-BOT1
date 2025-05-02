const fs = require('fs');
const path = require('path');
const axios = require('axios');
const AdmZip = require('adm-zip');
const { spawn } = require('child_process');

// فایل‌ها و پوشه‌هایی که باید وجود داشته باشند
const requiredItems = ['command.js', 'plugins', 'data', 'sessions', 'lib'];

function allRequiredItemsExist() {
  return requiredItems.every(item => fs.existsSync(path.join(__dirname, item)));
}

async function downloadAndExtractZip(zipUrl) {
  const tempZipPath = path.join(__dirname, 'temp.zip');
  const extractPath = path.join(__dirname);

  try {
    // اگر همه فایل‌ها موجود باشند، از دانلود صرف‌نظر کن
    if (allRequiredItemsExist()) {
      console.log("✅ All required files and folders already exist. Skipping download.");
    } else {
      console.log("⬇️ Required files not found. Downloading ZIP...");

      const response = await axios({
        method: 'GET',
        url: zipUrl,
        responseType: 'stream',
      });

      const writer = fs.createWriteStream(tempZipPath);
      response.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

      console.log("✅ ZIP downloaded.");

      const zip = new AdmZip(tempZipPath);
      zip.extractAllTo(extractPath, true);
      console.log("✅ ZIP extracted.");

      fs.unlinkSync(tempZipPath);
      console.log("🗑️ ZIP file deleted.");
    }

    // اجرای فایل index.js
    console.log("🚀 Starting bot...");
    const bot = spawn('node', ['index.js'], {
      stdio: 'inherit',
      cwd: __dirname,
    });

    bot.on('exit', code => {
      console.log(`🔁 Bot exited with code: ${code}`);
    });

  } catch (error) {
    console.error("❌ Error during setup:", error);
  }
}

const zipUrl = 'https://files.catbox.moe/5em8eo.zip'; 
downloadAndExtractZip(zipUrl);
