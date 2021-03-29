const format = require('node.date-time');
const logger = require('electron-log')

class Logger {
  constructor(){
    const fileName = new Date().format('Y-MM-dd');
    logger.transports.file.fileName = fileName + '.txt';
    logger.transports.file.format = '{text}';
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

    logger.info(messageToLog, messageData || '');
  }
}

module.exports = Logger;