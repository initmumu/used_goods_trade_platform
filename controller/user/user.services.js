import maria from "../../database/connect/maria.js";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
dotenv.config();

// 회원가입
export const register = async (req, res) => {
    const reqJson = req.body;

    const user_id = reqJson?.user_id; // ?: 데이터가 없으면 undefined! (서버가 죽는 것을 방지함)
    const user_password = reqJson?.user_pw;
    const user_name = reqJson?.user_name;


    const register_sql = `insert into users (user_id, user_password, user_name) values (?,sha2(?,256),?)`;
    try {
        const result = await maria.promise().query(register_sql, [user_id, user_password,user_name]); // 배열 안의 값들이 위의 (?, ?, ?)로 들어감!
    } catch (except) {
        return res.json({
            errno: except.errno,
            code: except.code,
        });
    }
    return res.json({
        status: 200,
        msg: "회원가입 완료",
    });
}
// 토큰 확인 (origin)
export const auth = async (req, res) => {
    const accessToken = req.headers.authorization;

    try {
        req.decoded = jwt.verify(accessToken, process.env.JWT_SECRET_KEY); // .verify: 토큰 인증하는 메서드
        res.json({
            id: req.decoded.id, // accessToken payload에 담았던 값들
            user_name: req.decoded.user_name
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


/*
// 로그인 (origin)
export const login = async (req, res) => {
    const reqJson = req.body;

    const user_id = reqJson.user_id;
    const user_pw = reqJson.user_pw;

    const query = `select user_id, user_name from users where user_id = ? and user_password = sha2(?, 256)`;
    const [rows, fields] = await maria.promise().query(query, [user_id, user_pw]);

    if (rows.length == 1) { // 로그인 성공!
        const token = jwt.sign( // .sing: 토큰 생성 메서드
            {
                type: "JWT",
                id: rows[0].user_id,
                user_name: rows[0].user_name,
            },
            process.env.JWT_SECRET_KEY,
            {
                expiresIn: "15m", // 15분후 만료
                issuer: "경희대서버파괘자",
            });

        res.json({
            status: 200,
            msg: "로그인 인증 토큰이 발급되었습니다.",
            token: token
        });
    }
    else{
        res.send("로그인 데이터가 일치하는게 없네용~");
    }
}
 */

// 새로운 access token 발급
export const refreshToken = async (req, res) => {
    const accessToken = req.headers.authorization;
    const refreshToken = req.body.refreshToken;
    console.log(accessToken);
    console.log(refreshToken);

    // access token 확인
    try {
        req.decoded = jwt.verify(accessToken, process.env.JWT_SECRET_KEY); // .verify: 토큰 인증하는 메서드
        // res.json({
        //     id: req.decoded.id, // accessToken payload에 담았던 값들
        //     user_name: req.decoded.user_name
        // })
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
                    expiresIn: "14d",
                    issuer: "경희대서버파괘자",
                });

                res.status(200).json({
                    message: "새로운 access token이 발급되었습니다.",
                    accessToken: newAccessToken,
                    refreshToken: refreshToken,
                });
            } catch (err) {
                if (err.name === "TokenExpiredError") {

                }

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
}


// 로그인 (with refresh token)
export const login = async (req, res) => {
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
                expiresIn : "14d",
                issuer: '경희대서버파괘자',
            }
        );

        // db에 refresh token 삽입
        const temp_query = `select id from users where user_id = ?`;
        const [temp_rows, temp_fields] = await maria.promise().query(temp_query, [user_id]);
        console.log(temp_rows[0].id);

        const query = `insert into tokens (content, user_id) values (?, ?)`;
        await maria.promise().query(query, [refreshToken, temp_rows[0].id]);

        // access token 생성
        const accessToken = jwt.sign( // .sing: 토큰 생성 메서드
            {
                type: "JWT",
                id: rows[0].user_id,
                user_name: rows[0].user_name,
            },
            process.env.JWT_SECRET_KEY,
            {
                expiresIn: "15m", // 15분후 만료
                issuer: "경희대서버파괘자",
            });
        console.log(accessToken);
        console.log(refreshToken);
        res.json({
            status: 200,
            message: "로그인 인증 토큰이 발급되었습니다.",
            accessToken: accessToken,
            refreshToken: refreshToken,
        });
    }
    else {
        res.send("로그인 데이터가 일치하는게 없네용~");
    }
}

// 회원 탈퇴
export const delete_user = async (req, res) => {
    const reqJson = req.body;
    const user_id = reqJson?.user_id;
    try {
        const id_query = `select id from users where user_id = ?`;
        const [rows, fields] = await maria.promise().query(id_query, [user_id]);
        const delete_relative_rows_query = `delete from tokens where user_id = ?`;
        await maria.promise().query(delete_relative_rows_query, rows[0].id);
        const query = `delete from users where user_id = ?`;
        await maria.promise().query(query, user_id);
        res.json({
            message: "회원 탈퇴 완료."
        })
    } catch (err) {
        console.log(err);
        res.status(400).json({
            message: "요청이 적절하지 않습니다.",
        })
    }
}