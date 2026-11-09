const db = require("../config/database");

/* =========================================================
   FONCTIONS UTILITAIRES
========================================================= */

async function trouverMedecin(idUtilisateur) {
  const [medecins] = await db.query(
    `
    SELECT
      id_medecin,
      nom,
      prenom,
      id_utilisateur
    FROM medecin
    WHERE id_utilisateur = ?
    LIMIT 1
    `,
    [idUtilisateur]
  );

  return medecins[0] || null;
}

function erreurServeur(res, titre, error) {
  console.error(titre, error);

  return res.status(500).json({
    message: "Une erreur serveur est survenue."
  });
}

/* =========================================================
   UTILISATEUR CONNECTE
========================================================= */

exports.getMe = async (req, res) => {
  try {
    if (!req.user || !req.user.id_utilisateur) {
      return res.status(401).json({
        message: "Utilisateur non authentifié."
      });
    }

    const [utilisateurs] = await db.query(
      `
      SELECT
        id_utilisateur,
        nom,
        prenom,
        email,
        id_role
      FROM utilisateur
      WHERE id_utilisateur = ?
      LIMIT 1
      `,
      [req.user.id_utilisateur]
    );

    if (utilisateurs.length === 0) {
      return res.status(404).json({
        message: "Utilisateur introuvable."
      });
    }

    return res.json(utilisateurs[0]);

  } catch (error) {
    return erreurServeur(res, "Erreur getMe :", error);
  }
};

/* =========================================================
   LISTE DES PATIENTS
========================================================= */

exports.getPatients = async (req, res) => {
  try {
    const idRole = Number(req.user.id_role);

    if (idRole === 1 || idRole === 3) {
      const [patients] = await db.query(`
        SELECT *
        FROM patient
        ORDER BY nom ASC, prenom ASC
      `);

      return res.json(patients);
    }

    if (idRole === 2) {
      const medecin = await trouverMedecin(
        req.user.id_utilisateur
      );

      if (!medecin) {
        return res.status(403).json({
          message: "Aucun médecin associé à ce compte."
        });
      }

      const [patients] = await db.query(
        `
        SELECT DISTINCT p.*
        FROM patient p
        LEFT JOIN rendez_vous rv
          ON rv.id_patient = p.id_patient
        LEFT JOIN consultation c
          ON c.id_patient = p.id_patient
        WHERE rv.id_medecin = ?
           OR c.id_medecin = ?
        ORDER BY p.nom ASC, p.prenom ASC
        `,
        [medecin.id_medecin, medecin.id_medecin]
      );

      return res.json(patients);
    }

    return res.status(403).json({
      message: "Accès aux patients non autorisé."
    });

  } catch (error) {
    return erreurServeur(res, "Erreur getPatients :", error);
  }
};

/* =========================================================
   DOSSIER PATIENT
========================================================= */

exports.getPatientById = async (req, res) => {
  try {
    const idPatient = Number(req.params.id);
    const idRole = Number(req.user.id_role);

    if (!Number.isInteger(idPatient) || idPatient <= 0) {
      return res.status(400).json({
        message: "Identifiant patient invalide."
      });
    }

    if (idRole === 1 || idRole === 3) {
      const [patients] = await db.query(
        `
        SELECT *
        FROM patient
        WHERE id_patient = ?
        `,
        [idPatient]
      );

      if (!patients.length) {
        return res.status(404).json({
          message: "Patient introuvable."
        });
      }

      return res.json(patients[0]);
    }

    if (idRole === 2) {
      const medecin = await trouverMedecin(
        req.user.id_utilisateur
      );

      if (!medecin) {
        return res.status(403).json({
          message: "Aucun médecin associé à ce compte."
        });
      }

      const [patients] = await db.query(
        `
        SELECT DISTINCT p.*
        FROM patient p
        LEFT JOIN rendez_vous rv
          ON rv.id_patient = p.id_patient
        LEFT JOIN consultation c
          ON c.id_patient = p.id_patient
        WHERE p.id_patient = ?
          AND (
            rv.id_medecin = ?
            OR c.id_medecin = ?
          )
        `,
        [
          idPatient,
          medecin.id_medecin,
          medecin.id_medecin
        ]
      );

      if (!patients.length) {
        return res.status(403).json({
          message: "Accès à ce patient non autorisé."
        });
      }

      return res.json(patients[0]);
    }

    return res.status(403).json({
      message: "Accès non autorisé."
    });

  } catch (error) {
    return erreurServeur(res, "Erreur getPatientById :", error);
  }
};

/* =========================================================
   RENDEZ-VOUS
   CORRECTION DU FORMAT DES DATES
========================================================= */

