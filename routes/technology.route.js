const router = require('express').Router();
const technologyCtrl = require('../controllers/technology.controller');
const { uploadS3 } = require('../helpers/commonfile');

router.route('/addTechnology')
    .post(technologyCtrl.addTechnology);

module.exports = router;