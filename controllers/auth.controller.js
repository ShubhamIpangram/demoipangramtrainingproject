const { generateOTP, sendEmail, generatePassword, encrypt, sendSesEmail } = require("../helpers/commonfile");
const db = require("../index");
const userColl = db.collection("user");
const APIError = require("../helpers/APIError");
const resPattern = require("../helpers/resPattern");
const httpStatus = require("http-status");
const query = require("../query/query");
const bcrypt = require("bcrypt");
const moment = require("moment");
const jwt = require("jsonwebtoken");
const fs = require('fs');
const { ObjectId } = require('mongodb');
const { signInValidation, signUpValidation, emailValidation, resetPasswordValidation, checkId } = require('../helpers/validation');
const os = require('os');
const dns = require('dns');
const schedule = require('node-schedule');

const privateKey = fs.readFileSync('C:/Windows/System32/drivers/etc/private.key',
    { encoding: 'utf8', flag: 'r' });

exports.login = async (req, res, next) => {
    try {
        const { errors, isValid } = await signInValidation(req.body);

        if (!isValid) {
            const message = Object.values(errors);
            return next(new APIError(`${message}`, httpStatus.BAD_REQUEST, true));
        }

        const { password } = req.body;
        const reqData = { email: req.body.email };

        // find user
        let user = await query.findOne(userColl, reqData);
        if (!user || user.password == null) {
            const message = `Incorrect email or password.`;
            return next(new APIError(`${message}`, httpStatus.BAD_REQUEST, true));
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) {
            const currentDate = moment().format("YYYY-MM-DD[T]HH:mm:ss.SSS[Z]"); //YYYY-MM-DD[T]HH:mm:ss.SSS[Z]''  YYYY-MM-DDThh:mm:ssn
            const token = encrypt(jwt.sign(
                { _id: user._id, mobile_no: user.mobile_no },
                privateKey, { algorithm: 'RS256' }
            ));
            delete user["password"];
            let obj = resPattern.successPattern(
                httpStatus.OK,
                { user, token },
                "success"
            );
            return res.status(obj.code).json(obj);
        } else {
            const message = `Incorrect email or password.`;
            return next(new APIError(`${message}`, httpStatus.BAD_REQUEST, true));
        }
    } catch (e) {
        return next(new APIError(`${e.message}`, httpStatus.BAD_REQUEST, true));

    }
};

