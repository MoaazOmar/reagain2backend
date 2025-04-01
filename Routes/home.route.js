const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    try {
        console.log('Handling GET / request');
        res.status(200).json({ message: 'Root route is working' });
    } catch (error) {
        console.error('Error in GET /:', error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
});

module.exports = router;