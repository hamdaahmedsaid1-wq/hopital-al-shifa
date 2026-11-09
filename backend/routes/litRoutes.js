const express = require("express");

const router = express.Router();

const litController = require("../controllers/litController");

// Récupérer tous les lits
router.get("/", litController.getLits);

module.exports = router;