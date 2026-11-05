const express = require('express');
const router = express.Router();

const { getPortfolioList } = require('../controllers/portfolio.controller');
const validate = require('../middlewares/validate.middleware');
const { listPortfolioQuerySchema } = require('../validations/portfolio.validation');

// GET /api/v1/portfolio
router.get('/', validate(listPortfolioQuerySchema), getPortfolioList);

module.exports = router;