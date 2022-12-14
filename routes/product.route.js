const router = require('express').Router();
const productCtrl = require('../controllers/product.controller');
const { uploadS3 } = require('../helpers/commonfile');

router.route('/createProduct')
    .post(productCtrl.createProduct);

router.route('/productListLaunchedDate2019and2022')
    .get(productCtrl.productList2016and2022);

router.route('/productListBetween2017to2021')
    .get(productCtrl.productListBetween2017and2021);

router.route('/productList2019priceBetween500to1000')
    .get(productCtrl.productList2019priceBetween500to1000);

router.route('/categoryWiseProductList2020')
    .get(productCtrl.categoryWiseProductList2020);

router.route('/desendingOrderProductListcategoryWise2020')
    .get(productCtrl.desendingcategoryWiseProductList2020)

router.route('/productListSortAndCount')
    .get(productCtrl.productListSortAndCount)

router.route('/HouseHoldandComputerAccessoriesProductList')
    .get(productCtrl.filterProductDetails)

router.route('/ElectronicandFashionProductList')
    .get(productCtrl.ElectronicandFashionProductList)

router.route('/productListUnder500')
    .get(productCtrl.productListUnder500)

router.route('/totalProductPrice')
    .get(productCtrl.totalProductPrice)

router.route('/productListWithotSkuNumber')
    .get(productCtrl.productListWithotSkuNumber)


router.route('/mostUsefulJavaScriptFunction')
    .get(productCtrl.mostUsefulJavaScriptFunction)

router.route('/updateFieldsInsideArray')
    .post(productCtrl.updateFieldsInsideArray)

router.route('/findDocumentMonthWise')
    .post(productCtrl.findDocumentMonthWise)

router.route('/practiceAggrgationQuery')
    .post(productCtrl.practiceAggrgationQuery)
module.exports = router;