
const db = require('./database');
const userColl = db.connection("user");
const APIError = require("../helpers/APIError");
const resPattern = require("../helpers/resPattern");
const httpStatus = require("http-status");
const query = require("../query/query");
const LocalStrategy = require('passport-local').Strategy;


exports.intializePassport = (passport) => {

    passport.use(new LocalStrategy(async (username, password, done) => {

        console.log("Shubham--", passport, username, password)
        try {
            const user = await query.findOne(userColl, username);
            console.log("test-", user)
            if (!user) return done(null, false);

            if (user.password !== password) return done(null, false);
            return done(null, user)
        } catch (err) {
            console.log("test-", err)
            return done(err, false)
        }
    }));

    passport.serializeUser((user, done) => {
        done(null, user.id)
    })

    passport.deserializeUser(async (id, done) => {

        try {
            const user = await query.findOne(userColl, id);
            done(null, user);
        } catch (err) {
            console.log(err)
            done(err, false)
        }
    })
}

