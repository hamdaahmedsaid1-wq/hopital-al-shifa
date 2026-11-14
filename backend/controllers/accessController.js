const db = require("../config/database");

/* =========================================================
   FONCTIONS UTILITAIRES
========================================================= */

function erreurServeur(res, titre, error) {
  console.error(titre, error);

  return res.status(500).json({
    message: "Une erreur serveur est survenue."
  });
}

function identifiantValide(valeur) {
  const id = Number(valeur);

  return Number.isInteger(id) && id > 0;
}

function getIdUtilisateur(req) {
  return Number(req.user?.id_utilisateur);
}

function getIdRole(req) {
  return Number(req.user?.id_role);
}

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

async function patientAutorise(idPatient, idMedecin) {
  const [patients] = await db.query(
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
    [idPatient, idMedecin, idMedecin]
  );

  return patients.length > 0;
}

/* =========================================================
   UTILISATEUR CONNECTÉ
========================================================= */

exports.getMe = async (req, res) => {
  try {
    const idUtilisateur = getIdUtilisateur(req);

    if (!identifiantValide(idUtilisateur)) {
      return res.status(401).json({
        message: "Utilisateur non authentifié."
      });
    }

    const [utilisateurs] = await db.query(
      `
        SELECT *
        FROM utilisateur
        WHERE id_utilisateur = ?
        LIMIT 1
      `,
      [idUtilisateur]
    );

    if (!utilisateurs.length) {
      return res.status(404).json({
        message: "Utilisateur introuvable."
      });
    }

    const utilisateur = { ...utilisateurs[0] };

    // Supprimer les informations sensibles.
    delete utilisateur.mot_de_passe;
    delete utilisateur.password;
    delete utilisateur.password_hash;
    delete utilisateur.token;
    delete utilisateur.refresh_token;

    const idRole = Number(
      utilisateur.id_role ?? req.user.id_role
    );

    let medecin = null;

    if (idRole === 2) {
      medecin = await trouverMedecin(idUtilisateur);

      if (!medecin) {
        return res.status(403).json({
          message:
            "Aucun médecin n'est associé à ce compte."
        });
      }
    }

    return res.status(200).json({
      ...utilisateur,
      medecin
    });

  } catch (error) {
    return erreurServeur(res, "Erreur getMe :", error);
  }
};

/* =========================================================
   LISTE DES PATIENTS
========================================================= */

