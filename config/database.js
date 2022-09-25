var MongoClient = require('mongodb').MongoClient;
require('dotenv').config();
let { mongoUrl } = process.env;
console.log("mongoUrl", mongoUrl);
// Connection URL
var url = mongoUrl;
exports.connection = () => {
    return new Promise(async (resolve, reject) => {
        await MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true }, (err, client) => {
            if (err) console.log("error", err);
            console.log("Database connected");
            var db = client.db('practice');
            resolve(db);
        });
    })
}
// Use connect method to connect to the database
