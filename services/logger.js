const fs = require('fs');
const path = require('path');
const format = require('node.date-time');

class Logger {
  constructor(){
    const fileName = new Date().format('Y-MM-dd');
    const filePath = path.resolve(__dirname, '../logs/', fileName+'.txt'); 

    console.log(fileName, filePath);
    this.logFile = filePath;
    fs.appendFileSync( filePath, '');
    console.log(this.logFile);
  }

  writeLog(message, type = 'info'){
    function wrapData(data){
      return '[' + data + ']';
    }

    const messageTime = wrapData(new Date().format('H:m:SS'));
    const messageType = wrapData(type.toLocaleUpperCase());
    const messageHeader = message.header + '\n';
    const messageData = message.data? JSON.stringify(message.data) + '\n' : null;

    console.log(messageTime, messageType, messageHeader, messageData);

    const messageToLog = [messageTime, messageType, messageHeader].join(' ');
    fs.appendFileSync(this.logFile, messageToLog);

    if(messageData){
      fs.appendFileSync(this.logFile, messageData);
    }
  }
}

module.exports = Logger;