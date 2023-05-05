// 데이터베이스
import { Router } from "express";
import { register, auth, login, refreshToken, delete_user } from "./user.services.js";

const router = Router();

router.get('/', (req, res) => {
    res.send('this is user page!');
});
router.post('/register', register);
router.post('/login', login);
router.get('/auth', auth);
router.post('/refreshToken', refreshToken);
router.delete('/delete', delete_user);

export default router;

