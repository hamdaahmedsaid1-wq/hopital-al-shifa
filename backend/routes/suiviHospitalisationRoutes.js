const express = require("express");

const router = express.Router();

const suiviController = require(
  "../controllers/suiviHospitalisationController"
);

// Afficher l'historique des suivis
router.get("/", suiviController.getSuivis);

// Enregistrer un nouveau suivi
router.post("/", suiviController.createSuivi);

// Consulter un suivi
router.get("/:id", suiviController.getSuiviById);

module.exports = router;