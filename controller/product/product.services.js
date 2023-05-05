import maria from "../../database/connect/maria.js";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
dotenv.config();

export const list = async (req, res) => {
    const reqJson = req.body;

    const category = reqJson?.category;
}