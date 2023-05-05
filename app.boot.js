import products from "./controller/products/products.controller.js";
import main from "./controller/main.controller.js";
import user from "./controller/user/user.controller.js";
import test from "./controller/apitest/test.controller.js"
import express from "express";
import maria from "./database/connect/maria.js";

export class AppBoot {
    constructor(PORT){
        this.PORT = PORT;
        this.app = express();

    }

    connectDB() {
        maria.connect();
    }

    setMiddleware() {
        this.app.use((req, res, next) => {
            console.log(`[${req.ip}] 클라이언트 접속`);
            return next();
        });

        this.app.use(express.json()); // json 파서!
    }

    setRouter(){
        this.app.use('/', main);
        this.app.use('/test', test)
        this.app.use('/products', products);
        this.app.use('/user', user);
    }

    setErrorHandler(){
        this.app.use((req, res) => {
            res.json({
                status : 404,
                message : "요청한 페이지가 없습니다!"
            });
        });
    }

    boot() {
        this.connectDB();
        this.setMiddleware();
        this.setRouter();
        this.setErrorHandler();
        this.app.listen(this.PORT, '0.0.0.0', () => {
            console.log(`Server is on ${this.PORT}!`);
        });
    }
}