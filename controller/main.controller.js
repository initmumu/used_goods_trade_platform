import { Router } from "express";
const router = Router();

import { viewMainpage } from "./main.services.js";

router.get('/', viewMainpage);

export default router;
