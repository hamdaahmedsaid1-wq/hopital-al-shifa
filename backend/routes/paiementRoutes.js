const express = require("express");

const router = express.Router();

const controller = require(
  "../controllers/paiementController"
);

// ==========================================
// RÉCUPÉRER TOUS LES PAIEMENTS
// ==========================================

router.get(
  "/",
  controller.getPaiements
);

// ==========================================
// STATISTIQUES
// ==========================================

router.get(
  "/statistiques",
  controller.getStatistiques
);

// ==========================================
// FACTURES NON SOLDÉES
// ==========================================

router.get(
  "/factures-disponibles",
  controller.getFacturesDisponibles
);

// ==========================================
// ENREGISTRER UN PAIEMENT
// ==========================================

router.post(
  "/",
  controller.createPaiement
);

// ==========================================
// CONSULTER UN PAIEMENT
// ==========================================

router.get(
  "/:id",
  controller.getPaiementById
);

module.exports = router;