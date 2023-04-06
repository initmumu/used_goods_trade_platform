import products from "./controller/products/products.controller";
import main from "./controller/main.controller";
import express from "express";

export class AppBoot {
    constructor(PORT){
        this.PORT = PORT;
        this.app = express();
    }

    setMiddleware() {
        this.app.use((req, res, next) => {
            console.log(`[${req.ip}] 클라이언트 접속`);
            return next();
        });
    }

    setRouter(){
        this.app.use('/', main);
        this.app.use('/products', products);
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
        this.setMiddleware();
        this.setRouter();
        this.setErrorHandler();
        this.app.listen(this.PORT, '0.0.0.0', () => {
            console.log(`Server is on ${this.PORT}!`);
        });
    }
}