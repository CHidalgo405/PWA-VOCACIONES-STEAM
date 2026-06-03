const https = require('https');

const API_KEY = 'AIzaSyBJqZLX5viwj4rzw9T1AyF7MeJmRRMGF2o';
const lat = 19.432608;
const lng = -99.133209;

const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=universidad&location=${lat},${lng}&radius=30000&key=${API_KEY}`;

https.get(url, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log(data);
  });
}).on("error", (err) => {
  console.log("Error: " + err.message);
});
