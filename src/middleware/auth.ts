import jwt from "jsonwebtoken";
import { NextFunction, Request, Response } from "express";
import { failureResponse } from "../utils/response.js";
import config from "../config/config.js";
import { User } from "../models/user.js";
import { JwtPayload } from "../types/type.js";

const verifyJWT = async (req: any, res: Response, next: NextFunction) => {
  try {

    const url = req.originalUrl.split("/")
    const cleanSegments = url.filter((segment: any) => segment !== "");
    const lastRoute = cleanSegments[cleanSegments.length - 1];

    console.log(lastRoute)
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return failureResponse("Token is missing", res, 401);
    }

    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, config.access_secret) as JwtPayload;
    } catch (err: any) {
      if (err.name === "TokenExpiredError") {
        return failureResponse("Access token expired", res, 401);
      } else if (err.name === "JsonWebTokenError") {
        return failureResponse("Invalid token", res, 401);
      } else {
        throw err;
      }
    }

    const user = await User.findById(decoded.userId).select(
      "-password -refreshToken"
    );

    if (!user) {
      return failureResponse("Invalid access token", res, 401);
    }

    req.user = user;
    next();
  } catch (err: any) {
    console.error("Error in verifyJWT middleware:", err);
    return res.status(500).json({
      success: false,
      message: "Something went wrong in verifying token",
      error: err.message,
    });
  }
};

export default verifyJWT;
