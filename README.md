# wabot-polosan
Bot polosan (starterpack) buat para sepuh developer

# BUAT YANG BELUM TAU
- **Langkah 1**
Install modul nodejs
```sh
git clone https://github.com/AdjiDev/wabot-polosan && cd wabot-polosan && npm install qrcode-terminal @whiskeysockets/baileys yargs awesome-phonenumber
```
- **LANGKAH 2*
Tutorial cara nyambung ke wangsaff

# VERSI 1 [ connect ke panel ]
> Untuk menyambung ke panel (pairing) edit login.json
```json
{
    "number": 62123456789,
    "useQr": false
}
```
> Untuk menyambung ke panel menggunakan qr
```json
{
    "number": 62123456789,
    "useQr": true
}
```

# VERSI 2 ( BASIS CMD )
> Pairing
```sh
node index.js -p 62xxx
```
> Scan QR
```sh
node index.js -qr
```

`Slesai udah`

# SEKEDAR MENGINGATKAN!
> JIKA NOMOR MU KEBANNED ADMIN WANGSAFF TANGGUNG AKIBATNYA SOAL NYA INI BUKAN API META RESMI OK SEGITU AJA MAAF KURANG JELAS
