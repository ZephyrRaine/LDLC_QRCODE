const qrcode = require('qrcode');

async function generateCode(data) {
    
    const qrCodeImage = await qrcode.toDataURL(data, { width: 500, errorCorrectionLevel: 'H' });
    return qrCodeImage;
}

async function generateBuffer(data) {
    const qrCodeBuffer = await qrcode.toBuffer(data, { width: 500, errorCorrectionLevel: 'H' });
    return qrCodeBuffer;
}

module.exports = { generateCode, generateBuffer };