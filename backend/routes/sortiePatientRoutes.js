const express = require("express");

const router = express.Router();

const controller = require(
  "../controllers/sortiePatientController"
);

// Liste et historique
router.get("/", controller.getSorties);

// Statistiques
router.get("/statistiques", controller.getStatistiques);

// Patients actuellement hospitalisés
router.get(
  "/hospitalisations-actives",
  controller.getHospitalisationsActives
);

// Enregistrer une sortie
router.post("/", controller.createSortie);

// Consulter une sortie
router.get("/:id", controller.getSortieById);

// Modifier les informations médicales
router.put("/:id", controller.updateSortie);

module.exports = router;