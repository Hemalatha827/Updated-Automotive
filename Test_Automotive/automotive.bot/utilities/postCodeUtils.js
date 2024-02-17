const { radians, sin, cos, sqrt, atan2 } = Math;
const postcodeConnector = require('../connections/postcodeConnector');
const mysqlHelper = require('../utilities/mySqlQueryBuilder');



exports.fetchLatAndLongAndInsertintoDB = async function (postcodes) {
  const latAndLongData = await postcodeConnector.bulkPostCodeLookup(postcodes);
  //console.log(JSON.stringify(latAndLongData));
  const transformedData = latAndLongData.result.filter(item => item.result !== null).map(item => {
    return {
      postcode: item.query,
      lat: item.result.latitude,
      long: item.result.longitude
    };
  });

  await mysqlHelper.insertDataIntoMysql(transformedData, "postcode_lat_long");

}


exports.calculateDistance = async function () {
  const query = `select * from postcode_lat_long`;

  const data = await mysqlHelper.selectDataFromMysql(query);
  //console.log(JSON.stringify(data));

  // Calculate distance between each pair of postcodes
  for (let i = 0; i < data.length; i++) {

    const miles_30 = [];
    const miles_60 = [];
    const miles_90 = [];
    for (let j = 0; j < data.length; j++) {
      console.log(`Comparing ${i + 1}.${data[i].postcode} with ${j + 1}.${data[j].postcode}`);
      const distance = haversine(data[i].lat, data[i].lang, data[j].lat, data[j].lang);
      if (distance <= 30) {
        miles_30.push({
          postcode_src: data[i].postcode,
          postcode_dest: data[j].postcode,
          distance_in_miles: distance
        });
      } else if (distance <= 60) {
        miles_60.push({
          postcode_src: data[i].postcode,
          postcode_dest: data[j].postcode,
          distance_in_miles: distance
        });

      } else {
        miles_90.push({
          postcode_src: data[i].postcode,
          postcode_dest: data[j].postcode,
          distance_in_miles: distance
        });
      }
    }

    if (miles_30.length > 0) {
      await mysqlHelper.insertDataIntoMysql(miles_30, "postcode_30miles");
    }
    if (miles_60.length > 0) {
      await mysqlHelper.insertDataIntoMysql(miles_60, "postcode_60miles");
    }
    if (miles_90.length > 0) {
      await mysqlHelper.insertDataIntoMysql(miles_90, "postcode_90miles");
    }

    if (i % 10 == 0) {
      //wait for 60 secs
      await pauseExecution(60);
    }
  }
  console.log("Calculation completed");
}


function haversine(lat1, lon1, lat2, lon2) {
  const R = 3958.8; // Radius of the Earth in miles
  const dLat = (lat2 - lat1) * Math.PI / 180; // Convert latitude difference to radians
  const dLon = (lon2 - lon1) * Math.PI / 180; // Convert longitude difference to radians
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in miles
  return distance;
}


function pauseExecution(seconds) {
  return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

