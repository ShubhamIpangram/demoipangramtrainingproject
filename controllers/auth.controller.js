const { generateOTP, sendEmail, generatePassword, encrypt, sendSesEmail } = require("../helpers/commonfile");
const db = require("../index");
const userColl = db.collection("user");
const APIError = require("../helpers/APIError");
const resPattern = require("../helpers/resPattern");
const httpStatus = require("http-status");
const query = require("../query/query");
const bcrypt = require("bcrypt");
const moment = require("moment");
const jwt = require("jsonwebtoken");
const fs = require('fs');
const { signInValidation, signUpValidation, emailValidation, resetPasswordValidation, checkId } = require('../helpers/validation');

const privateKey = fs.readFileSync('C:/Windows/System32/drivers/etc/private.key',
    { encoding: 'utf8', flag: 'r' });

exports.login = async (req, res, next) => {
    try {
        const { errors, isValid } = await signInValidation(req.body);

        if (!isValid) {
            const message = Object.values(errors);
            return next(new APIError(`${message}`, httpStatus.BAD_REQUEST, true));
        }

        const { password } = req.body;
        const reqData = { email: req.body.email };

        // find user
        let user = await query.findOne(userColl, reqData);
        if (!user || user.password == null) {
            const message = `Incorrect email or password.`;
            return next(new APIError(`${message}`, httpStatus.BAD_REQUEST, true));
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) {
            const currentDate = moment().format("YYYY-MM-DD[T]HH:mm:ss.SSS[Z]"); //YYYY-MM-DD[T]HH:mm:ss.SSS[Z]''  YYYY-MM-DDThh:mm:ssn
            const token = encrypt(jwt.sign(
                { _id: user._id, mobile_no: user.mobile_no },
                privateKey, { algorithm: 'RS256' }
            ));
            delete user["password"];
            let obj = resPattern.successPattern(
                httpStatus.OK,
                { user, token },
                "success"
            );
            return res.status(obj.code).json(obj);
        } else {
            const message = `Incorrect email or password.`;
            return next(new APIError(`${message}`, httpStatus.BAD_REQUEST, true));
        }
    } catch (e) {
        return next(new APIError(`${e.message}`, httpStatus.BAD_REQUEST, true));

    }
};

exports.signup = async (req, res, next) => {
    try {

        const { errors, isValid } = await signUpValidation(req.body);
        if (!isValid) {
            const message = Object.values(errors);
            return next(new APIError(`${message}`, httpStatus.BAD_REQUEST, true));
        }

        const requestdata = {
            $or: [{ mobile_no: req.body.mobile_no }, { email: req.body.email }],
        };

        const userEmail = await query.findOne(userColl, requestdata);
        if (userEmail) {
            const message = `You have already registered with this mobile number or email`;
            return next(new APIError(`${message}`, httpStatus.BAD_REQUEST, true));
        } else {
            const user = req.body;
            const currentDate = moment().format("YYYY-MM-DD[T]HH:mm:ss.SSS[Z]"); //YYYY-MM-DD[T]HH:mm:ss.SSS[Z]''  YYYY-MM-DDThh:mm:ssn
            user.otp = "";
            user.expireTime = "";
            user.password = generatePassword(req.body.password);
            user.createdAt = new Date(currentDate);
            const insertdata = await userColl.insert(user);

            console.log("insert data::------", insertdata);
            if (insertdata) {
                const obj = resPattern.successPattern(
                    httpStatus.OK,
                    insertdata.insertedCount,
                    `success`
                );
                return res.status(obj.code).json({
                    ...obj,
                });

            } else {
                const message = `Something went wrong, Please try again.`;
                return next(new APIError(`${message}`, httpStatus.BAD_REQUEST, true));
            }
        }
    } catch (e) {
        console.log("e..", e);
        return next(new APIError(`${e.message}`, httpStatus.BAD_REQUEST, true));
    }
};