exports.signup = async (req, res, next) => {
    try {

        const { errors, isValid } = await signUpValidation(req.body);
        if (!isValid) {
            const message = Object.values(errors);
            return next(new APIError(`${message}`, httpStatus.BAD_REQUEST, true));
        }

        const requestdata = {
            $or: [{ mobile_no: req.body.mobile_no }, { email: req.body.email }],
        };

        const userEmail = await query.findOne(userColl, requestdata);
        if (userEmail) {
            const message = `You have already registered with this mobile number or email`;
            return next(new APIError(`${message}`, httpStatus.BAD_REQUEST, true));
        } else {
            const user = req.body;
            const currentDate = moment().format("YYYY-MM-DD[T]HH:mm:ss.SSS[Z]"); //YYYY-MM-DD[T]HH:mm:ss.SSS[Z]''  YYYY-MM-DDThh:mm:ssn
            user.otp = "";
            user.expireTime = "";
            user.password = generatePassword(req.body.password);
            user.createdAt = new Date(currentDate);
            const insertdata = await query.insert(userColl, user);

            console.log("insert data::------", insertdata);
            if (insertdata) {
                delete insertdata.ops[0]["password"];
                const obj = resPattern.successPattern(
                    httpStatus.OK,
                    insertdata.ops[0],
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


exports.userImageUpload = async (req, res, next) => {
    try {
        const id = ObjectId(req.params.id);
        const bodyData = req.body;

        if (req.file) {
            bodyData.profileImage = "/uploads/" + req.file.filename;
        }
        const result = await query.findOneAndUpdate(userColl,
            { _id: id },
            { $set: bodyData },
            { returnOriginal: false },
            { new: true }
        );

        delete result.value["password"];
        const obj = resPattern.successPattern(httpStatus.OK, result.value, `success`);
        return res.status(obj.code).json({
            ...obj,
        });
    } catch (e) {
        return next(new APIError(`${e.message}`, httpStatus.BAD_REQUEST, true));
    }
}

exports.multipleImageUpload = async (req, res, next) => {
    try {
        const id = ObjectId(req.params.id);
        const bodyData = req.body;

        if (req.files.documentImage) {
            bodyData.documentImage =
                "uploads/" +
                req.files.documentImage[0].filename;
        }

        if (req.files.profile) {
            bodyData.profile =
                "uploads/" +
                req.files.profile[0].filename;
        }

        const result = await query.findOneAndUpdate(userColl,
            { _id: id },
            { $set: bodyData },
            { returnOriginal: false }
        );

        delete result.value["password"];
        const obj = resPattern.successPattern(httpStatus.OK, result.value, `success`);
        return res.status(obj.code).json({
            ...obj,
        });
    } catch (e) {
        console.log(e);
        return next(new APIError(`${e.message}`, httpStatus.BAD_REQUEST, true));
    }
}


exports.nodeJsGlobalObject = async (req, res, next) => {
    try {

        console.log(__dirname);
        const directoryName = __dirname

        const fileName = __filename
        console.log(__filename);

        //NodeJS OS Module
        console.log("os.freemem(): \n", os.freemem());
        console.log("os.homedir(): \n", os.homedir());
        console.log("os.hostname(): \n", os.hostname());
        console.log("os.endianness(): \n", os.endianness());
        console.log("os.loadavg(): \n", os.loadavg());
        console.log("os.platform(): \n", os.platform());
        console.log("os.release(): \n", os.release());
        console.log("os.tmpdir(): \n", os.tmpdir());
        console.log("os.totalmem(): \n", os.totalmem());
        console.log("os.type(): \n", os.type());
        console.log("os.uptime(): \n", os.uptime());


        // // NOdeJS Timer
        // setInterval(() => {
        //     console.log("setInterval: Hey! 1 millisecond completed!..");
        // }, 1000);


        // var i = 0;
        // console.log(i);
        // setInterval(() => {
        //     i++;
        //     console.log(i);
        // }, 1000);


        // setTimeout(function () {
        //     console.log("setTimeout: Hey! 1000 millisecond completed!..");
        // }, 1000);


        // function welcome() {
        //     console.log("Welcome to IPangram");
        // }
        // var id1 = setTimeout(welcome, 1000);
        // var id2 = setInterval(welcome, 1000);
        // clearTimeout(id1);
        // //clearInterval(id2);  






        // NodeJS DNS module

        dns.lookup('www.javatpoint.com', (err, addresses, family) => {
            console.log('addresses:', addresses);
            console.log('family:', family);
        });

        dns.lookupService('127.0.0.1', 22, (err, hostname, service) => {
            console.log(hostname, service);
            // Prints: localhost  
        });

        console.log(`Process Architecture: ${process.arch}`);
        console.log(`Process PID: ${process.pid}`);
        console.log(`Process Platform: ${process.platform}`);
        console.log(`Process Version: ${process.version}`);


        querystring = require('querystring');
        const obj1 = querystring.parse('name=shubham shukla&company=IPangram');
        console.log(obj1);
        const obj = resPattern.successPattern(httpStatus.OK, fileName, `success`);
        return res.status(obj.code).json({
            ...obj,
        });
    } catch (e) {
        console.log(e);
        return next(new APIError(`${e.message}`, httpStatus.BAD_REQUEST, true));
    }
}

exports.importantJavaScriptFunction = async (req, res, next) => {
    try {
        const Log = console.log
        Log("does it Work?")

        const Array1 = ["One", "Two", "Three", "Four"]
        const Array2 = ["five", "Six", "Seven"]
        const Merge = Array1.concat(Array2)
        Log(Merge)

        const User = {
            email: "shubhamshukla2k14@gmail.com",
            userName: "Shubham Shukla"
        }

        const Artical = {
            title: "JavaScript Tips",
            date: "10-10-2020"
        }

        const Summery = {
            ...User, ...Artical
        }

        Log(Summery)

        const Data = ["One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"]
        Data.length = 5;
        Log(Data)

        const arrayData = ["One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"]
        arrayData.sort(() => { return Math.random() - 0.5 })
        Log(arrayData)

        function isNum(n) {
            return !isNaN(parseFloat(n) && isFinite(n))
        }

        Log(isNum(1466))
        Log(isNum(13.85))
        Log(isNum("Shubham"))

        const isStr = value => typeof value === 'string';
        Log(isStr("Shubham"))
        Log(isStr(5465))
        Log(isStr(true))

        const isNull = value => value === null || value === undefined;
        Log(isNull())
        Log(isNull(null))
        Log(isNull(5465))
        Log(isNull(true))

        const start = performance.now()
        const end = performance.now()

        const total = start - end
        //  Log(total)

        const delDuplications = array => [...new Set(array)]
        Log(delDuplications(["One", "Two", "Three", "Four", "Three", "Four"]))

        const input = 5;
        input === 5 && Log("it is 5")
        input === 5 || Log("it is Not 5")


        function defaultTop5(arg) {
            arg = arg || 5;
            Log(arg)
        }

        let arg1 = 2
        let arg2 = null

        defaultTop5(arg1);
        defaultTop5(arg2);


        function temperature(temp) {
            return (temp > 39 || temp < 35.5) ? 'Visit Doctor!' : (temp < 37.5 && temp < 36.5) ? 'Go Out And Play!!' : (temp <= 39 && temp >= 35.5) ? 'Take Some Rest!' : ""
        }

        Log(temperature(38))
        Log(temperature(36))
        Log(temperature(39.1))
        Log(temperature(35.1))
        Log(temperature(37.1))


        const favoriteFood = ["One", "Two", "Three", "Four"]
        Log(...favoriteFood)

        const garage = ["BMW", "VOLVO", "AUDI"]

        const findCar = garage.includes('BMW');
        Log(findCar)

        const Age = [16, 17, 18]
        const someFunction = Age.some((person) => person >= 18)
        Log(someFunction)

        const age = [15, 20, 19]
        const someFunction1 = age.every((person) => person >= 18)
        Log(someFunction1)

        function myFunction() {
            let a = 4;
            return a * a;
        }


        const person = {
            firstName: "Shubham",
            lastName: "Shukla",
            name: "test",
            city: "Satna",
            age: 25
        };
        // delete person.age;
        person.nationality = "English";

        // person.name = function () {
        //     return this.firstName + " " + this.lastName;
        // };


        let txt = "";
        for (let x in person) {
            txt += person[x];
            console.log(txt);
        }

        let message = "Hello Ipangram";
        let name1 = message.toUpperCase();
        Log(name1)
        Log(person.firstName + "," + person.age + "," + person.city)

        const myArray = Object.values(person);
        Log("Object Value: " + myArray)

        let myString = JSON.stringify(person);
        const arr = ["John", "Peter", "Sally", "Jane"];
        let myString1 = JSON.stringify(arr);

        Log(myString, myString1)


        const person1 = {
            firstName: "John",
            lastName: "Doe",
            language: "en",
            get lang() {
                return this.language;
            }
        };


        Log(person1.lang)

        function Person(first, last, age, eyecolor) {
            this.firstName = first;
            this.lastName = last;
            this.age = age;
            this.eyeColor = eyecolor;
            this.nationality = "English";
        }

        const myFather = new Person("John", "Doe", 50, "blue");
        const myMother = new Person("Sally", "Rally", 48, "green");

        Log("My firstName is " + myFather.nationality + ". My lastName is " + myMother.nationality)


        const letters = new Set(["a", "b", "c"]);
        Log(letters.size)

        const fruits = new Map([
            ["apples", 500],
            ["bananas", 300],
            ["oranges", 200]
        ]);

        //fruits.delete("apples");

        // fruits.clear();

        // let text = "";
        // fruits.forEach(function (value, key) {
        //     text += key + ' = ' + value
        // })

        // let text = "";
        // for (const x of fruits.entries()) {
        //     text += x ;
        // }

        // let text = "";
        // for (const x of fruits.keys()) {
        //   text += x;
        // }

        let text = "";
        for (const x of fruits.values()) {
            text += x;
        }

        Log("object Maps", fruits.get("oranges"), fruits.size, fruits.has("apples"), text)

        const person2 = {
            firstName: "John",
            lastName: "Doe",
            language: "EN"
        };

        // Change a property
        const personRes = Object.defineProperty(person2, "language", { value: "NO" });

        Log("testres", personRes)
        const obj = resPattern.successPattern(httpStatus.OK, arrayData, `success`);
        return res.status(obj.code).json({
            ...obj,
        });
    } catch (e) {
        console.log(e);
        return next(new APIError(`${e.message}`, httpStatus.BAD_REQUEST, true));
    }
}

exports.nodeCronJob = async (req, res, next) => {
    try {

        const job1 = schedule.scheduleJob('1 * * * *', function () {
            console.log('The answer to life, the universe, and everything!');
        });

        const date = new Date(2022, 10, 18, 5, 30, 0);

        const job = schedule.scheduleJob(date, function () {
            console.log('The world is going to end today.');
        });

        console.log("node Scheduler::---", date, job)


    } catch (e) {
        console.log(e);
        return next(new APIError(`${e.message}`, httpStatus.BAD_REQUEST, true));
    }
}

exports.switchCasejavaScript = async (req, res, next) => {
    try {

        switch (new Date().getDay()) {
            case 0:
                day = "Sunday";
                break;
            case 1:
                day = "Monday";
                break;
            case 2:
                day = "Tuesday";
                break;
            case 3:
                day = "Wednesday";
                break;
            case 4:
                day = "Thursday";
                break;
            case 5:
                day = "Friday";
                break;
            case 6:
                day = "Saturday";
        }

        switch (new Date().getDay()) {
            case 6:
                text = "Today is Saturday";
                break;
            case 0:
                text = "Today is Sunday";
                break;
            default:
                text = "Looking forward to the Weekend";
        }


        switch (new Date().getDay()) {
            case 4:
            case 5:
                text1 = "Soon it is Weekend";
                break;
            case 0:
            case 6:
                text1 = "It is Weekend";
                break;
            default:
                text1 = "Looking forward to the Weekend";
        }


        let x = "0";
        switch (x) {
            case 0:
                text2 = "Off";
                break;
            case 1:
                text2 = "On";
                break;
            default:
                text2 = "No value found";
        }
        console.log(day, new Date().getDay(), text, text1, text2)


        const letters = new Set(["a", "b", "c"]);
        console.log(letters)

        typeof "John"                 // Returns "string"
        typeof 3.14                   // Returns "number"
        typeof NaN                    // Returns "number"
        typeof false                  // Returns "boolean"
        typeof [1, 2, 3, 4]              // Returns "object"
        typeof { name: 'John', age: 34 }  // Returns "object"
        typeof new Date()             // Returns "object"
        typeof function () { }         // Returns "function"
        typeof myCar                  // Returns "undefined" *
        typeof null                   // Returns "object"


    } catch (e) {
        console.log(e);
        return next(new APIError(`${e.message}`, httpStatus.BAD_REQUEST, true));
    }
}



exports.practiceJavaScriptFunction = async (req, res, next) => {
    try {
        function myFunction(a, b) {
            return a * b;
        }
        let x = myFunction(4, 3);

        function myFunction(a, b) {
            return a * b;
        }

        let x1 = myFunction(4, 3) * 2;


        function myFunction(a, b) {
            return a * b;
        }

        let text = myFunction.toString();


        const x3 = (x, y) => { return x * y };



        function myFunction1(x, y) {
            if (y === undefined) {
                y = 2;
            }
            return x * y;
        }
        console.log("test:---", x, x1, myFunction1(5))

        function findMax() {
            let max = -Infinity;
            for (let i = 0; i < arguments.length; i++) {
                if (arguments[i] > max) {
                    max = arguments[i];
                }
            }
            return max;
        }
        console.log("================================", findMax(430, 355, 439))

        function sumAll() {
            let sum = 0;
            for (let i = 0; i < arguments.length; i++) {
                sum += arguments[i];
            }
            return sum;
        }
        console.log("================================", sumAll(430, 355, 439))

        function myFunction(a, b) {
            return a * b;
        }
        console.log("================================", myFunction(4, 6))

        const person = {
            fullName: function () {
                return this.firstName + " " + this.lastName;
            }
        }
        const person1 = {
            firstName: "Shubham",
            lastName: "Shukla"
        }

        const person2 = {
            firstName: "Mary",
            lastName: "Doe"
        }

        // This will return "John Doe":
        console.log(person.fullName.call(person1));

        const person23 = {
            fullName: function () {
                return this.firstName + " " + this.lastName;
            }
        }

        const person5 = {
            firstName: "Mary",
            lastName: "Doe"
        }

        // This will return "Mary Doe":
        console.log(person23.fullName.apply(person5))


        const applyRes = Math.max.apply(null, [1, 2, 3]); // Will also return 3
        console.log("Apply::-----", applyRes)


        const personData = {
            firstName: "Rohit",
            lastName: "Sharma",
            fullName: function () {
                return this.firstName + " " + this.lastName;
            }
        }

        const member = {
            firstName: "Shubham",
            lastName: "Shukla",
        }

        let fullName = personData.fullName.bind(member);

        console.log(fullName())

    } catch (e) {
        console.log(e);
        return next(new APIError(`${e.message}`, httpStatus.BAD_REQUEST, true));
    }
}