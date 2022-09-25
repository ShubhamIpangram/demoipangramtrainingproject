const { generateOTP, sendEmail, generatePassword, encrypt, sendSesEmail } = require("../helpers/commonfile");
const db = require("../index");
const projectColl = db.collection("project");
const userColl = db.collection("user");
const APIError = require("../helpers/APIError");
const resPattern = require("../helpers/resPattern");
const httpStatus = require("http-status");
const query = require("../query/query");
const bcrypt = require("bcrypt");
const moment = require("moment");
const { ObjectId } = require('mongodb');
const salaryColl = db.collection("salary")
const dateColl = db.collection("dateCollection")
exports.addproject = async (req, res, next) => {
    try {
        const requestdata = {
            projectName: req.body.projectName,
        };

        const technologyId = ObjectId(req.body.technologyId);
        const userEmail = await query.findOne(projectColl, requestdata);
        if (userEmail) {
            const message = `name already exists`;
            return next(new APIError(`${message}`, httpStatus.BAD_REQUEST, true));
        } else {
            const user = req.body;
            const currentDate = moment().format("YYYY-MM-DD[T]HH:mm:ss.SSS[Z]"); //YYYY-MM-DD[T]HH:mm:ss.SSS[Z]''  YYYY-MM-DDThh:mm:ssn
            user.createdAt = currentDate;
            user.technologyId = technologyId;
            const insertdata = await projectColl.insert(user);

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

exports.projectList = async (req, res, next) => {
    try {
        const { pageNo, limit, searchText } = req.body;
        const result = await query.findByPagination(projectColl, {
            projectName: {
                $regex: ".*" + searchText + ".*",
                $options: "i",
            }
        },
            {}, pageNo, limit);
        const obj = resPattern.successPattern(httpStatus.OK, { result }, `success`);
        return res.status(obj.code).json({
            ...obj,
        });
    } catch (e) {
        console.log('error---', e)
        return next(new APIError(`${e.message}`, httpStatus.BAD_REQUEST, true))
    }
}

exports.projectDetail = async (req, res, next) => {
    try {
        const id = ObjectId(req.params.id);
        const { skip, limit, searchText } = req.query;

        let search = "";
        if (searchText) {
            search = searchText
        }

        const result = await projectColl.aggregate([
            {
                $match: {
                    _id: id
                }
            }, {
                $lookup: {
                    from: 'technology',
                    localField: 'technologyId',
                    foreignField: '_id',
                    as: 'technology'
                }
            },
            { $project: { _id: 0, projectName: 1, description: 1, createdAt: 1, technology: 1 } },
        ]).toArray();

        if (result.length > 0) {
            const obj = resPattern.successPattern(httpStatus.OK, result, `success`);
            return res.status(obj.code).json({
                ...obj,
            });
        } else {
            const message = `User not found with this ID.`;
            return next(new APIError(`${message}`, httpStatus.BAD_REQUEST, true));
        }
    } catch (e) {
        console.log(e)
        return next(new APIError(`${e.message}`, httpStatus.BAD_REQUEST, true))
    }

}

exports.nestedLookup = async (req, res, next) => {
    try {
        const id = ObjectId(req.params.id);

        const result = await projectColl.aggregate([
            {
                $match: {
                    _id: id
                }
            }, {
                $lookup: {
                    from: 'technology',
                    localField: 'technologyId',
                    foreignField: '_id',
                    as: 'technologys'
                }
            },
            {
                $unwind: {
                    path: "$technologys",
                }
            },
            {
                $lookup: {
                    from: 'language',
                    localField: 'technologys.languageId',
                    foreignField: '_id',
                    as: 'technologys.language'
                }
            },
            // {$group: {
            //     _id: "$_id",
            //     name: {$first: "$name"},
            //     question: {$push: {
            //         title: "$questions.title",
            //         form: "$questions.form",
            //         options: "$options"
            //     }}
            // }}
            { $project: { _id: 0, projectName: 1, description: 1, createdAt: 1, technologys: 1, language: 1 } },
        ]).toArray();

        if (result.length > 0) {
            const obj = resPattern.successPattern(httpStatus.OK, result, `success`);
            return res.status(obj.code).json({
                ...obj,
            });
        } else {
            const message = `User not found with this ID.`;
            return next(new APIError(`${message}`, httpStatus.BAD_REQUEST, true));
        }
    } catch (e) {
        console.log(e)
        return next(new APIError(`${e.message}`, httpStatus.BAD_REQUEST, true))
    }

}


exports.multipleConditionLookup = async (req, res, next) => {
    try {

        const result = await userColl.aggregate([
            {
                $lookup: {
                    from: 'salary',
                    let: {
                        user_name: '$username',
                        user_salary: 2000
                    },
                    pipeline: [{
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ['$userName', '$$user_name'] },
                                    { $gte: ['$Salary', '$$user_salary'] }
                                ]
                            }
                        }
                    }],
                    as: 'usersalary'
                }
            },
            // {
            //     $unwind:'$usersalary'
            // },
            // {
            //     $addFields: {
            //         Salary: '$usersalary.Salary'
            //     }
            // },
            // {
            //    $project: {
            //        name: 1,
            //        Salary: 1
            //    }
            // }

            {
                $replaceRoot: {
                    newRoot: {
                        $mergeObjects: [
                            {
                                $arrayElemAt: [
                                    "$usersalary", 0
                                ]
                            },
                            {
                                salary: "$$ROOT.Salary"
                            }
                        ]
                    }
                }
            }
        ]).toArray();
        const obj = resPattern.successPattern(httpStatus.OK, { result }, `success`);
        return res.status(obj.code).json({
            ...obj,
        });
    } catch (e) {
        console.log('error---', e)
        return next(new APIError(`${e.message}`, httpStatus.BAD_REQUEST, true))
    }
}


