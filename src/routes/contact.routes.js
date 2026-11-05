const express = require('express');
const router = express.Router();

const { createInquiry } = require('../controllers/contact.controller');
const validate = require('../middlewares/validate.middleware');
const { submitContactSchema } = require('../validations/contact.validation');

// POST /api/v1/contact
router.post('/', validate(submitContactSchema), createInquiry);

module.exports = router;