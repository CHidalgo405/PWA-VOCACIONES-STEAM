const https = require('https');

const API_KEY = 'AIzaSyBJqZLX5viwj4rzw9T1AyF7MeJmRRMGF2o';

const postData = JSON.stringify({
  includedTypes: ["university"],
  maxResultCount: 10,
  locationRestriction: {
    circle: {
      center: {
        latitude: 19.432608,
        longitude: -99.133209
      },
      radius: 10000.0
    }
  }
});

const options = {
  hostname: 'places.googleapis.com',
  port: 443,
  path: '/v1/places:searchNearby',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Goog-Api-Key': API_KEY,
    'X-Goog-FieldMask': 'places.displayName,places.location,places.photos,places.id,places.formattedAddress',
    'Content-Length': postData.length
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log("Status Code:", res.statusCode);
    console.log(data);
  });
});

req.on('error', (e) => {
  console.error(e);
});

req.write(postData);
req.end();
