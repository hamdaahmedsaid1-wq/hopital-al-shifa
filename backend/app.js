const express = require("express");
const cors = require("cors");

const app = express();

// =========================================================
// 1. MIDDLEWARES
// =========================================================

app.use(cors());

app.use(express.json());

// =========================================================
// 2. ROUTE PRINCIPALE
// =========================================================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "API Hôpital Al-Shifa opérationnelle"
  });
});

// =========================================================
// 3. AUTHENTIFICATION
// =========================================================

app.use(
  "/api/auth",
  require("./routes/authRoutes")
);

// =========================================================
// 4. PATIENTS
// =========================================================

app.use(
  "/api/patients",
  require("./routes/patientRoutes")
);

// =========================================================
// 5. MÉDECINS
// =========================================================

app.use(
  "/api/medecins",
  require("./routes/medecinRoutes")
);

// =========================================================
// 6. RENDEZ-VOUS
// =========================================================

app.use(
  "/api/rendez-vous",
  require("./routes/rendezVousRoutes")
);

// =========================================================
// 7. CONSULTATIONS
// =========================================================

app.use(
  "/api/consultations",
  require("./routes/consultationRoutes")
);

// =========================================================
// 8. ORDONNANCES
// =========================================================

app.use(
  "/api/ordonnances",
  require("./routes/ordonnanceRoutes")
);

// =========================================================
// 9. HOSPITALISATIONS
// =========================================================

app.use(
  "/api/hospitalisations",
  require("./routes/hospitalisationRoutes")
);

// =========================================================
// 10. SUIVIS HOSPITALIERS
// =========================================================

// Gestion des observations médicales,
// constantes vitales et évolution des patients.

app.use(
  "/api/suivis-hospitalisation",
  require("./routes/suiviHospitalisationRoutes")
);

// =========================================================
// 11. SORTIES DES PATIENTS
// =========================================================

// Enregistrement des sorties médicales,
// mise à jour des hospitalisations
// et libération automatique des lits.

app.use(
  "/api/sorties-patient",
  require("./routes/sortiePatientRoutes")
);

// =========================================================
// 12. SERVICES HOSPITALIERS
// =========================================================

app.use(
  "/api/services",
  require("./routes/serviceRoutes")
);

// =========================================================
// 13. CHAMBRES HOSPITALIÈRES
// =========================================================

app.use(
  "/api/chambres",
  require("./routes/chambreRoutes")
);

// =========================================================
// 14. GESTION DES LITS
// =========================================================

app.use(
  "/api/lits",
  require("./routes/litRoutes")
);

// =========================================================
// 15. FACTURES
// =========================================================

app.use(
  "/api/factures",
  require("./routes/factureRoutes")
);

// =========================================================
// 16. PAIEMENTS
// =========================================================

app.use(
  "/api/paiements",
  require("./routes/paiementRoutes")
);

// =========================================================
// 17. UTILISATEURS
// =========================================================

app.use(
  "/api/utilisateurs",
  require("./routes/utilisateurRoutes")
);

// =========================================================
// 18. ROUTES SÉCURISÉES SELON LE RÔLE
// =========================================================

app.use(
  "/api/access",
  require("./routes/accessRoutes")
);

// =========================================================
// 19. ACCÈS MÉDECIN
// =========================================================

app.use(
  "/api/medecin",
  require("./routes/medecinAccessRoutes")
);

// =========================================================
// 20. GESTION DES ROUTES INTROUVABLES
// =========================================================

// IMPORTANT :
// Cette partie doit toujours être placée
// après toutes les routes de l'application.

app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: "Route introuvable",
    methode: req.method,
    chemin: req.originalUrl
  });
});

// =========================================================
// 21. GESTION GLOBALE DES ERREURS
// =========================================================

app.use((err, req, res, next) => {
  console.error("Erreur serveur :", err);

  // Erreur de syntaxe JSON
  if (
    err instanceof SyntaxError &&
    err.status === 400 &&
    "body" in err
  ) {
    return res.status(400).json({
      success: false,
      message: "Le format JSON envoyé est invalide."
    });
  }

  return res.status(err.status || 500).json({
    success: false,
    message:
      err.status && err.status < 500
        ? err.message
        : "Une erreur interne est survenue."
  });
});

// =========================================================
// 22. EXPORT DE L'APPLICATION
// =========================================================

module.exports = app;