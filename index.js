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
const Logger = require('./services/logger');

const getBlockTransacrions = require('./functions/getBlockTransacrions');
const getPendingSubscription = require('./functions/getPendingSubscription');
const getDataIfLiquidityTransaction = require('./functions/getDataIfLiquidityTransaction');
const getCurrentBlockSubscription = require('./functions/getCurrentBlockSubscription');
const getTransactionStatus = require('./functions/getTransactionStatus');

const Web3 = require('web3');
const logger = new Logger();

const PORT = process.env.PORT || 3000;

// Parsers
hostServer.use(bodyParser.urlencoded({extended: false}));
hostServer.use(bodyParser.json());

// Angular DIST output folder
hostServer.use(express.static(path.join(__dirname, 'client/dist/client')));

hostServer.use(cors());
hostServer.use(express.json({ extended: true }));

hostServer.post('/api/writeLog', (req, res) => {
  try{
    logger.writeLog({header: req.body.header || 'Post request', data: req.body.data}, req.body.type);
    res.status(200).json({ result: 'OK' });
  } catch (e) {
    logger.writeLog({header: 'Write log action failed', data: e});
    res.status(500).json({ result: 'Fail' });
  }
});

hostServer.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/dist/client/index.html'));
});

async function start() {
  const server = http.createServer(hostServer);
  const webSocketServer = new WebSocket.Server({ server });

  webSocketServer.on('connection', ws => {
    ws.on('message', async (m) => {
      ws.send(JSON.stringify('Start watching your request'));
      const messageObject = JSON.parse(m);
      const web3 = new Web3(messageObject.nodeAddress);

      if(messageObject.type == "subscribeLiquidity"){
        toggleSubscribe = true;
        console.log('liquidity', m);

        try {
          getPendingSubscription(web3)
            .on("data", async (txHash) => {
              try {
                const txData = await getDataIfLiquidityTransaction(web3, txHash);

                if(txData?.token == messageObject.tokenAddress){
                  console.log('Have liquid', txData);
                  ws.send(JSON.stringify({type: 'success', hash: txData.hash, gasPrice: txData.gasPrice}));
                }
              } catch (error) {
                ws.send(JSON.stringify({type: 'error', errorType: 'web3backend', value: error}));
              }
            })
        } catch (error) {
          ws.send(JSON.stringify({type: 'error', errorType: 'web3backend', value: error}));
        }
      }

      if(messageObject.type == "subscribeSwap"){
        toggleSubscribe = true;
        console.log('sub', m);
        const { swapHash, liquidityHash } = messageObject;

        try {
          getCurrentBlockSubscription(web3)
            .on("data", ({number}) => {
              getBlockTransacrions(web3, number)
                .then(async (transactions) => {
                  let liquidityTx, swapTx = null;

                  swapTx = transactions.find((tx) => tx.hash == swapHash);
                  liquidityTx = transactions.find((tx) => tx.hash == liquidityHash);

                  const swapStatus = await getTransactionStatus(web3, swapHash);
                  const liquidityStatus = await getTransactionStatus(web3, liquidityHash);

                  if(swapTx && liquidityTx){
                    console.log('Have one', { liquidityTx, swapTx });
                    
                    ws.send(JSON.stringify({
                      type: 'success',
                      swapStatus,
                      liquidityStatus,
                      blockNumber: swapTx.blockNumber }));
                    return;
                  }

                  if(liquidityTx && !swapTx){
                    console.log('Out of liquidity', { liquidityTx });
                    ws.send(JSON.stringify({
                      type: 'fail',
                      swapStatus,
                      liquidityStatus,
                      message: 'Out of liquidity block',
                      blockNumber: liquidityTx.blockNumber
                    }));
                    return;
                  }

                  if(!liquidityTx && swapTx){
                    console.log('Swap failed', { swapTx });
                    ws.send(JSON.stringify({
                      type: 'fail',
                      swapStatus,
                      liquidityStatus,
                      message: 'Swap failed',
                      blockNumber: swapTx.blockNumber
                    }));
                    return;
                  }
                })
                .catch((error) => {
                  ws.send(JSON.stringify({type: 'error', errorType: 'web3backend', value: error}));
                })
            })
            .on('error', error => {throw new Error(error)})
        } catch (error) {
          ws.send(JSON.stringify({type: 'error', errorType: 'web3backend', value: error}));
        }
      }

      if(messageObject.type == "unsubscribe"){
        console.log("unsubscribe");
      }
    });

    ws.on("error", e => ws.send(e));
  });

  return server.listen(PORT, () => console.log(`Running on localhost: ${PORT}`));
}


// ELECTRON APP
// let mainWindow;

// function createWindow () {

//   start();

//   //Create the browser window
//   mainWindow = new BrowserWindow({
//     width: 800,
//     height: 580,
//     resizable: false,
//   });

//   mainWindow.loadURL(`file://${__dirname}/client/dist/client/index.html`);

//   // mainWindow.webContents.openDevTools();

//   mainWindow.on('close', function() {
//       mainWindow = null;
//   });
// }

// app.on('ready', () => {
//   createWindow();
//   logger.writeLog({header: 'Application launch'});
// });
// app.on('window-all-closed', function() {
//   if (process.platform !== 'darwin') {
//       app.quit();
//   }
  
//   logger.writeLog({header: 'Application exit'});
// });

// LOCAL SERVER
// logger.writeLog({header: 'Application launch'});
start();
// // require('./test.js');