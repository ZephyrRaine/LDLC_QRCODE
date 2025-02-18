var { generateCode } = require("./codegenerator");

async function generatePDF(data, prefix, output_file, emoji)
{
console.log(data);
var codes = await Promise.all(data.map(async (d) => {
    return {
        label: d,
        src: `${await generateCode(`<${prefix},${d}>`)}`
    };
}));

console.log(codes);
//GENERATE HTML FILE WITH QR CODES NEXT TO LABELS
var fs = require('fs');
var html = '<!DOCTYPE html><html><head><title>QR Codes</title>';
html += '<link rel="preconnect" href="https://fonts.googleapis.com">';
html += '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>';
html += '<link href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Open+Sans:ital,wght@0,300..800;1,300..800&family=Roboto+Condensed:ital,wght@0,100..900;1,100..900&family=Sono:wght@200..800&display=swap" rel="stylesheet">';
html += '</head><body>';
//ADD STYLE.CSS TO HTML FILE
html += '<link rel="stylesheet" type="text/css" href="style.css">';
html += '<div class="container">';
codes.forEach((c) => {
    html += `<div class="parent">`;
    html += `<img src="${c.src}" alt="${c.label}"/><p>${c.label}</p>`;
    html += `<span class="output-file">${emoji}</span>`;
    html += `</div>`;
});
html += '</div>';
html += '</body></html>';
fs.writeFileSync(output_file+".html", html);

}

// var data = ["SELECT", "INSERT INTO", "UPDATE", "CONNECT", "DELETE", "JOIN", "WHERE", "AND", "OR"];
// generatePDF(data, "SQL_KEYWORD", "qrcodes");

//PARSE data.json and generate QR codes
var fs = require('fs');
var data = JSON.parse(fs.readFileSync('data.json'));
for (var key in data) {
    generatePDF(data[key]["data"], "VALUE", `${key}`, data[key]["emoji"]);
}