exports.orOperatorPipeline = async (req, res, next) => {
    try {
        const result = await salaryColl.aggregate(
            [
                //{ $match: { _id: ObjectId("632bee5bc5c7ada2cea96ba7") } },
                { $match: { _id: { $in: [ObjectId("632bee5bc5c7ada2cea96ba7"), ObjectId("632affca575729d8b2f80128")] } } },

                {
                    $project: {
                        _id: 0,
                        a: 1,
                        b: 1,
                        result: {
                            $or: [
                                { $lt: ["$b", "$a"] }
                            ]
                        }
                    }
                }
            ]
        ).toArray();
        console.log('test-----', result)
        const obj = resPattern.successPattern(httpStatus.OK, { result }, `success`);
        return res.status(obj.code).json({
            ...obj,
        });
    } catch (e) {
        console.log('error---', e)
        return next(new APIError(`${e.message}`, httpStatus.BAD_REQUEST, true))
    }
}


exports.dateExpressionOpperators = async (req, res, next) => {
    try {


        // Define stage to add convertedDate field with the converted order_date value
        const dateConversionStage = {
            $addFields: {
                convertedDate: { $toDate: "$createdAt" }
            }
        };
        // Define stage to sort documents by the converted date
        const sortStage = {
            $sort: { "convertedDate": 1 }
        };


        const result = await dateColl.aggregate([

            // {
            //     $project: {
            //         "nycHour": {
            //             $hour: { date: "$date", timezone: "-05:00" }
            //         },
            //         "nycMinute": {
            //             $minute: { date: "$date", timezone: "-05:00" }
            //         },
            //         "gmtHour": {
            //             $hour: { date: "$date", timezone: "GMT" }
            //         },
            //         "gmtMinute": {
            //             $minute: { date: "$date", timezone: "GMT" }
            //         },
            //         "nycOlsonHour": {
            //             $hour: { date: "$date", timezone: "America/New_York" }
            //         },
            //         "nycOlsonMinute": {
            //             $minute: { date: "$date", timezone: "America/New_York" }
            //         }
            //     }
            // }



            // {
            //     $project:
            //     {
            //         year: { $year: "$date" },
            //         month: { $month: "$date" },
            //         day: { $dayOfMonth: "$date" },
            //         hour: { $hour: "$date" },
            //         minutes: { $minute: "$date" },
            //         seconds: { $second: "$date" },
            //         milliseconds: { $millisecond: "$date" },
            //         dayOfYear: { $dayOfYear: "$date" },
            //         dayOfWeek: { $dayOfWeek: "$date" },
            //         week: { $week: "$date" }
            //     }
            // }

            // {
            //     $dateDiff:
            //     {
            //         startDate: "$date",
            //         endDate: "$lastdate",
            //         unit: "week"
            //     }
            //}


            // {
            //     $project: {
            //         date: {
            //             $dateFromParts: {
            //                 'year': 2017, 'month': 2, 'day': 8, 'hour': 12
            //             }
            //         },
            //         date_iso: {
            //             $dateFromParts: {
            //                 'isoWeekYear': 2017, 'isoWeek': 6, 'isoDayOfWeek': 3, 'hour': 12
            //             }
            //         },
            //         date_timezone: {
            //             $dateFromParts: {
            //                 'year': 2016, 'month': 12, 'day': 31, 'hour': 23,
            //                 'minute': 46, 'second': 12, 'timezone': 'America/New_York'
            //             }
            //         }
            //     }
            // }

            // {
            //     $project: {
            //         createdAt: {
            //             $dateFromString: {
            //                 dateString: '$createdAt',
            //                 timezone: 'America/New_York'
            //             }
            //         }
            //     }
            // }

            // {
            //     truncatedOrderDate: {
            //         $dateTrunc: {
            //             date: "$date", unit: "week", binSize: 2,
            //             timezone: "America/Los_Angeles", startOfWeek: "Monday"
            //         }
            //     }
            // }

            dateConversionStage,
            sortStage



        ]).toArray();
        console.log('test-----', result)
        const obj = resPattern.successPattern(httpStatus.OK, { result }, `success`);
        return res.status(obj.code).json({
            ...obj,
        });
    } catch (e) {
        console.log('error---', e)
        return next(new APIError(`${e.message}`, httpStatus.BAD_REQUEST, true))
    }
}


