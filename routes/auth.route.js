const router = require('express').Router();
const authCtrl = require('../controllers/auth.controller');
const { upload } = require('../helpers/commonfile');

router.route('/login')
    .post(authCtrl.login);
router.route('/signup')
    .post(authCtrl.signup);

router.route('/imageUpload/:id')
    .post(upload.single("profileImage"), authCtrl.userImageUpload);

router.route('/multipleImageUpload/:id')
    .post(upload.fields([
        { name: "documentImage", maxCount: 1 },
        { name: "profile", maxCount: 1 },
    ]), authCtrl.multipleImageUpload);

router.route('/nodejsGlobalObject')
    .post(authCtrl.nodeJsGlobalObject);

router.route('/importantJavaScriptFunction')
    .post(authCtrl.importantJavaScriptFunction);

router.route('/nodeCronJob')
    .post(authCtrl.nodeCronJob);

router.route('/switchCasejavaScript')
    .post(authCtrl.switchCasejavaScript);

router.route('/practiceJavaScriptFunction')
    .post(authCtrl.practiceJavaScriptFunction);

module.exports = router;