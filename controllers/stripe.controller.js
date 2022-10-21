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


exports.retriveSession = async (req, res, next) => {
    try {
        const session = await stripe.checkout.sessions.retrieve(
            req.query.sessionId
        );
        let obj = resPattern.successPattern(
            httpStatus.OK,
            session,
            "success"
        );
        return res.status(obj.code).json(obj);

    } catch (e) {
        return next(new APIError(`${e.message}`, httpStatus.BAD_REQUEST, true));
    }
};

exports.Webhook = async (req, res, next) => {
    try {
        const event = request.body;

        // Handle the event
        switch (event.type) {
            case 'payment_intent.succeeded':
                const paymentIntent = event.data.object;
                console.log('PaymentIntent was successful!');
                break;
            case 'payment_method.attached':
                const paymentMethod = event.data.object;
                console.log('PaymentMethod was attached to a Customer!');
                break;
            // ... handle other event types
            default:
                console.log(`Unhandled event type ${event.type}`);
        }

        // Return a 200 response to acknowledge receipt of the event
        res.json({ received: true });

        let obj = resPattern.successPattern(
            httpStatus.OK,
            session,
            "success"
        );
        return res.status(obj.code).json(obj);

    } catch (e) {
        return next(new APIError(`${e.message}`, httpStatus.BAD_REQUEST, true));
    }
};

exports.checkoutSessionLineItems
    = async (req, res, next) => {
        try {
            const Stripe = require('stripe');
            const stripe1 = Stripe('sk_test_51Lq9pASJJI3Ky1gekqAIaZXAxUfSmmUwC0gJw9PXd3UcbXM9iJnaCTTTtf4geZ5Akk1r5npAIbfhTNf3j9jJL4te00Bp0kKY91');

            const sessions = await stripe.checkout.sessions.list({
                limit: 3,
            });

            console.log("test2", sessions)

            const obj = resPattern.successPattern(httpStatus.OK, { result: sessions }, `success`);
            return res.status(obj.code).json({
                ...obj,
            });

        } catch (e) {
            return next(new APIError(`${e.message}`, httpStatus.BAD_REQUEST, true));
        }
    };