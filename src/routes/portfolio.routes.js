const express = require('express');
const router = express.Router();

const { getPortfolioList } = require('../controllers/portfolio.controller');
const validate = require('../middlewares/validate.middleware');
const { listPortfolioQuerySchema } = require('../validations/portfolio.validation');


router.get('/', validate(listPortfolioQuerySchema), getPortfolioList);

module.exports = router;