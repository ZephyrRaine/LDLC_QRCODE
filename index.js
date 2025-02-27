const express = require('express');
const { createServer } = require('http');
const join = require('path').join;
const { Server } = require("socket.io");
const { generateCode, generateBuffer } = require('./codegenerator');
const db = require('./db');

const fs = require('fs');
const Database = require('./db');


const port = 3000;

//A LECOLE//
// const HOSTNAME = 'http://10.96.16.126:3000';
// const SSID = "L'Ecole LDLC - IoT";
// const PASSWORD = "S5g-Q73!sTz%";

//A LA MAISON//
// const HOSTNAME = `http://192.168.1.183:${port}`;
// const SSID = "SFR_73DF";
// const PASSWORD = "4wit5txt6298i9a4w7px";

//PUTAIN DE TP LINK
const HOSTNAME = `http://192.168.1.100:${port}`;
const SSID = "TP-Link_93EE";
const PASSWORD = "Bioscom20!";

const PHASE = 0;

const names = ['cinema', 'ecole', 'librairie', 'magasin', 'tripadvisor'];

const app = express();
app.use('/assets', express.static('assets'))

const httpServer = createServer(app);
const io = new Server(httpServer);


const categoryWeights = {
  "Data Manipulation": 1,
  "Filtering": 2,
  "Sorting & Grouping": 2,
  "Joins": 3,
  "Aggregate Functions": 3,
  "Comparison Operators": 1,
  "Logical Operators": 2,
  "Arithmetic Operators": 1,
  "Null Checks": 2,
  "Punctuation": 0  // Ignored in scoring
};

const sqlKeywords = [
  {
    category: "Data Manipulation",
    keywords: ["SELECT", "INSERT", "UPDATE", "DELETE"]
  },
  {
    category: "Filtering",
    keywords: ["FROM", "WHERE", "HAVING", "LIKE"]
  },
  {
    category: "Sorting & Grouping",
    keywords: ["ORDER BY", "GROUP BY", "DISTINCT", "AS"]
  },
  {
    category: "Joins",
    keywords: ["JOIN", "ON"]
  },
  {
    category: "Aggregate Functions",
    keywords: ["COUNT", "SUM", "AVG", "MIN", "MAX"]
  },
  {
    category: "Comparison Operators",
    keywords: ["=", "!=", ">", "<", ">=", "<="]
  },
  {
    category: "Logical Operators",
    keywords: ["AND", "OR"]
  },
  {
    category: "Arithmetic Operators",
    keywords: ["+", "-", "*", "/", "%"]
  },
  {
    category: "Null Checks",
    keywords: ["IS NULL", "IS NOT NULL"]
  },
  {
    category: "Punctuation",
    keywords: [";", ".", ",", "(", ")"]
  }
];
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escape special regex characters
}

function getComplexity(query) {
  const presentCategories = new Set();
  const processedQuery = query.toUpperCase().replace(/\s+/g, ' ');

  sqlKeywords.forEach(({ category, keywords }) => {
    keywords.forEach(keyword => {
      const escapedKeyword = escapeRegExp(keyword); // Escape special characters
      const pattern = new RegExp(`\\b${escapedKeyword.replace(/\s+/g, '\\s+')}\\b`, 'gi');
      if (pattern.test(processedQuery)) {
        presentCategories.add(category);
      }
    });
  });

  let totalWeight = 0;
  presentCategories.forEach(category => {
    totalWeight += categoryWeights[category] || 0;
  });

  console.log(totalWeight);

  return totalWeight;
}

function fixEncoding(str) {
  const bytes = new Uint8Array(str.split('').map(c => c.charCodeAt(0)));
  return new TextDecoder('utf-8').decode(bytes);
}

app.get('/solve', (req, res) => {
  res.sendFile(join(__dirname, 'solve.html'));
});

app.get('/', (req, res) => {
  if (!req.query.id) {
    res.sendFile(join(__dirname, 'setup.html'));
  } else {
    res.sendFile(join(__dirname, 'index.html'));
  }
});

