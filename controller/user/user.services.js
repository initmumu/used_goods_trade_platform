import maria from "../../database/connect/maria.js";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
dotenv.config();

// 회원가입
export const register = async (req, res) => {
    console.log(req.ip);
    const reqJson = req.body;

    const user_id = reqJson?.user_id; // ?: 데이터가 없으면 undefined! (서버가 죽는 것을 방지함)
    const user_password = reqJson?.user_password;
    const user_name = reqJson?.user_name;


    const register_sql = `insert into users (user_id, user_password, user_name) values (?,sha2(?,256),?)`;
    try {
        await maria.promise().query(register_sql, [user_id, user_password,user_name]); // 배열 안의 값들이 위의 (?, ?, ?)로 들어감!
    } catch (except) {
        if (except.errno === 1048) {
            return res.status(400).json({
                message : "필수적인 파라미터가 전달되지 않았습니다.",
            });
        } else if (except.errno === 1062) {
            return res.status(400).json({
                message : "이미 존재하는 아이디입니다.",
            });
        }
    }
    return res.status(200).json({
        message : "회원가입 완료",
    });
}

// 로그인 (with refresh token)
export const login = async (req, res) => {
    const reqJson = req.body;

    const user_id = reqJson.user_id;
    const user_password = reqJson.user_password;
    console.log(user_id);
    console.log(user_password);

    const query = `select user_id, user_name from users where user_id = ? and user_password = sha2(?, 256)`;
    const [rows, fields] = await maria.promise().query(query, [user_id, user_password]);

    console.log(rows[0]);

    if (rows.length === 1) { // 로그인 성공!
        // refresh token 생성
        const refreshToken = jwt.sign(
            {
                type : "JWT",
                user_id : rows[0].user_id, // 유저 아이디 그대로 저장
                user_name : rows[0].user_name,
            },
            process.env.JWT_SECRET_KEY,
            {
                expiresIn : "15m", // 14d
                issuer : '경희대서버파괘자',
            },
        );
        /*
        // db에 refresh token 삽입
        const temp_query = `select user_id from users where user_id = ?`;
        const [temp_rows, temp_fields] = await maria.promise().query(temp_query, [user_id]);
        console.log(temp_rows[0].id);

        const query = `insert into tokens (content, user_id) values (?, ?)`;
        await maria.promise().query(query, [refreshToken, temp_rows[0].id]);
*/
        // access token 생성
        const accessToken = jwt.sign( // .sing: 토큰 생성 메서드
            {
                type : "JWT",
                user_id : rows[0].user_id,
                user_name : rows[0].user_name,
            },
            process.env.JWT_SECRET_KEY,
            {
                expiresIn : "5m", // 15분후 만료
                issuer : "경희대서버파괘자",
            });
        res.status(200).json({
            message : "로그인 완료",
            accessToken : accessToken,
            refreshToken : refreshToken,
        });
    } else {
        res.status(401).json({
            message: "일치하는 로그인 데이터가 없습니다.",
        });
    }
}

export const checkDuplicateId = async (req, res) => {
    const reqJson = req.body;
    const user_id = reqJson?.user_id;
}

// 토큰 확인 (origin)
export const auth = async (req, res) => {
    const accessToken = req.headers.authorization;

    try {
        req.decoded = jwt.verify(accessToken, process.env.JWT_SECRET_KEY); // .verify: 토큰 인증하는 메서드
        res.status(200).json({
            user_id: req.decoded.user_id, // accessToken payload에 담았던 값들
            user_name: req.decoded.user_name,
        });
    } catch (err) {
        if (err.name === "TokenExpiredError") {
            return res.status(419).json({
                message: "토큰이 만료되었습니다.",
            });
        }
        // 토큰의 비밀키가 일치하지 않는 경우
        else if (err.name === "JsonWebTokenError") {
            return res.status(401).json({
                message: "유효하지 않은 토큰입니다.",
            });
        }
    }
}

// 새로운 access token 발급
export const refreshToken = async (req, res) => {
    const accessToken = req.headers.authorization;
    const refreshToken = req.body.refreshToken;
    console.log(accessToken);
    console.log(refreshToken);

    // access token 확인
    try {
        req.decoded = jwt.verify(accessToken, process.env.JWT_SECRET_KEY); // .verify: 토큰 인증하는 메서드
    } catch (err) {
        if (err.name === "TokenExpiredError") { // access token 기간이 만료된 경우
            try { // refresh token 기간 만료 여부 확인
                req.decoded = jwt.verify(refreshToken, process.env.JWT_SECRET_KEY);

                // access token 만료 O, refresh token 만료 X => access token만 새로 발급해주면 됨.
                const newAccessToken = jwt.sign(
                    {
                        type : "JWT",
                        id : req.decoded.user_id,
                        user_name : req.decoded.user_name,
                    },
                    process.env.JWT_SECRET_KEY,
                    {
                    expiresIn : "14d",
                    issuer : "경희대서버파괘자",
                });

                res.status(200).json({
                    message : "새로운 access token이 발급되었습니다.",
                    accessToken : newAccessToken,
                    refreshToken : refreshToken,
                });
            } catch (err) { // refresh token 기간이 만료되었을 때
                // access token 만료 O, refresh token 만료 O => 둘 다 만료되었으므로, 다시 로그인 권유
                return res.status(419).json({
                    message : "access token과 refresh token이 모두 만료되었습니다.",
                });
            }
        }
        // 토큰의 비밀키가 일치하지 않는 경우
        else if (err.name === "JsonWebTokenError") {
            return res.status(401).json({
                message : "유효하지 않은 토큰입니다.",
            });
        }
    }
}

// 회원 탈퇴
export const delete_user = async (req, res) => {
    const reqJson = req.body;
    const user_id = reqJson?.user_id;

    const query = `delete from users where user_id = ?`;
    const rows = await maria.promise().query(query, user_id);

    if (rows[0].affectedRows === 1) { // 탈퇴 성공!
        res.status(200).json({
            message : "회원 탈퇴 완료",
        });
    } else {
        res.status(401).json({
            message : "존재하지 않는 아이디입니다.",
        });
    }
}