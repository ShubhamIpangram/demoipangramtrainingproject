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
const itemColl = db.collection("items")
const productColl = db.collection("product");
//const fetch = require("node-fetch");
const axios = require("axios")
const orderColl = db.collection("order");

//const lodash = require("lodash");
const _ = require("underscore");
const R = require("ramda");
const dayjs = require("dayjs");
const { format, formatDistance, formatRelative, subDays } = require("date-fns")






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

exports.filterMongodbaggregation = async (req, res, next) => {
    try {
        const result = await itemColl.aggregate([
            {
                $project: {
                    items: {
                        $filter: {
                            input: "$items",
                            as: "item",
                            cond: { $gte: ["$$item.price", 500] }
                        }
                    }
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

exports.mapMongodbaggregation = async (req, res, next) => {
    try {
        const result = await itemColl.aggregate([
            {
                $project:
                {
                    adjustedGrades:
                    {
                        $map:
                        {
                            input: "$numbers",
                            as: "grade",
                            in: { $add: ["$$grade", 10] }
                        }
                    }
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

exports.camparisionOperators = async (req, res, next) => {
    try {
        const result = await productColl.aggregate([
            {
                $project:
                {
                    productName: 1,
                    launchedDate: 1,
                    price: 1,
                    productPrice: { $ne: ["$price", 600] },
                    _id: 0
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

exports.practiceNodejsModule = async (req, res, next) => {
    try {

        // const nums = lodash.range(1, 9);
        // // => [1, 2, 3, 4, 5, 6, 7, 8, 9]
        // const chunks = lodash.chunk(nums, 2);
        // // => [[1, 2, 3], [4, 5, 6], [7, 8, 9]]
        // const right = lodash.takeRight(nums, 2);
        // console.log('test-----', right)

        // const list = [[5, 1, 7], [3, 2, 1]];
        // const underExample = _.invoke(list, 'sort');


        // const double = x => x * 2;
        // const test1 = R.map(double, [1, 2, 3]);
        // // => [2, 4, 6]
        // const test2 = R.map(double, { x: 1, y: 2, z: 3 });


        const dateRes = dayjs().startOf('month').add(5, 'day').set('year', 2022).format('YYYY-MM-DD HH:mm:ss');

        // const dateRes1 = format(new Date(), '[Today is a] dddd')
        // //=> "Today is a Wednesday"
        // const dateRes2 = formatDistance(subDays(new Date(), 3), new Date())
        // //=> "3 days ago"
        // const dateRes3 = formatRelative(subDays(new Date(), 3), new Date())
        // //=> "last Friday at 7:26 p.m."


        const obj = resPattern.successPattern(httpStatus.OK, { result: dateRes }, `success`);
        return res.status(obj.code).json({
            ...obj,
        });
    } catch (e) {
        console.log('error---', e)
        return next(new APIError(`${e.message}`, httpStatus.BAD_REQUEST, true))
    }
}


exports.practiceMongodbPipeline = async (req, res, next) => {
    try {

        const result = await salaryColl.aggregate(
            [
                {
                    $project:
                    {
                        "name": 1,
                        "summary":
                        {
                            $switch:
                            {
                                branches: [
                                    {
                                        case: { $gte: [{ $avg: "$scores" }, 90] },
                                        then: "Doing great!"
                                    },
                                    {
                                        case: {
                                            $and: [{ $gte: [{ $avg: "$scores" }, 80] },
                                            { $lt: [{ $avg: "$scores" }, 90] }]
                                        },
                                        then: "Doing pretty well."
                                    },
                                    {
                                        case: { $lt: [{ $avg: "$scores" }, 80] },
                                        then: "Needs improvement."
                                    }
                                ],
                                default: "No scores found."
                            }
                        }
                    }
                }
            ]
        ).toArray();

        const result1 = await salaryColl.aggregate(
            [
                {
                    $project:
                    {
                        name: 1,
                        discount:
                        {
                            $cond: { if: { $gte: ["$Salary", 15000] }, then: "Good Salary", else: "Low Salary" }
                        }
                    }
                }
            ]
        ).toArray();


        const result2 = await salaryColl.aggregate(
            [
                {
                    $project:
                    {
                        name: 1,
                        discount:
                        {
                            $cond: [{ $gte: ["$Salary", 15000] }, "Good Salary", "Low Salary"]
                        }
                    }
                }
            ]
        ).toArray();

        const id = ObjectId("632ad5e01080cd9c6de230fa");
        const { skip, limit, searchText } = req.query;

        const result4 = await projectColl.aggregate([
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
                $unwind: "$technologys"
            },
            {
                $lookup: {
                    from: 'launguage',
                    localField: 'technologys.languageId',
                    foreignField: '_id',
                    as: 'technologys.language'
                }
            },

            { $project: { _id: 1, projectName: 1, description: 1, createdAt: 1, technologys: 1, language: 1 } },
        ]).toArray();


        const result5 = await salaryColl.aggregate(
            [
                {
                    $project:
                    {
                        adjustedScores:
                        {
                            $map:
                            {
                                input: "$scores",
                                as: "score",
                                in: { $add: ["$$score", 10] }
                            }
                        }
                    }
                }
            ]
        ).toArray();



        // const result6 = await salaryColl.aggregate(
        //     [
        //         {
        //             $group:
        //             {
        //                 name:
        //                 {
        //                     $top:
        //                     {
        //                         output: ["$name", "$Salary"],
        //                         sortBy: { "Salary": -1 }
        //                     }
        //                 }
        //             }
        //         }
        //     ]
        // ).toArray();

        const result7 = await productColl.aggregate([
            {
                $project: {
                    date: {
                        $dateToParts: { date: "$launchedDate" }
                    },
                    price: 1
                }
            },
            {
                $group: {
                    _id: {
                        date: {
                            year: "$date.year",
                            month: "$date.month",
                            day: "$date.day"
                        }
                    },
                    avgPrice: { $avg: "$price" }
                }
            }
        ]).toArray();

        console.log('test-----', result4)
        const obj = resPattern.successPattern(httpStatus.OK, { result: result7 }, `success`);
        return res.status(obj.code).json({
            ...obj,
        });
    } catch (e) {
        console.log('error---', e)
        return next(new APIError(`${e.message}`, httpStatus.BAD_REQUEST, true))
    }
}

exports.groupBYMultipleFields = async (req, res, next) => {
    try {
        const result = await dateColl.aggregate([
            {
                $group: {
                    _id: {
                        price: "$price",
                        quantity: "$quantity"
                    }
                }
            },
            {
                $group: {
                    _id: "$_id.price",
                    count: {
                        $sum: 1
                    }
                }
            },
            {
                $sort: {
                    count: -1
                }
            }
        ]).toArray();

        const result1 = await productColl.distinct("price");

        const url = 'https://www.geeksforgeeks.org/difference-between-fetch-and-axios-js-for-making-http-requests/?ref=leftbar-rightbar'
        // const fetchData = await fetch('path-to-the-resource-to-be-fetched');

        const axiousData = await axios.get(url);
        console.log(axiousData.data);

        const result2 = await orderColl.aggregate([
            {
                $lookup: {
                    from: "items",
                    localField: "item",    // field in the orders collection
                    foreignField: "item",  // field in the items collection
                    as: "fromItems"
                }
            },
            {
                $replaceRoot: {
                    newRoot: {
                        $mergeObjects: [{
                            $arrayElemAt: ["$fromItems", 0]
                        },
                            "$$ROOT"]
                    }
                }
            },
            { $project: { fromItems: 0 } }
        ]).toArray();

        console.log(result2)
        const obj = resPattern.successPattern(httpStatus.OK, { result }, `success`);
        return res.status(obj.code).json({
            ...obj,
        });
    } catch (e) {
        console.log('error---', e)
        return next(new APIError(`${e.message}`, httpStatus.BAD_REQUEST, true))
    }
}