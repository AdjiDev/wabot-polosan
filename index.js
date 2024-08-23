const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");
const path = require("path");
const fs = require("fs");
const { connectToWhatsApp } = require("./client");
const { PHONENUMBER_MCC } = require("@whiskeysockets/baileys");

const argv = yargs(hideBin(process.argv))
  .option("pairing", {
    alias: "p",
    type: "string",
    description: "Phone number for pairing",
    demandOption: false,
  })
  .option("qr", {
    alias: "q",
    type: "boolean",
    description: "Login using QR code",
    demandOption: false,
  }).argv;

const loginFilePath = path.join(__dirname, "login.json");
let loginConfig = {};

if (fs.existsSync(loginFilePath)) {
  loginConfig = JSON.parse(fs.readFileSync(loginFilePath, "utf-8"));
}

const useQr = argv.qr || loginConfig.useQr;

const phoneNumber = argv.pairing
  ? argv.pairing.replace(/[^0-9]/g, "")
  : loginConfig.number?.toString().replace(/[^0-9]/g, "");

async function init() {
  if (useQr) {
    console.log("\x1b[32mLogin menggunakan QR code\x1b[0m"); // Green
    await connectToWhatsApp(null, true);
  } else if (phoneNumber) {
    console.log(`\x1b[32mLogin menggunakan nomor telepon:\x1b[0m \x1b[33m${phoneNumber}\x1b[0m`); // Green and Yellow
    const sock = await connectToWhatsApp(phoneNumber, false);

    // Cek apakah nomor sudah terdaftar, jika tidak, minta kode pairing
    if (phoneNumber && !sock.authState.creds.registered) {
      if (!Object.keys(PHONENUMBER_MCC).some((v) => phoneNumber.startsWith(v))) {
        console.log("\x1b[31m-[ SYSTEM ] Nomor telepon tidak valid!, ex: 62812xxxxxx\x1b[0m"); // Red
        process.exit(0);
      }

      setTimeout(async () => {
        try {
          let code = await sock.requestPairingCode(phoneNumber);
          code = code?.match(/.{1,4}/g)?.join("-") || code;
          console.log(`\x1b[36mKode Pairing:\x1b[0m \x1b[33m${code}\x1b[0m`); // Cyan and Yellow
        } catch (err) {
          console.error("\x1b[31mGagal mendapatkan kode pairing:\x1b[0m", err); // Red
        }
      }, 3000);
    } else {
      console.log("\x1b[32mNomor telepon sudah terdaftar\x1b[0m✅."); // Green
    }
  } else {
    console.error("\x1b[31mTidak ada metode login yang valid (nomor telepon atau QR).\x1b[0m"); // Red
    process.exit(1);
  }
}

init();

process.on("SIGINT", () => {
  console.log("\x1b[33mShutting down gracefully...\x1b[0m"); // Yellow
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\x1b[33mShutting down gracefully...\x1b[0m"); // Yellow
  process.exit(0);
});
