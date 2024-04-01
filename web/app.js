const express = require('express');
const path = require('path');
const app = express();
const port = 8080;
const bodyParser = require("body-parser");
const {PubSub} = require("@google-cloud/pubsub");

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

const pubsub_topic = "travel_deals_signup";

// ROUTES
app.get('/', (req, res) => {
    //res.status(200).send('Hello, world!');
    res.sendFile(path.join(__dirname, '/public/index.html'));
});

app.post("/subscribe", async (req, res) => {
    const email = req.body.email_address;
    const regions = req.body.watch_region;
    const pubSubClient = new PubSub();

    const messageData = JSON.stringify({
        email_address: email,
        watch_regions: regions
    });

    const dataBuffer = Buffer.from(messageData);
    const messageID = await pubSubClient
        .topic(pubsub_topic)
        .publishMessage({data: dataBuffer});

    console.log(`Message ${messageID} published.`);

    res.status(200).send(`Thanks for signing up!<br/>Message ID: ${messageID}`);``
});

app.listen(port, () => {
  console.log(`TravelDeals Web App listening on port ${port}`);
});