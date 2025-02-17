const qrcode = require('qrcode');

async function generateCode(data) {
    const qrCodeImage = await qrcode.toDataURL(data, { width: 500, errorCorrectionLevel: 'H' });
    return qrCodeImage;
}

module.exports = { generateCode };