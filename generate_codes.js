const QRCode = require('qrcode');
const fs = require('fs');


const sqlCategories = {
  "Data Manipulation": ["SELECT", "INSERT", "INTO", "UPDATE", "DELETE"],
  "Filtering": ["FROM", "WHERE", "HAVING", "LIKE"],
  "Sorting & Grouping": ["ORDER BY", "GROUP BY", "DISTINCT", "AS", "ASC", "DESC"],
  "Joins": ["JOIN", "ON"],
  "Date" : ["CURDATE()"],
  "Aggregate Functions": ["COUNT", "SUM", "AVG", "MIN", "MAX"],
  "Comparison Operators": ["=", "!=", ">", "<", ">=", "<="],
  "Logical Operators": ["AND", "OR"],
  "Arithmetic Operators": ["+", "-", "*", "/", "%"],
  "Null Checks": ["IS NULL", "IS NOT NULL"],
  "Punctuation": [";", ".", ",", "(", ")"]
};

async function generateCode(payload) {
  return QRCode.toDataURL(payload);
}

async function generateSQLReference() {
  
  let html = `
  <html>
    <head>
      <style>
        @page {
          size: A3 landscape;
          margin: 2cm;
        }
        
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: #f8f9fa;
          padding: 2rem;
          min-height: 100vh;
        }

        .category {
          page-break-inside: avoid;
          margin-bottom: 2rem;
        }

        .category-title {
          font-size: 1.8rem;
          color: #2c3e50;
          margin-bottom: 1.5rem;
          padding-bottom: 0.5rem;
          border-bottom: 2px solid #2c3e50;
        }

        .grid-container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          page-break-inside: avoid;
        }

        .grid-item {
          background: white;
          border-radius: 10px;
          padding: 1.5rem;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          text-align: center;
          page-break-inside: avoid;
          break-inside: avoid;
        }

        .keyword {
          font-size: 1.4rem;
          color: #2196f3;
          margin-bottom: 1rem;
          font-weight: 600;
        }

        .qr-code {
          width: 150px;
          height: 150px;
          margin: 0 auto;
        }

        .header {
          text-align: center;
          margin-bottom: 2rem;
          padding: 2rem;
          background: #2196f3;
                    -webkit-print-color-adjust: exact; /* For Chrome/Safari */
          print-color-adjust: exact; /* Standard property */
          color: white;
          border-radius: 10px;
        }

        .title {
          font-size: 2.5rem;
          margin-bottom: 1rem;
        }

        .footer {
          text-align: center;
          margin-top: 2rem;
          padding: 1rem;
          color: #7f8c8d;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 class="title">SQL Quick Reference</h1>
      </div>
  `;

  // Generate categories and items
  for (const [category, keywords] of Object.entries(sqlCategories)) {
    const categoryPayload = `<SQL_KEYWORD,CATEGORY_${category.toUpperCase()}>`;
    
    html += `
      <div class="category">
        <div class="category-title">
          ${category}
        </div>
        <div class="grid-container">
    `;

    for (const keyword of keywords) {
      const payload = `<SQL_KEYWORD,${keyword}>`;
      const qrCode = await generateCode(payload);
      
      html += `
        <div class="grid-item">
          <div class="keyword">${keyword}</div>
          <img class="qr-code" src="${qrCode}" />
        </div>
      `;
    }

    html += `
        </div>
      </div>
    `;
  }

  html += `

    </body>
  </html>
  `;

  // Save HTML and generate PDF
  fs.writeFileSync('sql-reference.html', html);
}

generateSQLReference();