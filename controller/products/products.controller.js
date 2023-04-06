// 라우터
import { getAllProducts }  from "./products.services";
import { Router } from "express";
const router = Router();

router.get('/', getAllProducts);

export default router;