exports.stringExpressionOperators = async (req, res, next) => {
    try {
        const result = await projectColl.aggregate([

            // { $project: { projectNameDescription: { $concat: ["$projectName", "-", "$description"] } } }

            // {
            //     $project:
            //     {
            //         byteLocation: { $indexOfBytes: ["$projectName", "practice"] },
            //     }
            // }

            //{ $project: { projectName: 1, description: { $ltrim: { input: "$description" } } } }

            // { $addFields: { resultObject: { $regexFind: { input: "$projectName", regex: /practice/ } } } }


            // {
            //     $project: {
            //         returnObject: {
            //             $regexFind: { input: "$projectName", regex: /(p(racti)*)ce/ }
            //         }
            //     }
            // }

            // {
            //     $project: {
            //         returnObject: {
            //             $regexFindAll: { input: "$projectName", regex: /(pr(acti)*)ce/ }
            //         }
            //     }
            // }

            // { $addFields: { result: { $regexMatch: { input: "$description", regex: /medicare/ } } } }

            // {
            //     $project:
            //     {
            //         item: { $replaceOne: { input: "$description", find: "medicare", replacement: "red paint" } }
            //     }
            // }

            // {
            //     $addFields:
            //     {
            //         resultObject: { $replaceAll: { input: "$description", find: "medicare", replacement: "BuserInstitute" } }
            //     }
            // }


            // { $project: { projectName: { $split: ["$projectName", " "] }, qty: 1 } },


            // {
            //     $project:
            //     {
            //         projectName: { $toLower: "$projectName" },
            //         description: { $toLower: "$description" }
            //     }
            // }


            // {
            //     $addFields: {
            //         convertedZipCode: { $toString: "$month" }
            //     }
            // },
            // {
            //     $sort: { "convertedZipCode": 1 }
            // }


            {
                $project:
                {
                    projectName: { $toUpper: "$projectName" },
                    description: { $toUpper: "$description" }
                }
            }
        ]).toArray();
        console.log('test-----', result)
        const obj = resPattern.successPattern(httpStatus.OK, { result }, `success`);
        return res.status(obj.code).json({
            ...obj,
        });
    } catch (e) {
        console.log('error---', e)
        return next(new APIError(`${e.message}`, httpStatus.BAD_REQUEST, true))
    }
}


