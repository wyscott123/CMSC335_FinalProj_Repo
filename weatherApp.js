const path = require("path");
const request = require('request');
const express = require("express"); /* Accessing express module */
const app = express(); /* app is a request handler function */
const bodyParser = require("body-parser"); /* To handle post parameters */
require("dotenv").config({ path: path.resolve(__dirname, 'credentialsDontPost/.env') })
const { MongoClient, ServerApiVersion } = require('mongodb');
const { table } = require("console");
const userName = process.env.MONGO_DB_USERNAME;
const password = process.env.MONGO_DB_PASSWORD;
const databaseAndCollection = { db: process.env.MONGO_DB_NAME, collection: process.env.MONGO_COLLECTION };
const uri = `mongodb+srv://${userName}:${password}@cluster0.pnvigqd.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
const $ = require('jquery');

app.use(bodyParser.urlencoded({ extended: true }));

process.stdin.setEncoding("utf8");
const portNumber = process.argv[2];/*takes in the portNum*/
app.listen(portNumber);
console.log(`Webserver started and running at: http://localhost:${portNumber}`);
const prompt = "Stop to shutdown the server: ";
process.stdout.write(prompt);
process.stdin.on("readable", function () {/*stop function*/
    let dataInput = process.stdin.read();
    if (dataInput !== null) {
        let command = dataInput.trim();
        if (command === "stop") {
            process.stdout.write("Shutting down the server\n");
            client.close();
            process.exit(0);
        } else {
            process.stdout.write("Invalid Command: " + command + "\n");
        }
        process.stdout.write(prompt);
        process.stdin.resume();
    }
});


/*TEMPLATE WORK*/
/* directory where templates will reside */
app.set("views", path.resolve(__dirname, "templates"));
/* view/templating engine */
app.set("view engine", "ejs");

/* ALL THE ROUTES BELOW */

app.get("/", (request, response) => {
    /* Generating the HTML using index template */
    response.render("index");
});

app.get("/weather", (request, response) => {
    response.render("weatherForm", {portNumber:portNumber})
});

app.get("/history", (request, response) => {
    response.render("history", {portNumber:portNumber})
});


//  e/9k+BzpkolTusi8jdQU4g==cVSRjIhblPEMRkKb
app.post("/weatherResults", async (request, response) => {  
    let weatherData = "gotta figure out API";

    //get weather data


    // add to database
    const { city } = request.body;
    const info = {
       city: city,
       weatherData: weatherData
    }

    try {
        client.connect();

        /* Inserting one applicant */
        let weatherInCity = { city: city, weatherData: weatherData};
        client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).insertOne(weatherInCity);

    } catch (e) {
        console.error(e);
    }

    //render new page
  
    const variables = {
        city:city,
        cloud_pct: weatherData.cloud_pct,
        temp: weatherData.temp,
        feels_like: weatherData.feels_like,
        humidity: weatherData.humidity,
        min_temp: weatherData.min_temp,
        max_temp: weatherData.max_temp,
        wind_speed: weatherData.wind_speed,
        wind_degrees: weatherData.wind_degrees,
        sunrise: weatherData.sunrise,
        sunset: weatherData.sunset
    };
      /* Generating the HTML using displayItems template */
      response.render("displayWeather", variables);
  });
