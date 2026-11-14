const db = require("../config/database");

// =====================================================
// IDENTIFICATION DE L'UTILISATEUR CONNECTÉ
// =====================================================

function getIdentite(req) {
  const utilisateur = req.user || req.utilisateur;

  if (!utilisateur) {
    return null;
  }

  const roleBrut =
    utilisateur.role?.nom_role ||
    utilisateur.role?.nom ||
    utilisateur.role ||
    utilisateur.nom_role ||
    "";

  const role = String(roleBrut).toLowerCase().trim();

  return {
    estAdmin: role.includes("admin"),

    estMedecin:
      role.includes("medecin") ||
      role.includes("médecin"),

    idMedecin: Number(
      utilisateur.id_medecin ||
      utilisateur.medecin?.id_medecin ||
      0
    )
  };
}

// =====================================================
// VÉRIFICATION DES AUTORISATIONS
// =====================================================

function verifierAcces(req, res) {
  const utilisateur = getIdentite(req);

  if (!utilisateur) {
    res.status(401).json({
      message: "Vous devez être connecté."
    });

    return null;
  }

  if (!utilisateur.estAdmin && !utilisateur.estMedecin) {
    res.status(403).json({
      message: "Accès réservé aux médecins et administrateurs."
    });

    return null;
  }

  if (
    utilisateur.estMedecin &&
    !utilisateur.estAdmin &&
    !utilisateur.idMedecin
  ) {
    res.status(403).json({
      message: "Votre compte n'est pas associé à un médecin."
    });

    return null;
  }

  return utilisateur;
}

// =====================================================
// REQUÊTE COMMUNE DES CONSULTATIONS
// =====================================================

const requeteConsultations = `
  SELECT
    c.id_consultation,

    DATE_FORMAT(
      c.date_consultation,
      '%Y-%m-%d'
    ) AS date_consultation,

    c.diagnostic,
    c.observations,
    c.id_patient,
    c.id_medecin,

    p.nom AS nom_patient,
    p.prenom AS prenom_patient,

    m.nom AS nom_medecin,
    m.prenom AS prenom_medecin

  FROM consultation c

  INNER JOIN patient p
    ON c.id_patient = p.id_patient

  INNER JOIN medecin m
    ON c.id_medecin = m.id_medecin
`;

// =====================================================
// 1. RÉCUPÉRER TOUTES LES CONSULTATIONS AUTORISÉES
// =====================================================

exports.getConsultations = async (req, res) => {
  const utilisateur = verifierAcces(req, res);

  if (!utilisateur) return;

  try {
    let sql = requeteConsultations;
    const params = [];

    if (!utilisateur.estAdmin) {
      sql += " WHERE c.id_medecin = ?";
      params.push(utilisateur.idMedecin);
    }

    sql += `
      ORDER BY
        c.date_consultation DESC,
        c.id_consultation DESC
    `;

    const [rows] = await db.query(sql, params);

    res.json(rows);

  } catch (error) {
    console.error("Erreur consultations :", error);

    res.status(500).json({
      message: "Erreur lors du chargement des consultations."
    });
  }
};

// =====================================================
// 2. RÉCUPÉRER LES CONSULTATIONS DU JOUR
// =====================================================

exports.getConsultationsDuJour = async (req, res) => {
  const utilisateur = verifierAcces(req, res);

  if (!utilisateur) return;

  try {
    let sql = `
      ${requeteConsultations}

      WHERE c.date_consultation = CURDATE()
    `;

    const params = [];

    if (!utilisateur.estAdmin) {
      sql += " AND c.id_medecin = ?";
      params.push(utilisateur.idMedecin);
    }

    sql += " ORDER BY c.id_consultation DESC";

    const [rows] = await db.query(sql, params);

    res.json(rows);

  } catch (error) {
    console.error("Erreur consultations du jour :", error);

    res.status(500).json({
      message: "Impossible de charger les consultations du jour."
    });
  }
};

// =====================================================
// 3. RÉCUPÉRER LES RENDEZ-VOUS DU JOUR
// =====================================================

exports.getRendezVousDuJour = async (req, res) => {
  const utilisateur = verifierAcces(req, res);

  if (!utilisateur) return;

  try {
    let sql = `
      SELECT
        r.id_rendez_vous,
        r.id_patient,
        r.id_medecin,

        DATE_FORMAT(
          r.date_rdv,
          '%Y-%m-%d'
        ) AS date_rdv,

        TIME_FORMAT(
          r.heure_rdv,
          '%H:%i'
        ) AS heure_rdv,

        r.motif,
        r.statut,

        p.nom AS nom_patient,
        p.prenom AS prenom_patient,

        m.nom AS nom_medecin,
        m.prenom AS prenom_medecin

      FROM rendez_vous r

      INNER JOIN patient p
        ON r.id_patient = p.id_patient

      INNER JOIN medecin m
        ON r.id_medecin = m.id_medecin

      WHERE r.date_rdv = CURDATE()
    `;

    const params = [];

    if (!utilisateur.estAdmin) {
      sql += " AND r.id_medecin = ?";
      params.push(utilisateur.idMedecin);
    }

    sql += " ORDER BY r.heure_rdv ASC";

    const [rows] = await db.query(sql, params);

    res.json(rows);

  } catch (error) {
    console.error("Erreur rendez-vous :", error);

    res.status(500).json({
      message: "Impossible de charger les rendez-vous du jour."
    });
  }
};

