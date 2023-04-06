import { Router } from "express";
const router = Router();

import { viewMainpage } from "./main.services";

router.get('/', viewMainpage);

export default router;
