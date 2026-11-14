const express = require("express");

const router = express.Router();

const consultationController = require(
  "../controllers/consultationController"
);

const authMiddleware = require(
  "../middlewares/authMiddleware"
);

// =====================================================
// AUTHENTIFICATION OBLIGATOIRE
// =====================================================

// Toutes les routes ci-dessous nécessitent
// un utilisateur connecté avec un token valide.

router.use(authMiddleware);

// =====================================================
// 1. RÉCUPÉRER TOUTES LES CONSULTATIONS
// =====================================================

router.get(
  "/",
  consultationController.getConsultations
);

// =====================================================
// 2. RÉCUPÉRER LES CONSULTATIONS DU JOUR
// =====================================================

router.get(
  "/aujourdhui",
  consultationController.getConsultationsDuJour
);

// =====================================================
// 3. RÉCUPÉRER LES RENDEZ-VOUS DU JOUR
// =====================================================

router.get(
  "/rendez-vous-du-jour",
  consultationController.getRendezVousDuJour
);

// =====================================================
// 4. RÉCUPÉRER UNE CONSULTATION PAR ID
// =====================================================

router.get(
  "/:id",
  consultationController.getConsultationById
);

// =====================================================
// 5. AJOUTER UNE CONSULTATION
// =====================================================

router.post(
  "/",
  consultationController.createConsultation
);

// =====================================================
// 6. MODIFIER UNE CONSULTATION
// =====================================================

router.put(
  "/:id",
  consultationController.updateConsultation
);

// =====================================================
// 7. SUPPRIMER UNE CONSULTATION
// =====================================================

router.delete(
  "/:id",
  consultationController.deleteConsultation
);

// =====================================================
// EXPORTATION
// =====================================================

module.exports = router;