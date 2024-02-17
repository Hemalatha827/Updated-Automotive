
const GLOBAL = require('../GLOBAL_VARS.json');
const fetch = require('isomorphic-fetch');

exports.getNearestPostcode = async function (postcode) {
    const url = 'https://api.postcodes.io/postcodes/' + postcode + '/nearest?widesearch=5km&limit=50';
    const options = {
        method: 'GET',
        headers: {
            'Accept': 'application/json'
        }
    };

    // Attempting some risky operation
    return fetch(url, options)
        .then(response => response.json());

}

exports.bulkPostCodeLookup = async function (postcodes) {
    const url = 'https://postcodes.io/postcodes?filter=longitude,latitude';
    const options = {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json' // Set Content-Type to JSON
        },
        body: JSON.stringify({ postcodes: postcodes }) // Convert array to JSON string
    };

    // Attempting some risky operation
    return fetch(url, options)
        .then(response => response.json());

}
