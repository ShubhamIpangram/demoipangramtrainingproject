const router = require('express').Router();
const projectCtrl = require('../controllers/project.controller');
const { uploadS3 } = require('../helpers/commonfile');

router.route('/addProject')
    .post(projectCtrl.addproject);

router.route('/projectList')
    .post(projectCtrl.projectList);

router.route('/projectDetail/:id')
    .get(projectCtrl.projectDetail);

router.route('/NestedLookup/:id')
    .get(projectCtrl.nestedLookup);

router.route('/multipleConditionLookup')
    .get(projectCtrl.multipleConditionLookup);

router.route('/orPipelineOperators')
    .get(projectCtrl.orOperatorPipeline);

router.route('/dateExpressionOpperators')
    .get(projectCtrl.dateExpressionOpperators);

router.route('/stringExpressionOperators')
    .get(projectCtrl.stringExpressionOperators);

router.route('/typeExpressionOperators')
    .get(projectCtrl.typeExpressionOperators);

router.route('/geoSpatialQuery')
    .get(projectCtrl.geoSpatialQuery);

router.route('/geoLocationWithPolygon')
    .get(projectCtrl.geoLocationWithPolygon);

router.route('/filterMongodbaggregation')
    .get(projectCtrl.filterMongodbaggregation);

router.route('/mapMongodbaggregation')
    .get(projectCtrl.mapMongodbaggregation);

router.route('/camparisionOperators')
    .get(projectCtrl.camparisionOperators);

router.route('/practiceNodejsModule')
    .get(projectCtrl.practiceNodejsModule);


module.exports = router;