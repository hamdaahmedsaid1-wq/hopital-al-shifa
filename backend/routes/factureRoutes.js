const express = require("express");

const router = express.Router();

const controller = require(
  "../controllers/factureController"
);

// Récupérer toutes les factures
router.get("/", controller.getFactures);

// Statistiques
router.get(
  "/statistiques",
  controller.getStatistiques
);

// Consulter une facture
router.get("/:id", controller.getFactureById);

// Créer une facture
router.post("/", controller.createFacture);

// Modifier une facture
router.put("/:id", controller.updateFacture);

// Supprimer une facture
router.delete("/:id", controller.deleteFacture);

module.exports = router;