const QRCode = require('qrcode');
var fs = require('fs');

async function generateCode(payload) {
  return QRCode.toDataURL(payload);
}

async function generatePDF(filePath) {
  // Read and parse JSON data
  const jsonData = fs.readFileSync(filePath+".json", 'utf-8');
  const data = JSON.parse(jsonData);
  const tables = data.filter(item => item.type === 'table');

  let html = `
  <html>
    <head>
      <style>
         @page {
          size: A3;
          margin: 2cm;
          orphans: 4;
          widows: 2;
        }
        body {
          margin: 0;
          font-family: 'Segoe UI', sans-serif;
          font-size: 18px;
        }
        .page {
  page-break-after: always; /* Ensures space after table */
}

        h1 {
          color: #4caf50;
          text-align: left;
          margin: 0 0 1cm 2cm;
          font-size: 52px;
          page-break-after: avoid;
        }
table {
  width: auto; /* Changed from 100% */
  max-width: 90%; /* Prevent tables from becoming too wide */
  margin: 0 0 0 2cm; /* Center the table horizontally */
  border-collapse: collapse;
  table-layout: auto; /* Allows columns to adjust to content */
  page-break-inside: auto;
}
        tr {
          page-break-inside: avoid;
          page-break-after: auto;
        }
          thead {
  display: table-header-group; /* Repeats header on break */
}
        th, td {
          border: 5px solid #ddd;
          padding: 15px;
          text-align: center;
          vertical-align: top;
          color: #f44336;
          page-break-inside: avoid;
            white-space: nowrap; /* Prevent text wrapping */
  padding: 15px 30px; /* Increased horizontal padding */
        }
        th {
          color: #4caf50;
          background-color: #e2e2e2;
          font-size: 36px;
          -webkit-print-color-adjust: exact; /* For Chrome/Safari */
          print-color-adjust: exact; /* Standard property */
        }
        .qr-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          min-height: 200px;
            min-width: 200px;
          page-break-inside: avoid;
        }
        .qr-code {
          width: 120px;
          height: 120px;
          page-break-inside: avoid;
        }
        .cell-content {
          font-size: 32px;
          word-break: break-word;
          margin-bottom: 10px;
        }
        .table-title-qr {
          width: 150px;
          height: 150px;
          margin-top: 10px;
        }
      </style>
    </head>
    <body>
  `;

  for (const table of tables) {
    const tableName = table.name;
    const columns = table.data.length > 0 ? Object.keys(table.data[0]) : [];
    const rows = table.data;

    const tableQr = await generateCode(`<STRUCT_KEYWORD,${tableName}>`);
    const columnQrs = await Promise.all(
      columns.map(col => 
        generateCode(`<STRUCT_KEYWORD,${tableName}.${col}>`)
      )
    );

    const rowsWithQrs = await Promise.all(
      rows.map(async row => {
        const cells = await Promise.all(
          columns.map(async col => {
            const value = row[col];
            const qr = await generateCode(`<VALUE,${value}>`);
            return { value, qr };
          })
        );
        return cells;
      })
    );

    html += `
      <div class="page">
        <h1>
          <span>${tableName}</span>
          <img class="table-title-qr" src="${tableQr}" />
        </h1>
        <table>
          <thead>
            <tr>
              ${columns.map((col, i) => `
                <th>
                  <div class="qr-container">
                    <span class="cell-content">${col}</span>
                    <img class="qr-code" src="${columnQrs[i]}" />
                  </div>
                </th>
              `).join('')}
            </tr>
          </thead>
          <tbody>
            ${rowsWithQrs.map(row => `
              <tr>
                ${row.map(cell => `
                  <td>
                    <div class="qr-container">
                      <span class="cell-content">${cell.value}</span>
                      <img class="qr-code" src="${cell.qr}" />
                    </div>
                  </td>
                `).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  html += '</body></html>';


  fs.writeFileSync(filePath+".html", html);
}

generatePDF('tripadvisor');