// 라우터
import { list }  from "./product.services.js";
import { Router } from "express";
const router = Router();

router.get('/list', list);

export default router;