exports.typeExpressionOperators = async (req, res, next) => {
    try {
        const result = await projectColl.aggregate([
            // {
            //     $addFields: {
            //         "isNumber": { $isNumber: "$month" },
            //         "hasType": { $type: "$month" }
            //     }
            // }

            // {
            //     $addFields: {
            //         convertedDate: { $toDate: "$createdAt" }
            //     }
            // }

            // {
            //     $addFields: {
            //        convertedPrice: { $toDecimal: "$month" },
            //        convertedQty: { $toInt: "$month" },
            //     }
            //  }

            {
                $addFields: {
                    degrees: { $toDouble: { $substrBytes: ["$month", 0, 4] } }
                }
            }

            // {
            //     $addFields: {
            //        convertedId: { $toObjectId: "$technologyId" }
            //     }
            //  }


        ]).toArray();
        console.log('test-----', result)
        const obj = resPattern.successPattern(httpStatus.OK, { result }, `success`);
        return res.status(obj.code).json({
            ...obj,
        });
    } catch (e) {
        console.log('error---', e)
        return next(new APIError(`${e.message}`, httpStatus.BAD_REQUEST, true))
    }
}




exports.geoSpatialQuery = async (req, res, next) => {
    try {
        var METERS_PER_MILE = 1609.34
        const result = await projectColl.find(

            //  { location: { $near: [-73.9667, 40.78], $maxDistance: 0.10 } }

            //     {
            //         location:
            //         {
            //             $near:
            //             {
            //                 $geometry: { type: "Point", coordinates: [-73.9667, 40.78] },
            //                 $minDistance: 1000,
            //                 $maxDistance: 5000
            //             }
            //         }
            //     }

            {
                location:
                {
                    $geoWithin:
                        { $centerSphere: [[81.8322, 24.6005], 5 / 3963.2] }
                }
            }

            //{ location: { $nearSphere: { $geometry: { type: "Point", coordinates: [-73.93414657, 40.82302903] }, $maxDistance: 5 * METERS_PER_MILE } } }
        ).toArray();
        console.log('test-----', result)
        const obj = resPattern.successPattern(httpStatus.OK, { result }, `success`);
        return res.status(obj.code).json({
            ...obj,
        });
    } catch (e) {
        console.log('error---', e)
        return next(new APIError(`${e.message}`, httpStatus.BAD_REQUEST, true))
    }
}

exports.geoLocationWithPolygon = async (req, res, next) => {
    try {
        
        var METERS_PER_MILE = 1609.34
        const result = await projectColl.find(
            {
                location: {
                    $geoWithin: {
                        $geometry: {
                            type: "Polygon",
                            coordinates: [[
                                [104.9212999921292, 11.575955591122819],
                                [104.92129194550216, 11.575198826419006],
                                [104.92298978380859, 11.575238241297862],
                                [104.92291736416519, 11.576023910057827],
                                [104.9212999921292, 11.575955591122819]
                            ]],
                        }
                    }
                }
            }).toArray();
        console.log('test-----', result)
        const obj = resPattern.successPattern(httpStatus.OK, { result }, `success`);
        return res.status(obj.code).json({
            ...obj,
        });
    } catch (e) {
        console.log('error---', e)
        return next(new APIError(`${e.message}`, httpStatus.BAD_REQUEST, true))
    }
}