io.on('connection', (socket) => {
  console.log('a user connected');
  var database = null;
  var id = null;
  socket.on('connectDB', (msg) => {
    //connect to database
    console.log(msg);
    id = names[msg];
    database = new Database(names[msg]);
  });

  socket.on('execute', (msg) => {
    try {
      //execute SQL request 
      console.log(msg);
      database.execute(msg, function (err, result) {
        if (err) {
          console.log(err);
          socket.emit('error', err.sqlMessage);
        } else {
          console.log(result);
          var r = { dbresult: result, complexity: getComplexity(msg) };
          socket.emit('result', r);
        }
      });
    }
    catch (err) {
      console.error('Error executing query:', err);
      socket.emit('error', err);
    }
  });

  socket.on('save', (msg) => {
    try {

      const path = `out/data-${id}.json`;
      const pathScore = `out/score-${id}.json`;
      //save to file
      console.log(msg);
      if (!fs.existsSync(path))
        fs.writeFileSync(path, JSON.stringify([]));

      if (!fs.existsSync(pathScore))
        fs.writeFileSync(pathScore, "0");


      const data = JSON.parse(fs.readFileSync(path));
      if (data.find(d => d.query == msg.query))
        throw "Query already exists";
      console.log(data);
      msg.complexity = getComplexity(msg.query);

      let score = parseInt(fs.readFileSync
        (pathScore));

      score += msg.complexity;

      fs.writeFileSync
        (pathScore, score.toString());

      data.push(msg);
      fs.writeFileSync(path, JSON.stringify(data, null, 2))
      socket.emit('saved', 'Data saved');
    }
    catch (err) {
      console.error('Error saving data:', err);
      socket.emit('error', err);
    }
  });

  function saveSolve(id, solveId, solveBy, complexity) {
    const path = `out/data-${id}.json`;
    const data = JSON.parse(fs.readFileSync(path));
    if(!data[solveId].solvedBy)
      data[solveId].solvedBy = [];

    data[solveId].solvedBy.push(solveBy);

    fs.writeFileSync(path, JSON.stringify(data, null, 2));

    const pathScore = `out/score-${names[solveBy]}.json`;
    let score = parseInt(fs.readFileSync(pathScore));

    score += data[solveId].complexity;
    fs.writeFileSync(pathScore, score.toString());
  }

  socket.on('checkQuery', (msg) => {
    try {
      //check if query is in database
      console.log(msg);
      const path = `out/data-${id}.json`;
      const data = JSON.parse(fs.readFileSync(path));
      const q = data[msg.solveId];

      if(q.solvedBy && q.solvedBy.includes(msg.solveBy))
      {
        socket.emit('error', 'Query already solved');
        return;
      }

      console.log(q);
      //check if query is identical
      if (q.query == msg.query) {
        socket.emit('correct', 'Correct query');
        saveSolve(id, msg.solveId, msg.solveBy, msg.complexity);
      } 
      //check if results are identical
      else {
        console.log("original results : " + JSON.stringify(q.results));
        console.log("new results : " + JSON.stringify(msg.results));
        if (q.results.length != msg.results.length) {
          socket.emit('error', 'Results are not identical');
        } else {
          var identical = true;
          for (var i = 0; i < q.results.length; i++) {
            if (q.results[i].length != msg.results[i].length) {
              identical = false;
              break;
            }
            for (var j = 0; j < q.results[i].length; j++) {
              if (q.results[i][j] != msg.results[i][j]) {
                identical = false;
                break;
              }
            }
          }
          if (identical) {
            socket.emit('correct', 'Correct results');
            saveSolve(id, msg.solveId, msg.solveBy, msg.complexity);
          } else {
            socket.emit('error', 'Results are not identical');
          }
        }
    }
  }
    catch (err) {
      console.error('Error checking query:', err);
      socket.emit('error', err);
    }});

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

app.get('/get-query', async (req, res) => {
  try {
    const id = req.query.id;
    const path = `out/data-${names[id]}.json`;
    const data = JSON.parse(fs.readFileSync
      (path));
    const query = data[req.query.solveId];
    console.log(query);
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(query, null, 2));
  }
  catch (err) {
    console.error('Error getting data:', err);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/get-all', async (req, res) => {
  try {
    const id = req.query.id;
    const path = `out/data-${names[id]}.json`;
    var data = JSON.parse(fs.readFileSync
      (path));
    res.setHeader('Content-Type', 'application/json');
    data.forEach(q=>{
      q.query = "SECRET";
      if(!q.solvedBy)
        {
          q.solvedBy = [];
        }
      });      
    res.send(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error getting data:', err);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/debug', (req, res) => {
  res.sendFile(join(__dirname, 'debug.html'));
});

//print GET parameters
app.get('/send', async (req, res) => {
  try {
    var data = req.query.data;
    data = fixEncoding(data);

    console.log(data);
    //exemple : <sql,select>, on enlève les chevrons et on split
    data = data.substring(1, data.length - 1);
    var firstCommaIndex = data.indexOf(",");
    var type = data.substring(0, firstCommaIndex);
    var value = data.substring(firstCommaIndex + 1);
    console.log(type);
    console.log(value);
    //send data to client
    console.log("emitting data " + req.query.id);
    io.emit('data ' + req.query.id, { type: type, value: value });
    res.status(200).send("200");
  } catch (err) {
    console.error('Error sending data:', err);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/getID', async (req, res) => {
  try {
    console.log(req.query.id);
    const id = names.indexOf(req.query.id);
    console.log(id);
    res.status(200).send(id.toString());
  } catch (err) {
    console.error('Error sending data:', err);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/get-name', async (req, res) => {
  try {
    console.log(req.query.id);
    const id = req.query.id;
    console.log(id);
    res.status(200).send(names[id]);
  } catch (err) {
    console.error('Error sending data:', err);
    res.status(500).send('Internal Server Error');
  }
});

//generateCode?payload=<URL,http://10.96.16.90/send?id=1>
//generateCode?payload=<WIFI,L'Ecole LDLC - IoT,S5g-Q73!sTz%>

app.get('/wifiImg', async (req, res) => {
  try {
    const key = `*WIFI,${SSID},${PASSWORD}`;
    var qrCodeImage = await generateBuffer(key);
    res.setHeader('Content-Type', 'image/png');
    res.send(qrCodeImage);
  } catch (err) {
    console.error('Error generating QR code:', err);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/urlImg', async (req, res) => {
  try {
    const key = `*URL,${HOSTNAME}/send?id=${names.indexOf(req.query.id)}`;
    console.log(key);
    var qrCodeImage = await generateBuffer(key);
    res.setHeader('Content-Type', 'image/png');
    res.send(qrCodeImage);
  } catch (err) {
    console.error('Error generating QR code:', err);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/generateCode', async (req, res) => {
  try {
    const url = req.query.payload;
    var key = url;
    console.log(key);
    key = key.replaceAll("%27", "'");
    key = key.replaceAll("%20", " ");
    console.log(key);
    var qrCodeImage = await generateCode(key);
    res.setHeader('Content-Type', 'image/png');
    res.send(qrCodeImage);
  } catch (err) {
    console.error('Error generating QR code:', err);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/leaderboard', async (req, res) => {
  res.sendFile(join(__dirname, 'leaderboard.html'));
});

app.get('/get-leaderboard', async (req, res) => {
  try {
    const leaderboard = names.map(name => {
      const scorePath = `out/score-${name}.json`;
      let score = 0;
      if (fs.existsSync(scorePath)) {
        score = parseInt(fs.readFileSync(scorePath));
      }
      return { name, score };
    });

    leaderboard.sort((a, b) => b.score - a.score);

    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(leaderboard, null, 2));
  } catch (err) {
    console.error('Error generating leaderboard:', err);
    res.status(500).send('Internal Server Error');
  }
});

httpServer.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
