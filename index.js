require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const http = require('http');
const hostServer = express();
const electron = require('electron');
const { app, BrowserWindow } = electron;
const WebSocket = require("ws");
const getExactTokenLiquidityTransactions = require('./functions/getExactTokenLiquidityTransactions');

const PORT = process.env.PORT || 3000;

const allowCrossDomain = function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');

  // intercept OPTIONS method
  if ('OPTIONS' == req.method) {
    res.send(200);
  }
  else {
    next();
  }
};

// Parsers
hostServer.use(bodyParser.urlencoded({extended: false}));
hostServer.use(bodyParser.json());
hostServer.use(allowCrossDomain);

// Angular DIST output folder
hostServer.use(express.static(path.join(__dirname, 'client/dist/client')));

hostServer.use(cors());
hostServer.use(express.json({ extended: true }));

hostServer.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/dist/client/index.html'));
});

// LOCAL SERVER
// async function start() {
//   try {
//       const server = http.createServer(hostServer);
//       const webSocketServer = new WebSocket.Server({ server });

//       webSocketServer.on('connection', ws => {
//         ws.on('message', async (m) => {
//           ws.send(JSON.stringify('Start watching your request'));
//           const messageObject = JSON.parse(m);
//           switch (messageObject.type){
//             case "subscribeLiquidity":
//               console.log(m);
//               let interval = setInterval( async () => {
//                 getExactTokenLiquidityTransactions(messageObject.tokenAddress, messageObject.nodeAddress)
//                   .then((value) => {
//                     if(value.length){
//                       console.log('Have one');
//                       ws.send(JSON.stringify({type: 'success', value: value[0].hash}));
//                       clearInterval(interval);
//                     }
//                   })
//                   .catch((error) => {
//                     ws.send(JSON.stringify({type: 'error', value: error}));
//                   })
//               }, 2000);
//           }
//         });
    
//         ws.on("error", e => ws.send(e));
//       });
//       server.listen(PORT, () => console.log(`Running on localhost: ${PORT}`));
//   } catch (e) {
//     console.log('Error', e.message);
//     process.exit(1);
//   }
// }

// start();

// // require('./test.js');


// ELECTRON APP
let mainWindow;

function createWindow () {

  const server = http.createServer(hostServer);
  const webSocketServer = new WebSocket.Server({ server });

  webSocketServer.on('connection', ws => {
    ws.on('message', async (m) => {
      ws.send(JSON.stringify('Start watching your request'));
      const messageObject = JSON.parse(m);
      switch (messageObject.type){
        case "subscribeLiquidity":
          console.log(m);
          let interval = setInterval( async () => {
            getExactTokenLiquidityTransactions(messageObject.tokenAddress, messageObject.nodeAddress)
              .then((value) => {
                if(value.length){
                  console.log('Have one');
                  ws.send(JSON.stringify({type: 'success', value: value[0].hash}));
                  clearInterval(interval);
                }
              })
              .catch((error) => {
                ws.send(JSON.stringify({type: 'error', value: error}));
              })
          }, 2000);
      }
    });

    ws.on("error", e => ws.send(e));
  });
  server.listen(PORT, () => console.log(`Running on localhost: ${PORT}`));

    //Create the browser window
    mainWindow = new BrowserWindow({width: 800, height: 580, resizable: false});


    mainWindow.loadURL(`file://${__dirname}/client/dist/client/index.html`);

    // mainWindow.webContents.openDevTools();

    mainWindow.on('close', function() {
        mainWindow = null;
    });
}

app.on('ready', createWindow);
app.on('window-all-closed', function() {
  if (process.platform !== 'darwin') {
      app.quit();
  }
});