exports.getPatients = async (req, res) => {
  try {
    const idRole = getIdRole(req);

    // Administrateur et réceptionniste
    if (idRole === 1 || idRole === 3) {
      const [patients] = await db.query(
        `
          SELECT *
          FROM patient
          ORDER BY nom ASC, prenom ASC
        `
      );

      return res.status(200).json(patients);
    }

    // Médecin
    if (idRole === 2) {
      const medecin = await trouverMedecin(
        getIdUtilisateur(req)
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

      return res.status(200).json(patients);
    }

    return res.status(403).json({
      message: "Accès aux patients non autorisé."
    });

  } catch (error) {
    return erreurServeur(
      res,
      "Erreur getPatients :",
      error
    );
  }
};

/* =========================================================
   DOSSIER D'UN PATIENT
========================================================= */

exports.getPatientById = async (req, res) => {
  try {
    const idPatient = Number(req.params.id);
    const idRole = getIdRole(req);

    if (!identifiantValide(idPatient)) {
      return res.status(400).json({
        message: "Identifiant patient invalide."
      });
    }

    // Administrateur et réceptionniste
    if (idRole === 1 || idRole === 3) {
      const [patients] = await db.query(
        `
          SELECT *
          FROM patient
          WHERE id_patient = ?
          LIMIT 1
        `,
        [idPatient]
      );

      if (!patients.length) {
        return res.status(404).json({
          message: "Patient introuvable."
        });
      }

      return res.status(200).json(patients[0]);
    }

    // Médecin
    if (idRole === 2) {
      const medecin = await trouverMedecin(
        getIdUtilisateur(req)
      );

      if (!medecin) {
        return res.status(403).json({
          message: "Aucun médecin associé à ce compte."
        });
      }

      const autorise = await patientAutorise(
        idPatient,
        medecin.id_medecin
      );

      if (!autorise) {
        return res.status(403).json({
          message: "Accès à ce patient non autorisé."
        });
      }

      const [patients] = await db.query(
        `
          SELECT *
          FROM patient
          WHERE id_patient = ?
          LIMIT 1
        `,
        [idPatient]
      );

      if (!patients.length) {
        return res.status(404).json({
          message: "Patient introuvable."
        });
      }

      return res.status(200).json(patients[0]);
    }

    return res.status(403).json({
      message: "Accès non autorisé."
    });

  } catch (error) {
    return erreurServeur(
      res,
      "Erreur getPatientById :",
      error
    );
  }
};

/* =========================================================
   LISTE DES RENDEZ-VOUS
========================================================= */

exports.getRendezVous = async (req, res) => {
  try {
    const idRole = getIdRole(req);

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

    // Administrateur et réceptionniste
    if (idRole === 1 || idRole === 3) {
      const [rendezVous] = await db.query(
        `
          ${requeteBase}
          ORDER BY rv.date_rdv DESC, rv.heure_rdv ASC
        `
      );

      return res.status(200).json(rendezVous);
    }

    // Médecin
    if (idRole === 2) {
      const medecin = await trouverMedecin(
        getIdUtilisateur(req)
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

      return res.status(200).json(rendezVous);
    }

    return res.status(403).json({
      message: "Accès aux rendez-vous non autorisé."
    });

  } catch (error) {
    return erreurServeur(
      res,
      "Erreur getRendezVous :",
      error
    );
  }
};

/* =========================================================
   LISTE DES CONSULTATIONS
========================================================= */

exports.getConsultations = async (req, res) => {
  try {
    const idRole = getIdRole(req);

    const requeteBase = `
      SELECT
        c.*,

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

    // Administrateur : toutes les consultations
    if (idRole === 1) {
      const [consultations] = await db.query(
        `
          ${requeteBase}
          ORDER BY c.id_consultation DESC
        `
      );

      return res.status(200).json(consultations);
    }

    // Médecin : uniquement ses consultations
    if (idRole === 2) {
      const medecin = await trouverMedecin(
        getIdUtilisateur(req)
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

      return res.status(200).json(consultations);
    }

    return res.status(403).json({
      message: "Accès aux consultations non autorisé."
    });

  } catch (error) {
    return erreurServeur(
      res,
      "Erreur getConsultations :",
      error
    );
  }
};

/* =========================================================
   CRÉATION D'UNE CONSULTATION
========================================================= */

exports.createConsultation = async (req, res) => {
  try {
    const idRole = getIdRole(req);

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

    const idPatient = Number(id_patient);

    if (
      !identifiantValide(idPatient) ||
      !date_consultation ||
      !String(motif || "").trim() ||
      !String(diagnostic || "").trim()
    ) {
      return res.status(400).json({
        message:
          "Patient, date, motif et diagnostic sont obligatoires."
      });
    }

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(
        String(date_consultation)
      )
    ) {
      return res.status(400).json({
        message: "Format de date invalide."
      });
    }

    let medecinId;

    // Médecin connecté
    if (idRole === 2) {
      const medecin = await trouverMedecin(
        getIdUtilisateur(req)
      );

      if (!medecin) {
        return res.status(403).json({
          message: "Aucun médecin associé à ce compte."
        });
      }

      // L'identité du médecin provient du compte connecté.
      medecinId = medecin.id_medecin;

      const autorise = await patientAutorise(
        idPatient,
        medecinId
      );

      if (!autorise) {
        return res.status(403).json({
          message:
            "Ce patient n'est pas autorisé pour ce médecin."
        });
      }

    } else if (idRole === 1) {
      // Administrateur
      medecinId = Number(id_medecin);

      if (!identifiantValide(medecinId)) {
        return res.status(400).json({
          message: "Veuillez sélectionner un médecin."
        });
      }

    } else {
      return res.status(403).json({
        message:
          "Création de consultation non autorisée."
      });
    }

    // Vérifier que le patient existe
    const [patients] = await db.query(
      `
        SELECT id_patient
        FROM patient
        WHERE id_patient = ?
        LIMIT 1
      `,
      [idPatient]
    );

    if (!patients.length) {
      return res.status(404).json({
        message: "Patient introuvable."
      });
    }

    // Vérifier que le médecin existe
    const [medecins] = await db.query(
      `
        SELECT id_medecin
        FROM medecin
        WHERE id_medecin = ?
        LIMIT 1
      `,
      [medecinId]
    );

    if (!medecins.length) {
      return res.status(404).json({
        message: "Médecin introuvable."
      });
    }

    // Enregistrement
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
        idPatient,
        medecinId,
        date_consultation,
        String(motif).trim(),
        symptomes || null,
        String(diagnostic).trim(),
        traitement || null,
        observations || null
      ]
    );

    return res.status(201).json({
      message: "Consultation enregistrée avec succès.",
      id_consultation: result.insertId
    });

  } catch (error) {
    return erreurServeur(
      res,
      "Erreur createConsultation :",
      error
    );
  }
};

/* =========================================================
   LISTE DES ORDONNANCES
========================================================= */

exports.getOrdonnances = async (req, res) => {
  try {
    const idRole = getIdRole(req);

    const requeteBase = `
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

    // Administrateur
    if (idRole === 1) {
      const [ordonnances] = await db.query(
        `
          ${requeteBase}
          ORDER BY o.id_ordonnance DESC
        `
      );

      return res.status(200).json(ordonnances);
    }

    // Médecin
    if (idRole === 2) {
      const medecin = await trouverMedecin(
        getIdUtilisateur(req)
      );

      if (!medecin) {
        return res.status(403).json({
          message: "Aucun médecin associé à ce compte."
        });
      }

      const [ordonnances] = await db.query(
        `
          ${requeteBase}
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
    return erreurServeur(
      res,
      "Erreur getOrdonnances :",
      error
    );
  }
};

/* =========================================================
   CRÉATION D'UNE ORDONNANCE
========================================================= */

exports.createOrdonnance = async (req, res) => {
  try {
    const idRole = getIdRole(req);

    if (idRole !== 1 && idRole !== 2) {
      return res.status(403).json({
        message:
          "Création d'ordonnance non autorisée."
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
      !identifiantValide(idConsultation) ||
      !date_ordonnance ||
      !String(prescription || "").trim()
    ) {
      return res.status(400).json({
        message:
          "Consultation, date et prescription obligatoires."
      });
    }

    // Vérifier la consultation
    const [consultations] = await db.query(
      `
        SELECT
          id_consultation,
          id_medecin
        FROM consultation
        WHERE id_consultation = ?
        LIMIT 1
      `,
      [idConsultation]
    );

    if (!consultations.length) {
      return res.status(404).json({
        message: "Consultation introuvable."
      });
    }

    // Vérifier les droits du médecin
    if (idRole === 2) {
      const medecin = await trouverMedecin(
        getIdUtilisateur(req)
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

    // Vérifier si une ordonnance existe déjà
    const [existantes] = await db.query(
      `
        SELECT id_ordonnance
        FROM ordonnance
        WHERE id_consultation = ?
        LIMIT 1
      `,
      [idConsultation]
    );

    if (existantes.length) {
      return res.status(409).json({
        message:
          "Une ordonnance existe déjà pour cette consultation."
      });
    }

    // Enregistrer
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
        String(prescription).trim(),
        instructions || null
      ]
    );

    return res.status(201).json({
      message: "Ordonnance enregistrée avec succès.",
      id_ordonnance: result.insertId
    });

  } catch (error) {
    return erreurServeur(
      res,
      "Erreur createOrdonnance :",
      error
    );
  }
};

/* =========================================================
   DASHBOARD INFIRMIER
========================================================= */

exports.getInfirmierDashboard = async (req, res) => {
  try {
    return res.status(501).json({
      message: "Dashboard infirmier à restaurer."
    });

  } catch (error) {
    return erreurServeur(
      res,
      "Erreur getInfirmierDashboard :",
      error
    );
  }
};