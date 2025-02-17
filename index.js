const express = require('express');
const {createServer} = require('http');
const join = require('path').join;
const { Server } = require("socket.io");
const { generateCode } = require('./codegenerator');
const db = require('./db');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

const port = 3000;

app.get('/', (req, res) => {
    res.sendFile(join(__dirname, 'index.html'));
  });

  io.on('connection', (socket) => {
    console.log('a user connected');

    socket.on('execute', (msg) => {
        //execute SQL request 
        console.log(msg);
        db.execute(msg, function(err, result) {
            if (err) {
                console.log(err);
                socket.emit('error', err.sqlMessage);
            } else {
                console.log(result);
                socket.emit('result', result);
            }
      });
    });
    socket.on('disconnect', () => {
      console.log('user disconnected');
    });
  });

//print GET parameters
app.get('/send', async (req, res) => {
    try {
        var data = req.query.data;
        console.log(data);
        //exemple : <sql,select>, on enlève les chevrons et on split
        var type = data.split(",")[0];
        var value = data.split(",")[1];
        console.log(type);
        console.log(value);
        //send data to client
        io.emit('data ' + req.query.id, {type: type, value: value});
        res.send(`ID n°${req.query.id} --- Received --- type: ${type}, value: ${value}`);
    } catch (err) {
      console.error('Error sending data:', err);
      res.status(500).send('Internal Server Error');
    }
  });


//generateCode?payload=<URL,http://10.96.16.90/send?id=1>
//generateCode?payload=<WIFI,L'Ecole LDLC - IoT,S5g-Q73!sTz%>

app.get('/generateCode', async (req, res) => {
    try {
      const url = req.query.payload;
      const key = url;
      var qrCodeImage = await generateCode(key);
      console.log(key);
      res.send(`<img src="${qrCodeImage}" alt="QR Code"/>`);
    } catch (err) {
      console.error('Error generating QR code:', err);
      res.status(500).send('Internal Server Error');
    }
  });

  httpServer.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
