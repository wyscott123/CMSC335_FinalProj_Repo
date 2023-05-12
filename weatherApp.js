
const path = require("path");
const requester = require('request');
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
/*const $ = require('jquery');*/

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
    response.render("weatherForm", { portNumber: portNumber })
});


  
app.get("/history", async (request, response) => {
    try {
      await client.connect();
  
      const filter = {};
      const cursor = client
        .db(databaseAndCollection.db)
        .collection(databaseAndCollection.collection)
        .find(filter);
  
      const result = await cursor.toArray();
      const numResults = result.length;
  
      const htmlString = generateHistoryHTML(result);
      const variables = {
        portNumber: portNumber,
        htmlString: htmlString,
      };
  
      response.render("history", variables);
    } catch (error) {
      console.error(error);
      response.status(500).send("Internal Server Error");
    } 
  });
  


app.post("/weather", async (request, response) => {
    const { city } = request.body;

    requester({
        url: 'https://api.api-ninjas.com/v1/weather?city=' + city,
        headers: {
            'X-Api-Key': 'e/9k+BzpkolTusi8jdQU4g==cVSRjIhblPEMRkKb'
        },
    }, async function (error, apiResponse, body) {
        if (error)
            return console.error('Request failed:', error);
        else if (apiResponse.statusCode != 200)
            return console.error('Error:', apiResponse.statusCode, body.toString('utf8'));
        else {
            const weatherData = JSON.parse(body);
            // weatherData Correct here
            //console.log(weatherData);
            //console.log(weatherData.cloud_pct);
            const variables = {
                city: city,
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
            try {
                await client.connect();
                /* Inserting one applicant */
                let weatherInCity = { city: city, weatherData: weatherData };
                client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).insertOne(weatherInCity);
        
            } catch (e) {
                console.error(e);
            }
        
            response.render("displayWeather", variables);
        }
    });
});



function generateHistoryHTML(result) {
    let htmlString = '';
    result = result.reverse() // for recents on top

    if (result.length === 0) {
      htmlString += '<p>No weather data available.</p>';
    } else {
      for (let i = 0; i < result.length; i++) {
        const object = result[i]
        const entry = result[i].weatherData;
  
        htmlString += `
          <h2>City: ${object.city}</h2>
          <table>
            <tr>
              <th>Cloud Coverage</th>
              <td>${entry.cloud_pct}</td>
            </tr>
            <tr>
              <th>Temperature</th>
              <td>${entry.temp}&deg;C</td>
            </tr>
            <tr>
              <th>Feels Like</th>
              <td>${entry.feels_like}&deg;C</td>
            </tr>
            <tr>
              <th>Humidity</th>
              <td>${entry.humidity}%</td>
            </tr>
            <tr>
              <th>Min Temperature</th>
              <td>${entry.min_temp}&deg;C</td>
            </tr>
            <tr>
              <th>Max Temperature</th>
              <td>${entry.max_temp}&deg;C</td>
            </tr>
            <tr>
              <th>Wind Speed</th>
              <td>${entry.wind_speed} m/s</td>
            </tr>
            <tr>
              <th>Wind Direction</th>
              <td>${entry.wind_degrees}&deg;</td>
            </tr>
            <tr>
              <th>Sunrise</th>
              <td>${entry.sunrise}</td>
            </tr>
            <tr>
              <th>Sunset</th>
              <td>${entry.sunset}</td>
            </tr>
          </table>
        `;
      }
    }
  
    return htmlString;
  }
  
  


//   app.post("/deleteConfirm", async (request, response) => {
//     let deletedNum;
//     try {
//       await client.connect();
//       const result = await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).deleteMany({});
//       deletedNum = result.deletedCount
//     } catch (e) {
//         console.error(e);
//     }

//     response.render("displayDeleteConfirm", { deleted:deletedNum }); 
// });

app.post("/deleteConfirm", async (request, response) => {
  let result
  try {
    await client.connect();
    result = client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).deleteMany({})
  } catch (e) {
      console.error(e);
  }
  response.render("displayDeleteConfirm"); 
});