exports.getRendezVous = async (req, res) => {
  try {
    const idRole = Number(req.user.id_role);

    const requeteBase = `
      SELECT
        rv.id_rendez_vous,
        rv.id_patient,
        rv.id_medecin,

        DATE_FORMAT(
          rv.date_rdv,
          '%Y-%m-%d'
        ) AS date_rdv,

        TIME_FORMAT(
          rv.heure_rdv,
          '%H:%i:%s'
        ) AS heure_rdv,

        rv.motif,
        rv.statut,

        p.nom AS nom_patient,
        p.prenom AS prenom_patient,

        m.nom AS nom_medecin,
        m.prenom AS prenom_medecin

      FROM rendez_vous rv

      LEFT JOIN patient p
        ON p.id_patient = rv.id_patient

      LEFT JOIN medecin m
        ON m.id_medecin = rv.id_medecin
    `;

    // ADMINISTRATEUR ET RECEPTIONNISTE
    if (idRole === 1 || idRole === 3) {
      const [rendezVous] = await db.query(`
        ${requeteBase}
        ORDER BY rv.date_rdv DESC, rv.heure_rdv ASC
      `);

      return res.json(rendezVous);
    }

    // MEDECIN
    if (idRole === 2) {
      const medecin = await trouverMedecin(
        req.user.id_utilisateur
      );

      if (!medecin) {
        return res.status(403).json({
          message: "Aucun médecin associé à ce compte."
        });
      }

      const [rendezVous] = await db.query(
        `
        ${requeteBase}
        WHERE rv.id_medecin = ?
        ORDER BY rv.date_rdv DESC, rv.heure_rdv ASC
        `,
        [medecin.id_medecin]
      );

      return res.json(rendezVous);
    }

    return res.status(403).json({
      message: "Accès aux rendez-vous non autorisé."
    });

  } catch (error) {
    return erreurServeur(res, "Erreur getRendezVous :", error);
  }
};

/* =========================================================
   LISTE DES CONSULTATIONS
========================================================= */

exports.getConsultations = async (req, res) => {
  try {
    const idRole = Number(req.user.id_role);

    const requeteBase = `
      SELECT
        c.*,
        p.nom AS nom_patient,
        p.prenom AS prenom_patient,
        m.nom AS nom_medecin,
        m.prenom AS prenom_medecin
      FROM consultation c
      JOIN patient p
        ON c.id_patient = p.id_patient
      JOIN medecin m
        ON c.id_medecin = m.id_medecin
    `;

    if (idRole === 1) {
      const [consultations] = await db.query(`
        ${requeteBase}
        ORDER BY c.id_consultation DESC
      `);

      return res.json(consultations);
    }

    if (idRole === 2) {
      const medecin = await trouverMedecin(
        req.user.id_utilisateur
      );

      if (!medecin) {
        return res.status(403).json({
          message: "Aucun médecin associé à ce compte."
        });
      }

      const [consultations] = await db.query(
        `
        ${requeteBase}
        WHERE c.id_medecin = ?
        ORDER BY c.id_consultation DESC
        `,
        [medecin.id_medecin]
      );

      return res.json(consultations);
    }

    return res.status(403).json({
      message: "Accès aux consultations non autorisé."
    });

  } catch (error) {
    return erreurServeur(res, "Erreur getConsultations :", error);
  }
};

/* =========================================================
   CREATION CONSULTATION
========================================================= */

