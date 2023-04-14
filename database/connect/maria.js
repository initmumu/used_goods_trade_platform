import maria from "mysql2";
import dotenv from "dotenv";
dotenv.config();


const connection = maria.createConnection({
    host : 'localhost',
    port : process.env.DB_PORT,
    user : 'root',
    password : process.env.DB_PASSWORD,
    database : 'used_goods_trade_platform'
});


export default connection;