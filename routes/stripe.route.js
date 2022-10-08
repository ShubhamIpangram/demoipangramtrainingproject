const router = require('express').Router();
const authCtrl = require('../controllers/stripe.controller');
const { upload } = require('../helpers/commonfile');

router.route('/payment')
    .post(authCtrl.payment);

module.exports = router;