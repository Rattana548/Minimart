const mysql = require('mysql2');
const con = mysql.createConnection({
    host: "node31258-rattana.app.ruk-com.cloud",
    user: "root",
    password: "MVCtwielIv",
    database: "shop",
    //port: "11243"
})
module.exports = con;