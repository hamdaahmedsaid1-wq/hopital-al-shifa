const express = require("express");

const router = express.Router();

const accessAuth = require(
  "../middlewares/accessAuth"
);

const accessController = require(
  "../controllers/accessController"
);

// =====================================================
// AUTHENTIFICATION OBLIGATOIRE
// =====================================================

router.use(accessAuth);

// =====================================================
// UTILISATEUR CONNECTÉ
// =====================================================

router.get(
  "/me",
  accessController.getMe
);

// =====================================================
// PATIENTS
// =====================================================

router.get(
  "/patients",
  accessController.getPatients
);

router.get(
  "/patients/:id",
  accessController.getPatientById
);

// =====================================================
// RENDEZ-VOUS
// =====================================================

router.get(
  "/rendez-vous",
  accessController.getRendezVous
);

// =====================================================
// CONSULTATIONS
// =====================================================

router.get(
  "/consultations",
  accessController.getConsultations
);

router.post(
  "/consultations",
  accessController.createConsultation
);

// =====================================================
// ORDONNANCES
// =====================================================

router.get(
  "/ordonnances",
  accessController.getOrdonnances
);

router.post(
  "/ordonnances",
  accessController.createOrdonnance
);

// =====================================================
// DASHBOARD INFIRMIER
// =====================================================

router.get(
  "/infirmier/dashboard",
  accessController.getInfirmierDashboard
);

// =====================================================
// EXPORTATION
// =====================================================

module.exports = router;