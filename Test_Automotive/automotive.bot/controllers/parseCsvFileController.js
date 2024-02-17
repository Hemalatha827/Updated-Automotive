const fileDownloadUtils = require('../utilities/fileDownloadUtils');
const postCodeUtils = require('../utilities/postCodeUtils');
const mysqlHelper = require('../utilities/mySqlQueryBuilder');
const GLOBAL = require('../GLOBAL_VARS.json');
const zincConnector = require('../connections/zincConnector');



exports.parsecsv = async (req, res) => {
  const postData = req.body;
  const acctFileUrl = postData["accounts-url"];
  const acctDownloadFileAndTableName = "accounts";
  const carFileUrl = postData["cars-url"];
  const carDownloadFileAndTableName = "cars";

  try {


    // download the accounts CSV file and extract data
    await fileDownloadUtils.downloadFile(acctFileUrl, acctDownloadFileAndTableName);
    const acctsData = await fileDownloadUtils.extractFileData(acctDownloadFileAndTableName, GLOBAL.FILE_SEPERATOR.CSV);

    //insert account data into mysql
    await mysqlHelper.insertDataIntoMysql(acctsData, acctDownloadFileAndTableName);

    /**
    //Extract postcodes
    const postcodes = acctsData.map(item => item.Postcode);
    //Remove Duplicate
    const uniquePostcodes = Array.from(new Set(postcodes));

    //Find Latitude and Longitude for every postcode and insert into DB
    await processBatch(uniquePostcodes, 0, GLOBAL.BATCH_PROCESS.POSTCODE_BATCH_SIZE, GLOBAL.BATCH_PROCESS.POSTCODE_PAUSE_MILLSECONDS, 'fetchLatAndLongAndInsertintoDB', postCodeUtils.fetchLatAndLongAndInsertintoDB);
    //const latAndLong = await postcodeConnector.bulkPostCodeLookup(uniquePostcodes);



    //DONOT uncomment
    // await postCodeUtils.calculateDistance();
    */

    // download the cars TSV file and extract data
    await fileDownloadUtils.downloadFile(carFileUrl, carDownloadFileAndTableName);
    const carsData = await fileDownloadUtils.extractFileData(carDownloadFileAndTableName, GLOBAL.FILE_SEPERATOR.TSV);

    //insert car data into mysql
    await processBatch(carsData, 0, GLOBAL.BATCH_PROCESS.INSERT_DATA_SIZE, GLOBAL.BATCH_PROCESS.INSERT_PAUSE_MILLSECONDS, 'insertDataIntoMysql', mysqlHelper.insertDataIntoMysql, carDownloadFileAndTableName);

    //Delete and insert into zincsearch
    await zincConnector.zincDeleteIndex(GLOBAL.SERVER.ZS_INDEX);
    await processBatch(carsData, 0, GLOBAL.BATCH_PROCESS.INSERT_DATA_SIZE, GLOBAL.BATCH_PROCESS.INSERT_PAUSE_MILLSECONDS, 'updateInBulkZincsearch', zincConnector.updateInBulkZincsearch);


    // Now, delete the CSV and TSV files
    /*await fileDownloadUtils.deleteCsvFile(downloadedFilePath);
    await fileDownloadUtils.deleteCsvFile(carsDownloadedFilePath);*/

    res.json({ "success": "true" });

  } catch (error) {
    console.error('Error:', error.message);
    res.json({ "error": error.message || "An error occurred" });
  }
};


async function processBatch(data, startIndex, size, delay, functionName, func, ...args) {

  //console.log(startIndex + " "+size);

  const endIndex = Math.min(startIndex + size);


  const batch = data.slice(startIndex, endIndex);
  // Call the provided function to process the batch
  console.log(`Proessing batch data ${startIndex + 1} - ${endIndex} for ${functionName}`);

  await func(batch, ...args);
  // Check if there are more batches to process
  if (endIndex < data.length) {
    // If yes, recursively call processBatch with a delay
    await new Promise(resolve => {
      setTimeout(() => {
        resolve(processBatch(data, endIndex, size, delay, functionName, func, ...args));
      }, delay);
    });
  }
}