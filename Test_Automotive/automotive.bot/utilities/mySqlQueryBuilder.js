const mysql = require('../connections/mysqlConnector');



exports.insertDataIntoMysql = async function (data, table, fields) {

  const sql = `INSERT INTO ${table}${fields && fields.length > 0 ? ` (${fields.join(', ')})` : ''} VALUES ?`;
  const values = data.map((item) => Object.values(item));

  await mysql.executeQuery(sql, [values], (error, results, fields) => {

    if (error) {
      console.error(`Error inserting data into ${table} table:`, error);
    } else {
      console.log(`Inserted into ${table} table`, results.affectedRows, 'rows');
    }
  });

}

exports.selectDataFromMysql = async function (query) {

  return new Promise((resolve, reject) => {
    mysql.executeQuery(query, [], (error, results, fields) => {
      if (error) {
        console.error(`Error selecting from mysql`);
        reject(error); // Reject the Promise with the error
      } else {
        console.log(`Select from result is success`);
        resolve(results); // Resolve the Promise with the results
      }
    });
  });


}