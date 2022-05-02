const mysql = require('mysql2');
const dbConnection = mysql.createPool({
    host: "node31258-rattana.app.ruk-com.cloud",
    user: "root",
    password: "MVCtwielIv",
    database: "shop",
    //port: "11243"
}).promise();
module.exports = dbConnection;