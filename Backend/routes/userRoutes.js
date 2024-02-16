const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.post('/authenticate', userController.authenticateUser);
router.post('/', userController.createUser);
router.post('/:username', userController.addVictory);

module.exports = router;
