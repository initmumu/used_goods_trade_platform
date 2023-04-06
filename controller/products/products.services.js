// 콜백 함수 적는 곳
import { goods } from "./products.model";

export const getAllProducts = (req, res) => {
    res.send(goods);
}