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
const stripe = require('stripe')(process.env.STRIPESECRETKEY)



exports.payment = async (req, res, next) => {

    // stripe.customers.create({
    //     email: req.body.stripeEmail,
    //     source: req.body.stripeToken,
    //     name: 'Shubham Shukla',
    //     address: {
    //         line1: 'gram-post Kitaha, via Jaitwara, satna',
    //         postal_code: '485221',
    //         city: 'satna',
    //         state: 'Madhya Pradesh',
    //         country: 'india'
    //     }
    // })
    // .then((customer) => {
    //     return stripe.charges.create({
    //         amount: '7000',
    //         description: 'Web Developement Product',
    //         currency: 'USD',
    //         customer: customer.id
    //     })
    // })

    await stripe.paymentIntents.create({
        amount: 2000,
        currency: 'usd',
        payment_method_types: ['card'],
    }).then(async (payment) => {

        const confirmPayment = await stripe.paymentIntents.confirm(
            payment.id,
            { payment_method: 'pm_card_visa' }
        );
        console.log(payment)
        const obj = resPattern.successPattern(httpStatus.OK, confirmPayment, `success`);
        return res.status(obj.code).json({
            ...obj,
        });
    }).catch((error) => {
        console.log(error)
        res.send("Error")
    })
};
