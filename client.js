// client.js

const { makeWASocket, DisconnectReason, jidDecode, useMultiFileAuthState, Browsers, proto } = require("@whiskeysockets/baileys");
const { Boom } = require("@hapi/boom");
const pino = require("pino");
const { makeInMemoryStore } = require('@whiskeysockets/baileys');
const remoteMessage = require('./remote')

const store = makeInMemoryStore({
  logger: pino().child({
    level: 'silent',
    stream: 'store' 
  })
});

const logger = pino({ level: "silent" });

async function connectToWhatsApp(phoneNumber, useQr = false) {
  const { state, saveCreds } = await useMultiFileAuthState("session");
  const sock = makeWASocket({
    printQRInTerminal: useQr,
    browser: Browsers.windows("Edge"),
    auth: state,
    logger,
    patchMessageBeforeSending: (message) => {
      const requiresPatch = !!(
        message.buttonsMessage ||
        message.templateMessage ||
        message.listMessage
      );
      if (requiresPatch) {
        message = {
          viewOnceMessage: {
            message: {
              messageContextInfo: {
                deviceListMetadataVersion: 2,
                deviceListMetadata: {},
              },
              ...message,
            },
          },
        };
      }
      return message;
    },
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;
    try {
      if (connection === "close") {
        const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
        handleDisconnect(reason);
      } else if (connection === "open") {
        console.log(`\x1b[30;47m[ \x1b[32mINFO\x1b[30;47m ]\x1b[0m Success connected to: ${phoneNumber || "QR login"}`);
      } else if (connection === "connecting") {
        console.log("\x1b[30;47m[ \x1b[33mINFO\x1b[30;47m ]\x1b[0m Connecting...");
      }
    } catch (error) {
      handleError(error);
    }
  });

  sock.ev.on("messages.upsert", async (sockUpdate) => {
    let m = sockUpdate.messages[0];
    await remoteMessage(sockUpdate, m)
    console.log(JSON.stringify(m, undefined, 2))
  });

  return sock;
}

function handleDisconnect(reason) {
    switch (reason) {
      case DisconnectReason.badSession:
        console.log("\x1b[30;47m[ \x1b[31mCRITICAL\x1b[30;47m ]\x1b[0m Bad Session File, Please Delete Session and Scan Again");
        connectToWhatsApp(); 
        break;
      case DisconnectReason.connectionClosed:
        console.log("\x1b[30;47m[ \x1b[33mINFO\x1b[30;47m ]\x1b[0m Connection closed, reconnecting...");
        connectToWhatsApp(); 
        break;
      case DisconnectReason.connectionLost:
        console.log("\x1b[30;47m[ \x1b[33mINFO\x1b[30;47m ]\x1b[0m Connection Lost from Server, reconnecting...");
        connectToWhatsApp(); 
        break;
      case DisconnectReason.loggedOut:
        console.log("\x1b[30;47m[ \x1b[31mCRITICAL\x1b[30;47m ]\x1b[0m Device Logged Out, Please Delete Session and Scan Again.");
        connectToWhatsApp(); 
        break;
      case DisconnectReason.restartRequired:
        console.log("\x1b[30;47m[ \x1b[33mINFO\x1b[30;47m ]\x1b[0m Restart Required, Restarting...");
        connectToWhatsApp(); 
        break;
      case DisconnectReason.timedOut:
        console.log("\x1b[30;47m[ \x1b[33mINFO\x1b[30;47m ]\x1b[0m Connection TimedOut, Reconnecting...");
        connectToWhatsApp(); 
        break;
      default:
        console.log(`\x1b[30;47m[ \x1b[31mCRITICAL\x1b[30;47m ]\x1b[0m Unknown Disconnect Reason: ${reason}`);
        connectToWhatsApp(); 
    }
}

function handleError(error) {
  console.error("\x1b[30;47m[ \x1b[31mCRITICAL\x1b[30;47m ]\x1b[0m Error in connection update:", error);
}

module.exports = {
  connectToWhatsApp
};
