const express =
  require("express");

const router =
  express.Router();

const accessAuth =
  require(
    "../middlewares/accessAuth"
  );

const accessController =
  require(
    "../controllers/accessController"
  );


/* =====================================================
   UTILISATEUR CONNECTE
===================================================== */

router.get(
  "/me",
  accessAuth,
  accessController.getMe
);


/* =====================================================
   PATIENTS
===================================================== */

router.get(
  "/patients",
  accessAuth,
  accessController.getPatients
);

router.get(
  "/patients/:id",
  accessAuth,
  accessController.getPatientById
);


/* =====================================================
   RENDEZ-VOUS
===================================================== */

router.get(
  "/rendez-vous",
  accessAuth,
  accessController.getRendezVous
);


/* =====================================================
   CONSULTATIONS
===================================================== */

router.get(
  "/consultations",
  accessAuth,
  accessController.getConsultations
);

router.post(
  "/consultations",
  accessAuth,
  accessController.createConsultation
);


/* =====================================================
   ORDONNANCES
===================================================== */

router.get(
  "/ordonnances",
  accessAuth,
  accessController.getOrdonnances
);

router.post(
  "/ordonnances",
  accessAuth,
  accessController.createOrdonnance
);
// =========================================================
// DASHBOARD INFIRMIER
// =========================================================

router.get(
  "/infirmier/dashboard",
  accessAuth,
  accessController.getInfirmierDashboard
);

/* =====================================================
   EXPORT
===================================================== */

module.exports =
  router;