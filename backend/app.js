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
// 5. MEDECINS
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
// 10. SERVICES HOSPITALIERS
// =========================================================

app.use(
  "/api/services",
  require("./routes/serviceRoutes")
);

// =========================================================
// 11. CHAMBRES HOSPITALIERES
// =========================================================

app.use(
  "/api/chambres",
  require("./routes/chambreRoutes")
);

// =========================================================
// 12. GESTION DES LITS
// =========================================================

app.use(
  "/api/lits",
  require("./routes/litRoutes")
);

// =========================================================
// 13. FACTURES
// =========================================================

app.use(
  "/api/factures",
  require("./routes/factureRoutes")
);

// =========================================================
// 14. PAIEMENTS
// =========================================================

app.use(
  "/api/paiements",
  require("./routes/paiementRoutes")
);

// =========================================================
// 15. UTILISATEURS
// =========================================================

app.use(
  "/api/utilisateurs",
  require("./routes/utilisateurRoutes")
);

// =========================================================
// 16. ROUTES SECURISEES SELON LE ROLE
// =========================================================

app.use(
  "/api/access",
  require("./routes/accessRoutes")
);

// =========================================================
// 17. ACCES MEDECIN
// =========================================================

app.use(
  "/api/medecin",
  require("./routes/medecinAccessRoutes")
);

// =========================================================
// 18. GESTION DES ERREURS 404
// =========================================================

// Cette partie doit être placée après toutes les routes.

app.use((req, res) => {
  res.status(404).json({
    message: "Route introuvable"
  });
});

// =========================================================
// 19. GESTION DES ERREURS SERVEUR
// =========================================================

app.use((err, req, res, next) => {
  console.error("Erreur serveur :", err);

  res.status(500).json({
    message: "Une erreur interne est survenue."
  });
});

// =========================================================
// 20. EXPORT DE L'APPLICATION
// =========================================================

module.exports = app;