
let isEmpty = value =>
    value === undefined || value === null ||
    (typeof value === 'object' && Object.keys(value).length === 0) ||
    (typeof value === 'string' && value.trim().length === 0);

let emailValidator = (params) => {
    let mailFormat = /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/;
    if (mailFormat.test(params) == false) {
        return false
    }
    return true
};

const signInValidation = (data) => {
    var errors = {}

    if (isEmpty(data.email)) {
        errors.email = 'email is required';
    } else {
        emailValidator(data.email) ? "" : errors.email = 'check email format';
    }
    isEmpty(data.password) ? errors.password = "password is required" : "";

    return {
        errors,
        isValid: isEmpty(errors)
    }
}

const signUpValidation = (data) => {
    var errors = {}

    if (isEmpty(data.email)) {
        errors.email = 'email is required';
    } else {
        emailValidator(data.email) ? "" : errors.email = 'check email format';
    }
    isEmpty(data.mobile_no) ? errors.mobile_no = "mobile_no is required" : "";
    isEmpty(data.userType) ? errors.userType = "userType is required" : "";
    isEmpty(data.password) ? errors.password = "password is required" : "";
    isEmpty(data.name) ? errors.name = "name is required" : "";




    return {
        errors,
        isValid: isEmpty(errors)
    }
}

const emailValidation = (data) => {
    var error = {}

    if (isEmpty(data.email)) {
        error.email = 'email is required';
    } else {
        emailValidator(data.email) ? "" : error.email = 'check email format';
    }

    return {
        error,
        isValidMsg: isEmpty(error)
    }
}

const productValidation = (data) => {
    var errors = {}

    if (isEmpty(data.productName)) {
        errors.email = 'Product Name is required';
    }
    isEmpty(data.price) ? errors.price = "price is required" : "";

    isEmpty(data.launchedDate) ? errors.launchedDate = "launchedDate is required" : "";
    isEmpty(data.categoryId) ? errors.categoryId = "categoryId is required" : "";

    return {
        errors,
        isValid: isEmpty(errors)
    }
}

module.exports = {
    signInValidation,
    signUpValidation,
    emailValidation,
    productValidation
}