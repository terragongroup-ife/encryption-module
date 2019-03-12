const fs = require("fs");
const rabbit = require("amqplib");
const readline = require("readline");
const axios = require("axios");
const path = require("path");

class EncryptionHelper {
  constructor(queueURL, queueName, encryptionEndpoint) {
    this.queueURL = queueURL;
    this.queueName = queueName;
    this.encryptionEndpoint = encryptionEndpoint;
  }

  consumeQueue() {
  
    rabbit.connect(this.queueURL).then(connection => {
      connection.createChannel().then(channel => {
        channel.assertQueue(this.queueName, { durable: true }).then(ok => {
          //Using the get method
          setInterval(() => {
            channel.get(this.queueName, {}).then(messageObject => {

              if (messageObject !== false) {
                
                let queueData = JSON.parse(messageObject.content.toString());
                let fullFilePath = queueData.file_path;
                
                let fileName = path.basename(fullFilePath);
                let filePath = path.dirname(fullFilePath);
                let outputFilePath = filePath + "/_encrypt_" + fileName;
               
                this.encryptFileContents(fullFilePath, outputFilePath);
                console.log("Done with file");
                channel.ack(messageObject);
              }
              
            });
          }, 1000);
        });
      });
    });
  }

  encryptFileContents(inputFilePath, outputFilePath) {
    const rl = readline.createInterface({
      input: fs.createReadStream(inputFilePath),
      output: fs.createWriteStream(outputFilePath)
    });

    rl.on("line", line => {
      var value = JSON.parse(line);
      axios
        .get(this.encryptionEndpoint, {
          params: {
            msisdn: value.msisdn
          }
        })
        .then(function(response) {
          if (!response.data.error) {
            let newValue = {
              ...value,
              msisdn: response.data.response.encrypted
            };
            rl.output.write(JSON.stringify(newValue) + "\n");
            console.log("Written to file");
          }
        });
    });

    rl.on("close", function() {
      //save the output file with and close
      console.log("Done");
    });
  }
}


module.exports = EncryptionHelper;
