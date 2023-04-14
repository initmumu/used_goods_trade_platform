// 라우터
import { getAllProducts }  from "./products.services.js";
import { Router } from "express";
const router = Router();

router.get('/', getAllProducts);

export default router;