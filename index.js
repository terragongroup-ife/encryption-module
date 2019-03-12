const dotenv = require('dotenv').config();
const EncryptionHelper = require('./app/EncryptionHelper');


const helper = new EncryptionHelper(
    process.env.RABBITMQ_URL, 
    process.env.QUEUE_NAME, 
    process.env.ENCRYPTION_API_URL
)

helper.consumeQueue();
