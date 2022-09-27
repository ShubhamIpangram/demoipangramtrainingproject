const db = require("../index");
const productColl = db.collection("product");
const categoryColl = db.collection("category");
const APIError = require("../helpers/APIError");
const resPattern = require("../helpers/resPattern");
const httpStatus = require("http-status");
const query = require("../query/query");
const bcrypt = require("bcrypt");
const moment = require("moment");
const { ObjectId } = require('mongodb');
const { productValidation } = require('../helpers/validation');
const { generateNumber } = require("../helpers/commonfile");


exports.createProduct = async (req, res, next) => {
    try {
        const { errors, isValid } = await productValidation(req.body);
        if (!isValid) {
            const message = Object.values(errors);
            return next(new APIError(`${message}`, httpStatus.BAD_REQUEST, true));
        }

        const { productName, price, launchedDate, categoryId } = req.body;

        let parseddate = moment(launchedDate, "DD.MM.YYYY").add(1, "days");
        const launchDate = parseddate.toISOString();
        console.log("date--------------------", launchDate)
        const requestdata = {
            productName: req.body.productName,
        };

        const productRes = await query.findOne(productColl, requestdata);
        if (productRes) {
            const message = `product already exists`;
            return next(new APIError(`${message}`, httpStatus.BAD_REQUEST, true));
        } else {


            const productData = req.body;
            const currentDate = moment().format("YYYY-MM-DD[T]HH:mm:ss.SSS[Z]"); //YYYY-MM-DD[T]HH:mm:ss.SSS[Z]''  YYYY-MM-DDThh:mm:ssn
            productData.createdAt = currentDate;
            productData.categoryId = ObjectId(categoryId);
            productData.skuNumber = generateNumber();
            productData.launchedDate = new Date(launchDate);
            let insertdata;
            //const insertdata = await productColl.insert(productDate);
            insertdata = await query.insert(productColl, productData);

            console.log("insert data::------", insertdata);
            if (insertdata) {

                const categoryData = await query.findOne(categoryColl, { _id: ObjectId(categoryId) });
                const result = await query.findOneAndUpdate(categoryColl,
                    { _id: ObjectId(categoryId) },
                    {
                        $set: {
                            "productNumber": categoryData.productNumber + 1,
                        },
                    },
                    { returnOriginal: false }
                );

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


exports.productList2016and2022 = async (req, res, next) => {
    try {


        const date1 = "2016-01-01";
        let parseddate = moment("24-09-2022", "DD.MM.YYYY").add(1, "days");

        const result = await productColl.aggregate(
            [
                {
                    $match: {
                        $expr: {
                            $or: [
                                { $eq: [2016, { $year: "$launchedDate" }] },
                                { $eq: [2022, { $year: "$launchedDate" }] }
                            ]
                        }
                    }
                },
                {
                    $lookup: {
                        from: 'category',
                        localField: 'categoryId',
                        foreignField: '_id',
                        as: 'Category'
                    }
                },
            ]
        ).toArray();
        const obj = resPattern.successPattern(httpStatus.OK, { result }, `success`);
        return res.status(obj.code).json({
            ...obj,
        });
    } catch (e) {
        console.log('error---', e)
        return next(new APIError(`${e.message}`, httpStatus.BAD_REQUEST, true))
    }
}

exports.productListBetween2017and2021 = async (req, res, next) => {
    try {
        const result = await productColl.aggregate(
            [

                {
                    $match: {
                        $expr: {
                            $and: [
                                { $lte: [2017, { $year: "$launchedDate" }] },
                                { $gte: [2021, { $year: "$launchedDate" }] }
                            ]
                        }
                    }
                },
                {
                    $lookup: {
                        from: 'category',
                        localField: 'categoryId',
                        foreignField: '_id',
                        as: 'Category'
                    }
                },
            ]
        ).toArray();
        const obj = resPattern.successPattern(httpStatus.OK, { result }, `success`);
        return res.status(obj.code).json({
            ...obj,
        });
    } catch (e) {
        console.log('error---', e)
        return next(new APIError(`${e.message}`, httpStatus.BAD_REQUEST, true))
    }
}



exports.productList2019priceBetween500to1000 = async (req, res, next) => {
    try {
        const result = await productColl.aggregate(
            [
                {
                    $match: {
                        $expr: {
                            $and: [
                                { $eq: [2019, { $year: "$launchedDate" }] },
                                { $gte: ["$price", 500] },
                                { $lte: ["$price", 1000] },
                            ]
                        }
                    },
                },
                {
                    $lookup: {
                        from: 'category',
                        localField: 'categoryId',
                        foreignField: '_id',
                        as: 'Category'
                    }
                },

            ]
        ).toArray();
        const obj = resPattern.successPattern(httpStatus.OK, { result }, `success`);
        return res.status(obj.code).json({
            ...obj,
        });
    } catch (e) {
        console.log('error---', e)
        return next(new APIError(`${e.message}`, httpStatus.BAD_REQUEST, true))
    }
}


exports.categoryWiseProductList2020 = async (req, res, next) => {
    try {
        const result = await productColl.aggregate(
            [
                {
                    $match: {
                        $expr: {
                            $eq: [2020, { $year: "$launchedDate" }]
                        },
                        categoryId: ObjectId("632ebc0ce833e72d7653156d"),
                    },
                },
                {
                    $lookup: {
                        from: 'category',
                        localField: 'categoryId',
                        foreignField: '_id',
                        as: 'Category'
                    },

                },
                { $count: "totalProduct" }
            ]
        ).toArray();
        const obj = resPattern.successPattern(httpStatus.OK, { result }, `success`);
        return res.status(obj.code).json({
            ...obj,
        });
    } catch (e) {
        console.log('error---', e)
        return next(new APIError(`${e.message}`, httpStatus.BAD_REQUEST, true))
    }
}


exports.desendingcategoryWiseProductList2020 = async (req, res, next) => {
    try {
        const result = await productColl.aggregate(
            [
                {
                    $match: {
                        $expr: {
                            $eq: [2020, { $year: "$launchedDate" }]
                        },
                        categoryId: ObjectId("632ebcc3e833e72d7653156e"),
                    },
                },
                {
                    $lookup: {
                        from: 'category',
                        localField: 'categoryId',
                        foreignField: '_id',
                        as: 'Category'
                    },

                },
                { $sort: { _id: -1 } }
            ]
        ).toArray();
        const obj = resPattern.successPattern(httpStatus.OK, { result }, `success`);
        return res.status(obj.code).json({
            ...obj,
        });
    } catch (e) {
        console.log('error---', e)
        return next(new APIError(`${e.message}`, httpStatus.BAD_REQUEST, true))
    }
}


exports.productListSortAndCount = async (req, res, next) => {
    try {
        const result = await productColl.aggregate(
            [
                {
                    $match: {
                        $expr: {
                            $eq: [2020, { $year: "$launchedDate" }]
                        },
                    },
                },
                {
                    $lookup: {
                        from: 'category',
                        localField: 'categoryId',
                        foreignField: '_id',
                        as: 'Category'
                    },

                },
                {
                    $facet: {
                        product: [{ $count: "totalProduct" }],
                        productList: [{ $limit: 10 }]
                    }
                },
                { $sort: { _id: -1 } }
            ]
        ).toArray();
        const obj = resPattern.successPattern(httpStatus.OK, { result }, `success`);
        return res.status(obj.code).json({
            ...obj,
        });
    } catch (e) {
        console.log('error---', e)
        return next(new APIError(`${e.message}`, httpStatus.BAD_REQUEST, true))
    }
}