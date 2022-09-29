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
const csurf = require('csurf');
const cookieParser = require('cookie-parser');


const port = process.env.PORT || 8001
console.log("port..", process.env.PORT);

const app = express();
app.use(helmet());


const csrfMiddleware = csurf({
    cookie: true
});
app.use(bodyParser.urlencoded({ limit: '15gb', extended: false }));
app.use(bodyParser.json({ limit: '15gb' }));
app.use(cors());
app.use(logger('dev'));

app.use(cookieParser());
app.use(csrfMiddleware);

app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: process.env.EXPRESS_SECREAT,
    resave: true,
    saveUninitialized: true
}));

db.connection().then((database) => {

    module.exports = database
    app.use('/api/auth', require('./routes/auth.route'));
    app.use('/api/technology', require('./routes/technology.route'));
    app.use('/api/project', require('./routes/project.route'));

    app.use('/api/product', require('./routes/product.route'));

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
}).catch(() => {
    const err = new APIError('server not found', httpStatus.NOT_FOUND, true);
    return next(err);
})
