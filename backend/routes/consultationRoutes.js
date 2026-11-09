const express = require("express");

const router = express.Router();

const consultationController =
  require("../controllers/consultationController");


// =========================================================
// RECUPERER TOUTES LES CONSULTATIONS
// =========================================================

router.get(
  "/",
  consultationController.getConsultations
);


// =========================================================
// RECUPERER UNE CONSULTATION
// =========================================================

router.get(
  "/:id",
  consultationController.getConsultationById
);


// =========================================================
// AJOUTER UNE CONSULTATION
// =========================================================

router.post(
  "/",
  consultationController.createConsultation
);


// =========================================================
// MODIFIER UNE CONSULTATION
// =========================================================

router.put(
  "/:id",
  consultationController.updateConsultation
);


// =========================================================
// SUPPRIMER UNE CONSULTATION
// =========================================================

router.delete(
  "/:id",
  consultationController.deleteConsultation
);


module.exports = router;