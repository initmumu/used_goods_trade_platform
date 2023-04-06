import express from "express"
import dotenv from "dotenv"

dotenv.config();

const app = express();

const router = require('./router/index');

// mariaDB connect
/*const maria = require('./database/connect/maria');
maria.connect();
*/


app.use('/', router);


export const finishKakaoLogin = async (req, res) => {
    const baseUrl = "https://kauth.kakao.com/oauth/token";
    const config = {
        client_id: process.env.KAKAO_ID,
        client_secret: process.env.KAKAO_URL,
        grant_type: "authorization_code",
        redirect_uri: process.env.KAKAO_URL,
        code: req.query.code,
    };
    const params = new URLSearchParams(config).toString();
    const finalUrl = `${baseUrl}?${params}`;
    const kakaoTokenRequest = await (
        await fetch(finalUrl, {
            method: "POST",
            headers: {
                "Content-type": "application/json", // 이 부분을 명시하지않으면 text로 응답을 받게됨
            },
        })
    ).json();
    if ("access_token" in kakaoTokenRequest) {
        // 엑세스 토큰이 있는 경우 API에 접근
        const {access_token} = kakaoTokenRequest;
        const userRequest = await (
            await fetch("https://kapi.kakao.com/v2/user/me", {
                headers: {
                    Authorization: `Bearer ${access_token}`,
                    "Content-type": "application/json",
                },
            })
        ).json();
        console.log(userRequest);
    } else {
        // 엑세스 토큰이 없으면 로그인페이지로 리다이렉트
        return res.redirect("/login");
    }
    ;
}

app.route('/auth/kakao/callback').get(finishKakaoLogin);



app.listen(process.env.SERVER_PORT, () => {
    console.log(`Server is on ${process.env.SERVER_PORT}`);
});