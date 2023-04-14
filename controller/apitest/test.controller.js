import { Router } from 'express'
import maria from "../../database/connect/maria.js";
import jwt from "jsonwebtoken";
const router = Router();

router.post('/login',async (req, res) => {
    const reqJson = req.body;

    const user_id = reqJson.user_id;
    const user_pw = reqJson.user_pw;

    const query = `select user_id, user_name from users where user_id = ? and user_password = sha2(?, 256)`;
    const [rows, fields] = await maria.promise().query(query, [user_id, user_pw]);


    if (rows.length === 1) { // 로그인 성공!
        // refresh token 생성
        const refreshToken = jwt.sign(
            {
                type: "JWT",
                id: rows[0].user_id,
                user_name: rows[0].user_name,
            },
            process.env.JWT_SECRET_KEY,
            {
                expiresIn : "2m",
                issuer: '경희대서버파괘자',
            }
        );

        // db에 refresh token 삽입
        const temp_query = `select id from users where user_id = ?`;
        const [temp_rows, temp_fields] = await maria.promise().query(temp_query, [user_id]);
        console.log(temp_rows[0].id);

        "나중에 고칠 부분"
        // const query = `insert into tokens (content, user_id) values (?, ?)`;
        // await maria.promise().query(query, [refreshToken, temp_rows[0].id]);

        // access token 생성
        const accessToken = jwt.sign( // .sing: 토큰 생성 메서드
            {
                type: "JWT",
                id: rows[0].user_id,
                user_name: rows[0].user_name,
            },
            process.env.JWT_SECRET_KEY,
            {
                expiresIn: "1m", // 15분후 만료
                issuer: "경희대서버파괘자",
            });
        console.log(accessToken);
        console.log(refreshToken);
        res.json({
            status: 200,
            msg: "로그인 인증 토큰이 발급되었습니다.",
            accessToken: accessToken,
            refreshToken: refreshToken,
        });
    }
    else {
        res.send("로그인 데이터가 일치하는게 없네용~");
    }
})

router.get('/auth', async (req, res) => {
        const accessToken = req.headers.authorization;

        try {
            req.decoded = jwt.verify(accessToken, process.env.JWT_SECRET_KEY); // .verify: 토큰 인증하는 메서드
            res.json({
                id: req.decoded.id, // accessToken payload에 담았던 값들
                user_name: req.decoded.user_name,
            })
        } catch (err) {
            if (err.name === "TokenExpiredError") {
                return res.status(419).json({
                    code: 419,
                    message: "토큰이 만료되었습니다.",
                });
            }
            // 토큰의 비밀키가 일치하지 않는 경우
            else if (err.name === "JsonWebTokenError") {
                return res.status(401).json({
                    code: 401,
                    message: "유효하지 않은 토큰입니다.",
                });
            }
        }
    }
)

router.post('/refreshToken', async (req, res) => {
    const accessToken = req.headers.authorization;
    const refreshToken = req.body.refreshToken;
    console.log(accessToken);
    console.log(refreshToken);

    // access token 확인
    try {
        req.decoded = jwt.verify(accessToken, process.env.JWT_SECRET_KEY); // .verify: 토큰 인증하는 메서드
        res.status(200).json({
            message: "아니 만료안됐잖아요~ 프론트 로직처리 제대로 해주세요~",
        })
    } catch (err) {
        if (err.name === "TokenExpiredError") { // access token 기간이 만료된 경우
            try { // refresh token 기간 만료 여부 확인
                req.decoded = jwt.verify(refreshToken, process.env.JWT_SECRET_KEY);
                // access token 만료 O, refresh token 만료 X => access token만 새로 발급해주면 됨.
                const newAccessToken = jwt.sign(
                    {
                        type: "JWT",
                        id: req.decoded.user_id,
                        user_name: req.decoded.user_name,
                    },
                    process.env.JWT_SECRET_KEY,
                    {
                        expiresIn: "1m",
                        issuer: "경희대서버파괘자",
                    });

                res.status(200).json({
                    message: "새로운 access token이 발급되었습니다.",
                    accessToken: newAccessToken,
                    refreshToken: refreshToken,
                });
            } catch (err) {
                // access token 만료 O, refresh token 만료 O => 둘 다 만료되었으므로, 다시 로그인 권유
                return res.status(401).json({
                    message: "access token과 refresh token이 모두 만료되었습니다.",
                })
            }
        }

        // 토큰의 비밀키가 일치하지 않는 경우
        else if (err.name === "JsonWebTokenError") {
            return res.json({
                code: 401,
                message: "유효하지 않은 토큰입니다.",
            });
        }
    }
})

export default router