var moment = require('moment');
exports.findOne = (collection, query, additionalParameter) => {
    return new Promise((resolve, reject) => {
        // console.log("additionalParameter",additionalParameter,query,collection);
        additionalParameter == undefined ?
            collection.findOne(query, (err, queryResult) => {
                if (err) {
                    return reject({ message: "DB query Failed" });
                } else {
                    // console.log("queryResult",queryResult)
                    resolve(queryResult);
                }
            }) : collection.findOne(query, additionalParameter, (err, queryResult) => {
                if (err) {
                    return reject({ message: "DB query Failed" });
                } else {
                    // console.log("queryResult",queryResult)
                    resolve(queryResult);
                }
            })
    })
}
exports.findByPagination = (collection, query1, searchText, pageNo, limit) => {
    return new Promise(async (resolve, reject) => {
        let query = await collection.find(query1,
            searchText,
            // { "password": 0 }
        ).skip((pageNo - 1) * limit).limit(limit),
            list = await query.toArray(),
            countTotal = await query.count();
        resolve({ totalCount: countTotal, list: list })
    })
}
exports.createPagination = (collection, query1, skip, limit) => {
    return new Promise(async (resolve, reject) => {
        let query = await collection.find(query1, { skip: skip, limit: limit })
        list = await query.toArray(),
            countTotal = await query.count();
        resolve({ totalCount: countTotal, list: list })

    })
}

exports.insert = (collection, query) => {
    query.createdAt = moment().utc().format();
    return new Promise((resolve, reject) => {
        collection.insert(query, (err, recordSaved) => {
            if (recordSaved) {
                // console.log("recordSaved",recordSaved)
                resolve(recordSaved)
            } else {
                console.log("err", err)
                reject(err)
            }
            // err ? reject(err) : resolve(recordSaved)
        })
    })
}

exports.insertMany = (collection, query) => {
    // query.createdAt= moment().utc().format();
    return new Promise((resolve, reject) => {
        collection.insertMany(query, (err, recordSaved) => {
            if (recordSaved) {
                // console.log("recordSaved",recordSaved)
                resolve(recordSaved)
            } else {
                console.log("err", err)
                reject(err)
            }
            // err ? reject(err) : resolve(recordSaved)
        })
    })
}

exports.updateMany = (collection, query, setParameters, getResponseBack) => {
    return new Promise((resolve, reject) => {
        collection.updateMany(query, setParameters, getResponseBack, (err, recordSaved) => {
            console.log("recordSaved", recordSaved);
            err ? reject(err) : resolve(recordSaved)
        })
    })
}

exports.findOneAndUpdate = (collection, query, setParameters, getResponseBack) => {
    return new Promise((resolve, reject) => {
        collection.findOneAndUpdate(
            query,
            setParameters,
            getResponseBack,
            (err, recordSaved) => {
                err ? reject(err) : resolve(recordSaved);
            }
        );
    })
}

exports.deleteMany = (collection, query) => {
    return new Promise((resolve, reject) => {
        collection.deleteMany(query, (err, deletedRecords) => {
            err ? reject(err) : resolve(deletedRecords)
        })
    })
}

exports.deleteOne = (collection, query) => {
    return new Promise((resolve, reject) => {
        collection.deleteOne(query, (err, deletedRecords) => {
            if (err) {
                reject({ message: "DB query Failed" });
            } else {
                resolve(deletedRecords)
            }
            // err ? reject(err) : resolve(deletedRecords)
        })
    })
}

exports.find = (collection, query1, additionalParameter, sorting) => {

    return new Promise((resolve, reject) => {
        additionalParameter == undefined ?
            collection.find(query1).sort(sorting).toArray((err, queryResult) => {
                if (err) {
                    return reject({ message: "DB query Failed" });
                } else {
                    resolve(queryResult);
                }
            }) : collection.find(query1, additionalParameter).sort(sorting).toArray((err, queryResult) => {
                if (err) {
                    return reject({ message: "DB query Failed" });
                } else {
                    resolve(queryResult);
                }
            })
    })
}
exports.findWithLimit = (collection, query1, additionalParameter, sorting, count, skipCount) => {
    return new Promise((resolve, reject) => {
        additionalParameter == undefined ?
            collection.find(query1).sort(sorting).limit(count).skip(skipCount ? skipCount : 0).toArray((err, queryResult) => {
                if (err) {
                    return reject({ message: "DB query Failed" });
                } else {
                    resolve(queryResult);
                }
            }) : collection.find(query1, additionalParameter).sort(sorting).limit(count).skip(skipCount ? skipCount : 0).toArray((err, queryResult) => {
                if (err) {
                    return reject({ message: "DB query Failed" });
                } else {
                    resolve(queryResult);
                }
            })
    })
}
exports.aggregate = (collection, query) => {
    return new Promise((resolve, reject) => {
        collection.aggregate(query, { cursor: { batchSize: 1 } }, (err, queryResult) => {
            err ? reject(err) : resolve(queryResult)
        })
    })
}
exports.findDistinct = (collection, field, query, additionalParameter) => {
    return new Promise((resolve, reject) => {

        collection.distinct(field, query ? query : {}, additionalParameter ? additionalParameter : {}, (err, queryResult) => {
            if (err) {
                return reject({ message: "DB query Failed" });
            } else {
                resolve(queryResult);
            }
        })
    })
}
exports.count = (collection, query) => {
    return new Promise((resolve, reject) => {
        collection.count(query, (err, queryResult) => {
            if (err) {
                return reject({ message: "DB query Failed" });
            } else {
                resolve(queryResult);
            }
        })
    })
}