// =====================================================
// 4. RÉCUPÉRER UNE CONSULTATION PAR ID
// =====================================================

exports.getConsultationById = async (req, res) => {
  const utilisateur = verifierAcces(req, res);

  if (!utilisateur) return;

  try {
    let sql = `
      ${requeteConsultations}
      WHERE c.id_consultation = ?
    `;

    const params = [req.params.id];

    if (!utilisateur.estAdmin) {
      sql += " AND c.id_medecin = ?";
      params.push(utilisateur.idMedecin);
    }

    const [rows] = await db.query(sql, params);

    if (rows.length === 0) {
      return res.status(404).json({
        message: "Consultation introuvable."
      });
    }

    res.json(rows[0]);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Erreur serveur."
    });
  }
};

// =====================================================
// 5. CRÉER UNE CONSULTATION
// =====================================================

exports.createConsultation = async (req, res) => {
  const utilisateur = verifierAcces(req, res);

  if (!utilisateur) return;

  try {
    const {
      date_consultation,
      diagnostic,
      observations,
      id_patient,
      id_medecin
    } = req.body;

    // Un médecin ne peut pas choisir l'identité
    // d'un autre médecin dans la requête.
    const medecinId = utilisateur.estAdmin
      ? Number(id_medecin)
      : utilisateur.idMedecin;

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(String(date_consultation || "")) ||
      !String(diagnostic || "").trim() ||
      !Number.isInteger(Number(id_patient)) ||
      Number(id_patient) <= 0 ||
      !Number.isInteger(medecinId) ||
      medecinId <= 0
    ) {
      return res.status(400).json({
        message: "Veuillez remplir les champs obligatoires."
      });
    }

    const [result] = await db.query(
      `
      INSERT INTO consultation (
        date_consultation,
        diagnostic,
        observations,
        id_patient,
        id_medecin
      )

      VALUES (?, ?, ?, ?, ?)
      `,
      [
        date_consultation,
        String(diagnostic).trim(),
        String(observations || "").trim(),
        Number(id_patient),
        medecinId
      ]
    );

    res.status(201).json({
      message: "Consultation enregistrée avec succès.",
      id_consultation: result.insertId
    });

  } catch (error) {
    console.error("Erreur création consultation :", error);

    res.status(500).json({
      message: "Impossible d'enregistrer la consultation."
    });
  }
};

// =====================================================
// 6. MODIFIER UNE CONSULTATION
// =====================================================

exports.updateConsultation = async (req, res) => {
  const utilisateur = verifierAcces(req, res);

  if (!utilisateur) return;

  try {
    const {
      date_consultation,
      diagnostic,
      observations,
      id_patient,
      id_medecin
    } = req.body;

    const medecinId = utilisateur.estAdmin
      ? Number(id_medecin)
      : utilisateur.idMedecin;

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(String(date_consultation || "")) ||
      !String(diagnostic || "").trim() ||
      !Number.isInteger(Number(id_patient)) ||
      Number(id_patient) <= 0 ||
      !Number.isInteger(medecinId) ||
      medecinId <= 0
    ) {
      return res.status(400).json({
        message: "Données de consultation incomplètes."
      });
    }

    let sql = `
      UPDATE consultation

      SET
        date_consultation = ?,
        diagnostic = ?,
        observations = ?,
        id_patient = ?,
        id_medecin = ?

      WHERE id_consultation = ?
    `;

    const params = [
      date_consultation,
      String(diagnostic).trim(),
      String(observations || "").trim(),
      Number(id_patient),
      medecinId,
      req.params.id
    ];

    if (!utilisateur.estAdmin) {
      sql += " AND id_medecin = ?";
      params.push(utilisateur.idMedecin);
    }

    const [result] = await db.query(sql, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Consultation introuvable ou accès refusé."
      });
    }

    res.json({
      message: "Consultation modifiée avec succès."
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Erreur modification consultation."
    });
  }
};

// =====================================================
// 7. SUPPRIMER UNE CONSULTATION
// ADMINISTRATEUR UNIQUEMENT
// =====================================================

exports.deleteConsultation = async (req, res) => {
  const utilisateur = verifierAcces(req, res);

  if (!utilisateur) return;

  if (!utilisateur.estAdmin) {
    return res.status(403).json({
      message: "Seul l'administrateur peut supprimer une consultation."
    });
  }

  try {
    const [result] = await db.query(
      `
      DELETE FROM consultation
      WHERE id_consultation = ?
      `,
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Consultation introuvable."
      });
    }

    res.json({
      message: "Consultation supprimée avec succès."
    });

  } catch (error) {
    console.error("Erreur suppression consultation :", error);

    res.status(500).json({
      message: "Suppression impossible."
    });
  }
};