const express = require('express');
const helmet = require('helmet');
const session = require("express-session")
const bodyParser = require('body-parser')
const db = require('./config/database');
const APIError = require('./helpers/APIError');
const httpStatus = require('http-status');
const expressValidation = require('express-validation');
const path = require("path")
const cors = require('cors');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
var cookieSession = require('cookie-session');
var csrf = require('csurf');

var passport = require('passport');
var LocalStrategy = require('passport-local');
const dataBase = require('./config/database')
const query = require("./query/query");

var userColl = dataBase.connection("user");


// const passport = require('passport');
// const { intializePassport } = require('./config/passportConfig');


const port = process.env.PORT || 8001
console.log("port..", process.env.PORT);

const app = express();
app.use(helmet());



app.use(bodyParser.urlencoded({ limit: '15gb', extended: false }));
app.use(bodyParser.json({ limit: '15gb' }));
app.use(cors());
app.use(logger('dev'));

app.use(cookieParser());

var csrfProtection = csrf({ cookie: true });
app.use(express.static(path.join(__dirname, 'public')));

app.use(cookieSession({ secret: process.env.EXPRESS_SECREAT }))
app.use(session({
    secret: process.env.EXPRESS_SECREAT,
    resave: true,
    saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

const https = require('https');
const SocketServer = https.createServer(app);

const io = require('socket.io')(SocketServer);
io.on('connection', socket => {
    console.log("Connecting")
    socket.on("new user", function (data) {
        socket.userId = data;
        activeUsers.add(data);
        io.emit("new user", [...activeUsers]);
    });

    socket.on("disconnect", () => {
        activeUsers.delete(socket.userId);
        io.emit("user disconnected", socket.userId);
    });

    socket.on("chat message", function (data) {
        io.emit("chat message", data);
    });

    socket.on("typing", function (data) {
        socket.broadcast.emit("typing", data);
    });
    // client.on('event', data => { /* … */
    //     console.log("Socket Server Connected", data)
    // });
    //client.on('disconnect', () => { console.log("Socket Server DisConnected") });
});




passport.use(new LocalStrategy(
    function async(username, password, done) {
        console.log("Shubuham", username, password,)
        userColl.findOne({ name: username }, function (err, user) {
            console.log(user)
            if (err) { return next(new APIError(`${err}`, httpStatus.BAD_REQUEST, true)); }
            if (!user) { return done(null, false); }
            if (!user.verifyPassword(password)) { return done(null, false); }
            return done(null, user);
        });
    }
));


app.post('/login', passport.authenticate("local"), (req, res) => {

})





db.connection().then(async (database) => {

    module.exports = database


    app.use('/api/auth', require('./routes/auth.route'));
    app.use('/api/technology', require('./routes/technology.route'));
    app.use('/api/project', require('./routes/project.route'));

    app.use('/api/product', require('./routes/product.route'));

    // app.use('/api/csrf', csrfProtection, (req, res, next) => {
    //     res.send({ csrfToken: req.csrfToken() })
    //     console.log("CSRF", req.csrfToken())
    // });


    app.use((err, req, res, next) => {
        if (err instanceof expressValidation.ValidationError) {
            console.log(err)
            // validation error contains errors which is an array of error each containing message[]
            const unifiedErrorMessage = err.errors.map(Error => Error.messages.join('. ')).join(' and ');
            const error = new APIError(unifiedErrorMessage, err.status, true);
            return next(error);
        } else if (!(err instanceof APIError)) {
            console.log(err)
            const apiError = new APIError(err.message, err.status, err.name === 'UnauthorizedError' ? true : err.isPublic);
            return next(apiError);
        }
        return next(err);
    });

    app.use((req, res, next) => {
        const err = new APIError('API Not Found', httpStatus.NOT_FOUND, true);
        return next(err);
    });

    app.use((err, req, res, next) => {
        res.status(err.status).json({
            error: {
                message: err.isPublic ? err.message : httpStatus[err.status],
            }
        });
    }
    );
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    })



}).catch((e) => {
    const err = new APIError(`${e.message}`, httpStatus.NOT_FOUND, true);
    console.log("Error--", err);
})


