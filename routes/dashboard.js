const express = require('express');
const router = express.Router();
const path = require('path');

router.get('/dashboard-selector', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/dashboard-selector.html'));
});

module.exports = router;
