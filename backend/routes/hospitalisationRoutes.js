const express = require("express");

const router = express.Router();

const hospitalisationController = require(
  "../controllers/hospitalisationController"
);

// ==========================================
// RÉCUPÉRER TOUTES LES HOSPITALISATIONS
// ==========================================

router.get(
  "/",
  hospitalisationController.getHospitalisations
);

// ==========================================
// CRÉER UNE NOUVELLE HOSPITALISATION
// ==========================================

router.post(
  "/",
  hospitalisationController.createHospitalisation
);

// ==========================================
// ENREGISTRER LA SORTIE D'UN PATIENT
// ==========================================

router.put(
  "/:id/sortie",
  hospitalisationController.sortiePatient
);

// ==========================================
// CONSULTER UNE HOSPITALISATION
// ==========================================

router.get(
  "/:id",
  hospitalisationController.getHospitalisationById
);

module.exports = router;