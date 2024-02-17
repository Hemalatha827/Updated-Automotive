const GLOBAL = require('../GLOBAL_VARS.json');
const utils = require('./utilitieFunc');
const axios = require('axios');
const fs = require('fs');
const csv = require('csv-parser');



exports.extractFileIdFromUrl = function (originalUrl) {
  const urlObject = new URL(originalUrl);
  return urlObject.pathname.split('/')[3];
}

exports.generateNewUrl = function (fileId) {
  return GLOBAL.GOOGLE_DRIVE_DOWNLOAD_URL + fileId + "?alt=media&key=" + GLOBAL.GOOGLE_DRIVE_API_KEY;;
}

exports.downloadFile = async function (originalUrl, fileName) {
  const fileId = utils.extractFileIdFromUrl(originalUrl);
  const url = utils.generateNewUrl(fileId);

  try {
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream',
    });

    await pipeResponseToFile(response, fileName);

    console.log('File downloaded successfully:', fileName);
  } catch (error) {
    console.error('Error downloading file:', error);
    throw error;
  }
}

async function pipeResponseToFile(response, filePath) {
  return new Promise((resolve, reject) => {
    const fileStream = fs.createWriteStream(filePath);
    response.data.pipe(fileStream);
    fileStream.on('finish', resolve);
    fileStream.on('error', reject);
  });
}


exports.extractFileData = async function (filePath, seperator) {

  const data = []; // Initialize csvpayload array

  // Parse CSV/TSV data and create JSON
  const parseData = () => {
    return new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv({ separator: seperator }))
        .on('data', (row) => {
          data.push(row); // Push csvextractedobject into csvpayload
        })
        .on('end', () => {
          resolve({ data });
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  };

  // Run parsing and printing
  try {
    await parseData();
    return data;
  } catch (error) {
    console.error('Error:', error);
  }

}



/* async deleteCsvFile(csvFilePath, callback) {
    fs.unlink(csvFilePath, (deleteError) => {
      if (deleteError) {
        console.error('Error deleting CSV file:', deleteError);
        if (callback) {
          callback(deleteError, null);
        }
      } else {
        console.log('CSV file deleted successfully.');
        if (callback) {
          callback(null);
        }
      }
    });
  },*/