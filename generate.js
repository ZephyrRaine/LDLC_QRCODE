
var { generateCode } = require("./codegenerator");

async function generatePDF()
{
var data = ["SELECT", "INSERT INTO", "UPDATE", "CONNECT", "DELETE", "JOIN", "WHERE", "AND", "OR"];
console.log(data);
var codes = await Promise.all(data.map(async (d) => {
    return {
        label: d,
        src: `${await generateCode("<SQL_KEYWORD,"+d+">")}`
    };
}));

console.log(codes);
//GENERATE HTML FILE WITH QR CODES NEXT TO LABELS
var fs = require('fs');
var html = '<!DOCTYPE html><html><head><title>QR Codes</title></head><body>';
//ADD STYLE.CSS TO HTML FILE
html += '<link rel="stylesheet" type="text/css" href="style.css">';
html += '<div class="container">';
codes.forEach((c) => {
    html += `<div class="parent">`;
    html += `<img src="${c.src}" alt="${c.label}"/><p>${c.label}</p>`;
    html += `</div>`;
});
html += '</div>';
html += '</body></html>';
fs.writeFileSync('qrcodes.html', html);

}

generatePDF();