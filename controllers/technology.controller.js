const { generateOTP, sendEmail, generatePassword, encrypt, sendSesEmail } = require("../helpers/commonfile");
const db = require("../index");
const technologyColl = db.collection("technology");
const APIError = require("../helpers/APIError");
const resPattern = require("../helpers/resPattern");
const httpStatus = require("http-status");
const query = require("../query/query");
const bcrypt = require("bcrypt");
const moment = require("moment");

exports.addTechnology = async (req, res, next) => {
    try {


        const requestdata = {
            name: req.body.name,
        };

        const userEmail = await query.findOne(technologyColl, requestdata);
        if (userEmail) {
            const message = `name already exists`;
            return next(new APIError(`${message}`, httpStatus.BAD_REQUEST, true));
        } else {
            const user = req.body;
            const currentDate = moment().format("YYYY-MM-DD[T]HH:mm:ss.SSS[Z]"); //YYYY-MM-DD[T]HH:mm:ss.SSS[Z]''  YYYY-MM-DDThh:mm:ssn
            user.createdAt = currentDate;
            const insertdata = await technologyColl.insert(user);

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