exports.createConsultation = async (req, res) => {
  try {
    const idRole = Number(req.user.id_role);

    const {
      id_patient,
      id_medecin,
      date_consultation,
      motif,
      symptomes,
      diagnostic,
      traitement,
      observations
    } = req.body;

    if (
      !id_patient ||
      !date_consultation ||
      !motif ||
      !diagnostic
    ) {
      return res.status(400).json({
        message: "Champs obligatoires manquants."
      });
    }

    let medecinId;

    if (idRole === 2) {
      const medecin = await trouverMedecin(
        req.user.id_utilisateur
      );

      if (!medecin) {
        return res.status(403).json({
          message: "Aucun médecin associé à ce compte."
        });
      }

      medecinId = medecin.id_medecin;

      const [patientsAutorises] = await db.query(
        `
        SELECT DISTINCT p.id_patient
        FROM patient p
        LEFT JOIN rendez_vous rv
          ON rv.id_patient = p.id_patient
        LEFT JOIN consultation c
          ON c.id_patient = p.id_patient
        WHERE p.id_patient = ?
          AND (
            rv.id_medecin = ?
            OR c.id_medecin = ?
          )
        `,
        [id_patient, medecinId, medecinId]
      );

      if (!patientsAutorises.length) {
        return res.status(403).json({
          message: "Patient non autorisé pour ce médecin."
        });
      }

    } else if (idRole === 1) {
      medecinId = Number(id_medecin);

      if (!Number.isInteger(medecinId) || medecinId <= 0) {
        return res.status(400).json({
          message: "Veuillez sélectionner un médecin."
        });
      }

    } else {
      return res.status(403).json({
        message: "Création de consultation non autorisée."
      });
    }

    const [result] = await db.query(
      `
      INSERT INTO consultation (
        id_patient,
        id_medecin,
        date_consultation,
        motif,
        symptomes,
        diagnostic,
        traitement,
        observations
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        id_patient,
        medecinId,
        date_consultation,
        motif,
        symptomes || null,
        diagnostic,
        traitement || null,
        observations || null
      ]
    );

    return res.status(201).json({
      message: "Consultation enregistrée avec succès.",
      id_consultation: result.insertId
    });

  } catch (error) {
    return erreurServeur(res, "Erreur createConsultation :", error);
  }
};

/* =========================================================
   LISTE DES ORDONNANCES
   HOPITAL AL-SHIFA
========================================================= */

exports.getOrdonnances = async (req, res) => {

  try {

    const idRole = Number(req.user.id_role);

    const sql = `
      SELECT
        o.id_ordonnance,
        o.date_ordonnance,
        o.id_consultation,
        o.motif,
        o.prescription,
        o.instructions,

        c.id_patient,
        c.id_medecin,

        p.nom AS nom_patient,
        p.prenom AS prenom_patient,

        m.nom AS nom_medecin,
        m.prenom AS prenom_medecin

      FROM ordonnance o

      INNER JOIN consultation c
        ON o.id_consultation = c.id_consultation

      INNER JOIN patient p
        ON c.id_patient = p.id_patient

      INNER JOIN medecin m
        ON c.id_medecin = m.id_medecin
    `;

    // ADMINISTRATEUR
    if (idRole === 1) {

      const [ordonnances] = await db.query(`
        ${sql}
        ORDER BY o.id_ordonnance DESC
      `);

      return res.status(200).json(ordonnances);
    }

    // MEDECIN
    if (idRole === 2) {

      const medecin = await trouverMedecin(
        req.user.id_utilisateur
      );

      if (!medecin) {
        return res.status(403).json({
          message: "Aucun médecin associé à ce compte."
        });
      }

      const [ordonnances] = await db.query(
        `
        ${sql}
        WHERE c.id_medecin = ?
        ORDER BY o.id_ordonnance DESC
        `,
        [medecin.id_medecin]
      );

      return res.status(200).json(ordonnances);
    }

    return res.status(403).json({
      message: "Accès aux ordonnances non autorisé."
    });

  } catch (error) {

    console.error("Erreur getOrdonnances :", error);

    return res.status(500).json({
      message: "Erreur lors du chargement des ordonnances."
    });

  }

};
/* =========================================================
   CREATION D'UNE ORDONNANCE
========================================================= */

exports.createOrdonnance = async (req, res) => {

  try {

    const idRole = Number(req.user.id_role);

    if (idRole !== 1 && idRole !== 2) {
      return res.status(403).json({
        message: "Création d'ordonnance non autorisée."
      });
    }

    const {
      id_consultation,
      date_ordonnance,
      motif,
      prescription,
      instructions
    } = req.body;

    const idConsultation = Number(id_consultation);

    if (
      !Number.isInteger(idConsultation) ||
      idConsultation <= 0 ||
      !date_ordonnance ||
      !prescription?.trim()
    ) {
      return res.status(400).json({
        message:
          "Consultation, date et prescription obligatoires."
      });
    }

    // Vérifier que la consultation existe
    const [consultations] = await db.query(
      `
      SELECT
        id_consultation,
        id_medecin
      FROM consultation
      WHERE id_consultation = ?
      `,
      [idConsultation]
    );

    if (consultations.length === 0) {
      return res.status(404).json({
        message: "Consultation introuvable."
      });
    }

    // Vérifier les droits du médecin
    if (idRole === 2) {

      const medecin = await trouverMedecin(
        req.user.id_utilisateur
      );

      if (
        !medecin ||
        Number(consultations[0].id_medecin) !==
          Number(medecin.id_medecin)
      ) {
        return res.status(403).json({
          message:
            "Cette consultation ne vous appartient pas."
        });
      }
    }

    // Vérifier qu'une ordonnance n'existe pas déjà
    const [existantes] = await db.query(
      `
      SELECT id_ordonnance
      FROM ordonnance
      WHERE id_consultation = ?
      LIMIT 1
      `,
      [idConsultation]
    );

    if (existantes.length > 0) {
      return res.status(409).json({
        message:
          "Une ordonnance existe déjà pour cette consultation."
      });
    }

    // Enregistrer l'ordonnance
    const [result] = await db.query(
      `
      INSERT INTO ordonnance (
        id_consultation,
        date_ordonnance,
        motif,
        prescription,
        instructions
      )
      VALUES (?, ?, ?, ?, ?)
      `,
      [
        idConsultation,
        date_ordonnance,
        motif || null,
        prescription.trim(),
        instructions || null
      ]
    );

    return res.status(201).json({
      message: "Ordonnance enregistrée avec succès.",
      id_ordonnance: result.insertId
    });

  } catch (error) {

    console.error("Erreur createOrdonnance :", error);

    return res.status(500).json({
      message: "Erreur lors de la création de l'ordonnance."
    });
  }
};

/* =========================================================
   DASHBOARD INFIRMIER
   VERSION TEMPORAIRE
========================================================= */

exports.getInfirmierDashboard = async (req, res) => {
  try {
    return res.status(501).json({
      message: "Dashboard infirmier à restaurer."
    });
  } catch (error) {
    console.error("Erreur dashboard infirmier :", error);

    return res.status(500).json({
      message: "Erreur serveur."
    });
  }
};