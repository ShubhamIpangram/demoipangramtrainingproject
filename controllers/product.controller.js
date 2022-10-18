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
const orderColl = db.collection("order");

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

exports.filterProductDetails = async (req, res, next) => {
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
                        from: "category",
                        let: { gid: "$categoryId" },
                        pipeline: [
                            { $match: { name: "House hold and Computer accessories" } }
                        ],
                        "as": "Category"
                    }
                },
                {
                    $facet: {
                        product: [{ $count: "totalProduct" }],
                        productList: [{ $limit: 10 }]
                    }
                },
                { $sort: { _id: -1 } },
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

exports.ElectronicandFashionProductList = async (req, res, next) => {
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
                        from: "category",
                        let: { gid: "$categoryId" },
                        pipeline: [
                            { $match: { name: "Electronic and Fashion" } }
                        ],
                        "as": "Category"
                    }
                },
                {
                    $facet: {
                        product: [{ $count: "totalProduct" }],
                        productList: [{ $limit: 35 }]
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

exports.productListUnder500 = async (req, res, next) => {
    try {
        const result = await productColl.aggregate(
            [
                {
                    $match: {
                        $expr: {
                            $and: [
                                { $eq: [2020, { $year: "$launchedDate" }] },
                                { $lte: ["$price", 500] },
                            ]
                        }
                    },
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

exports.totalProductPrice = async (req, res, next) => {
    try {
        const result = await productColl.aggregate(
            [
                {
                    $match: {
                        $expr: {
                            $eq: [2019, { $year: "$launchedDate" }]
                        },
                    },
                },
                {
                    $project: {
                        "productName": 1,
                        "price": {
                            $sum: "$price"
                        }
                    }
                }
            ]
        ).toArray();

        const priceRes = result.map(data => {
            return data.price
        })

        const sum = priceRes.reduce(function (x, y) {
            return x + y;
        }, 0);
        console.log("total Price", sum)

        const resultRes = [{
            totalProduct: priceRes.length,
            totalPrice: sum
        }]

        const obj = resPattern.successPattern(httpStatus.OK, { result: resultRes }, `success`);
        return res.status(obj.code).json({
            ...obj,
        });
    } catch (e) {
        console.log('error---', e)
        return next(new APIError(`${e.message}`, httpStatus.BAD_REQUEST, true))
    }
}



exports.productListWithotSkuNumber = async (req, res, next) => {
    try {
        const result = await query.find(productColl);
        result.forEach((el) => {
            delete el['skuNumber']
        })
        const obj = resPattern.successPattern(httpStatus.OK, { result }, `success`);
        return res.status(obj.code).json({
            ...obj,
        });
    } catch (e) {
        console.log('error---', e)
        return next(new APIError(`${e.message}`, httpStatus.BAD_REQUEST, true))
    }
}


exports.mostUsefulJavaScriptFunction = async (req, res, next) => {
    try {

        // const persons = [
        //     {
        //         name: 'Person 1',
        //         age: 32
        //     },

        //     {
        //         name: 'Person 2',
        //         age: 40
        //     },
        // ];

        // let foundOver35 = false;

        // for (let i = 0; i < persons.length; i++) {
        //     if (persons[i].age > 35) {
        //         foundOver35 = true;
        //         break;
        //     }
        // }

        // if (foundOver35) {
        //     console.log("Yup, there are a few people here!")
        // }

        // if(persons.some(person => {
        //     return person.age > 35
        // })) {
        //     console.log("Found some people!")
        // }




        // const entries = [
        //     {
        //         id: 1
        //     },

        //     {
        //         id: 2
        //     },

        //     {
        //         id: 3
        //     },
        // ];

        // if (entries.every(entry => {
        //     return Number.isInteger(entry.id) && entry.id > 0;
        // })) {
        //     console.log("All the entries have a valid id")
        // } else {
        //     console.log("invalid entries")
        // }

        // const numbers = [1, 2, 3, 4, 5];
        // console.log(numbers.includes(4));
        // const name = "Ankush";
        // console.log(name.includes('ank')); // false, because first letter is in small caps
        // console.log(name.includes('Ank')); // true, as expected



        // const headline = "And in tonight's special, the guest we've all been waiting for!";
        // const startIndex = headline.indexOf('the');
        // const endIndex = headline.indexOf('waiting');
        // const newHeadline = headline.slice(startIndex, endIndex);
        // console.log(newHeadline); // guest we've all been

        // const items = ['eggs', 'milk', 'cheese', 'bread', 'butter'];
        // items.splice(2, 1);
        // console.log(items); // [ 'eggs', 'milk', 'bread', 'butter' ]


        // const items = ['eggs', 'milk', 'cheese', 'bread', 'butter'];
        // items.shift()
        // console.log(items); // [ 'milk', 'cheese', 'bread', 'butter' ]

        // const items = ['eggs', 'milk'];
        // items.unshift('bread')
        // console.log(items); // [ 'bread', 'eggs', 'milk' ]

        const heights = [1, 2, 4, 5, 6, 7, 1, 1];
        heights.fill(0);
        console.log(heights); // [0, 0, 0, 0, 0, 0, 0, 0]

        const heights2 = [1, 2, 4, 5, 6, 7, 1, 1];
        heights2.fill(0, 4);
        console.log(heights2); // [1, 2, 4, 5, 0, 0, 0, 0]

        const obj = resPattern.successPattern(httpStatus.OK, { result: heights }, `success`);
        return res.status(obj.code).json({
            ...obj,
        });

    } catch (e) {
        console.log('error---', e)
        return next(new APIError(`${e.message}`, httpStatus.BAD_REQUEST, true))
    }
}


exports.updateFieldsInsideArray = async (req, res, next) => {
    try {

        const result = await orderColl.update({
            _id: ObjectId("6346aef9074ab58ae1f64472")
        },
            [
                {
                    $set: {
                        processList: {
                            $map: {
                                "input": "$processList",
                                "in": {
                                    $cond: [
                                        {
                                            $eq: [
                                                "$$this.id",
                                                "60b0f0e9659a3b001c235300"
                                            ]
                                        },
                                        {
                                            $mergeObjects: [
                                                "$$this",
                                                {
                                                    "isCompleted": true
                                                }
                                            ]
                                        },
                                        "$$this"
                                    ]
                                }
                            }
                        }
                    }
                },
                // {
                //     "$set": {
                //         "percentageCompleted": {
                //             "$multiply": [
                //                 {
                //                     "$divide": [
                //                         {
                //                             "$size": {
                //                                 "$filter": {
                //                                     "input": "$processList",
                //                                     "as": "process",
                //                                     "cond": {
                //                                         "$eq": [
                //                                             "$$process.isCompleted",
                //                                             true
                //                                         ]
                //                                     }
                //                                 }
                //                             }
                //                         },
                //                         {
                //                             "$size": "$processList"
                //                         }
                //                     ]
                //                 },
                //                 100
                //             ]
                //         }
                //     }
                // }
            ])
        const obj = resPattern.successPattern(httpStatus.OK, { result }, `success`);
        return res.status(obj.code).json({
            ...obj,
        });
    } catch (e) {
        console.log('error---', e)
        return next(new APIError(`${e.message}`, httpStatus.BAD_REQUEST, true))
    }
}


exports.findDocumentMonthWise = async (req, res, next) => {
    try {

        const result = await productColl.aggregate([
            {
                "$redact": {
                    "$cond": [
                        { "$eq": [{ "$month": "$launchedDate" }, 9] },
                        "$$KEEP",
                        "$$PRUNE"
                    ]
                }
            }
        ]).toArray();

        const result1 = await productColl.aggregate([
            {
                "$project": {
                    "month": { "$month": "$launchedDate" },
                    "year": { "$year": "$launchedDate" },
                    "productName": 1,
                    "price": 1,
                    "launchedDate": 1
                }
            },
            { "$match": { "month": 10, "year": 2016 } }
        ]).toArray();

        const obj = resPattern.successPattern(httpStatus.OK, { result1 }, `success`);
        return res.status(obj.code).json({
            ...obj,
        });
    } catch (e) {
        console.log('error---', e)
        return next(new APIError(`${e.message}`, httpStatus.BAD_REQUEST, true))
    }
}

