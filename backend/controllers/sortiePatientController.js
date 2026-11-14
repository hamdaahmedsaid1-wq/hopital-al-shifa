const db = require("../config/database");

const MOTIFS = [
  "guerison",
  "amelioration",
  "transfert",
  "sortie_volontaire",
  "autre"
];

const SORTIE_SELECT = `
  SELECT
    s.*,
    h.date_entree,
    h.id_patient,
    p.nom AS nom_patient,
    p.prenom AS prenom_patient,
    l.numero_lit,
    c.numero_chambre
  FROM sortie_patient s
  JOIN hospitalisation h
    ON h.id_hospitalisation = s.id_hospitalisation
  JOIN patient p
    ON p.id_patient = h.id_patient
  JOIN lit l
    ON l.id_lit = h.id_lit
  JOIN chambre c
    ON c.id_chambre = l.id_chambre
`;

function dateSQL(valeur) {
  if (typeof valeur !== "string") return null;

  const texte = valeur.trim().replace("T", " ");

  if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(:\d{2})?$/.test(texte)) {
    return null;
  }

  const resultat =
    texte.length === 16 ? `${texte}:00` : texte;

  const d = new Date(resultat.replace(" ", "T"));

  if (Number.isNaN(d.getTime())) return null;

  return resultat;
}

function dateValide(valeur) {
  if (!valeur) return true;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(valeur)) {
    return false;
  }

  const d = new Date(`${valeur}T12:00:00`);

  return !Number.isNaN(d.getTime());
}

function validerInformations(body, creation = false) {
  const erreurs = [];

  if (creation && !Number.isInteger(Number(body.id_hospitalisation))) {
    erreurs.push("Hospitalisation invalide");
  }

  if (!MOTIFS.includes(body.motif_sortie)) {
    erreurs.push("Motif de sortie invalide");
  }

  if (
    typeof body.diagnostic_sortie !== "string" ||
    !body.diagnostic_sortie.trim()
  ) {
    erreurs.push("Diagnostic obligatoire");
  }

  if (!dateValide(body.prochain_controle)) {
    erreurs.push("Date de contrôle invalide");
  }

  const statutAttendu =
    body.motif_sortie === "transfert" ? "transfere" : "sorti";

  if (
    body.statut &&
    body.statut !== statutAttendu
  ) {
    erreurs.push("Statut incompatible avec le motif");
  }

  return erreurs;
}

// =====================================================
// GET /api/sorties-patient
// =====================================================

exports.getSorties = async (req, res) => {
  try {
    const [rows] = await db.query(`
      ${SORTIE_SELECT}
      ORDER BY s.date_sortie DESC, s.id_sortie DESC
    `);

    res.json(rows);
  } catch (error) {
    console.error("getSorties :", error);

    res.status(500).json({
      message: "Impossible de charger les sorties."
    });
  }
};

// =====================================================
// GET /api/sorties-patient/statistiques
// =====================================================

exports.getStatistiques = async (req, res) => {
  try {
    const [[hospitalises]] = await db.query(`
      SELECT COUNT(*) AS total
      FROM hospitalisation
      WHERE date_sortie IS NULL
    `);

    const [[sorties]] = await db.query(`
      SELECT
        COUNT(*) AS total,
        SUM(DATE(date_sortie) = CURDATE()) AS aujourd_hui,
        SUM(
          YEAR(date_sortie) = YEAR(CURDATE())
          AND MONTH(date_sortie) = MONTH(CURDATE())
        ) AS ce_mois
      FROM sortie_patient
    `);

    const [[lits]] = await db.query(`
      SELECT COUNT(*) AS total
      FROM lit
      WHERE statut = 'DISPONIBLE'
    `);

    res.json({
      hospitalises: Number(hospitalises.total),
      sorties: Number(sorties.total),
      aujourd_hui: Number(sorties.aujourd_hui || 0),
      ce_mois: Number(sorties.ce_mois || 0),
      lits_disponibles: Number(lits.total)
    });
  } catch (error) {
    console.error("getStatistiques :", error);

    res.status(500).json({
      message: "Impossible de charger les statistiques."
    });
  }
};

// =====================================================
// GET /api/sorties-patient/hospitalisations-actives
// =====================================================

exports.getHospitalisationsActives = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        h.id_hospitalisation,
        h.id_patient,
        h.id_lit,
        h.date_entree,
        h.motif,
        p.nom AS nom_patient,
        p.prenom AS prenom_patient,
        l.numero_lit,
        c.numero_chambre
      FROM hospitalisation h
      JOIN patient p ON p.id_patient = h.id_patient
      JOIN lit l ON l.id_lit = h.id_lit
      JOIN chambre c ON c.id_chambre = l.id_chambre
      WHERE h.date_sortie IS NULL
      ORDER BY h.date_entree DESC
    `);

    res.json(rows);
  } catch (error) {
    console.error("getHospitalisationsActives :", error);

    res.status(500).json({
      message: "Impossible de charger les hospitalisations."
    });
  }
};

// =====================================================
// GET /api/sorties-patient/:id
// =====================================================

exports.getSortieById = async (req, res) => {
  try {
    const [rows] = await db.query(
      `${SORTIE_SELECT} WHERE s.id_sortie = ?`,
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({
        message: "Sortie introuvable."
      });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error("getSortieById :", error);

    res.status(500).json({
      message: "Erreur de consultation."
    });
  }
};

// =====================================================
// POST /api/sorties-patient
// =====================================================

exports.createSortie = async (req, res) => {
  const erreurs = validerInformations(req.body, true);

  const sortieDate = dateSQL(req.body.date_sortie);

  if (!sortieDate) {
    erreurs.push("Date et heure de sortie invalides");
  }

  if (erreurs.length) {
    return res.status(400).json({
      message: erreurs.join(". ")
    });
  }

  const {
    id_hospitalisation,
    motif_sortie,
    diagnostic_sortie,
    traitement_sortie,
    recommandations,
    prochain_controle
  } = req.body;

  const statut =
    motif_sortie === "transfert" ? "transfere" : "sorti";

  let connection;

  try {
    connection = await db.getConnection();

    await connection.beginTransaction();

    const [hospitalisations] = await connection.query(
      `
      SELECT
        id_hospitalisation,
        id_lit,
        date_entree,
        date_sortie
      FROM hospitalisation
      WHERE id_hospitalisation = ?
      FOR UPDATE
      `,
      [id_hospitalisation]
    );

    if (!hospitalisations.length) {
      await connection.rollback();

      return res.status(404).json({
        message: "Hospitalisation introuvable."
      });
    }

    const h = hospitalisations[0];

    if (h.date_sortie !== null) {
      await connection.rollback();

      return res.status(409).json({
        message: "Ce patient est déjà sorti."
      });
    }

    if (new Date(sortieDate.replace(" ", "T")) <
        new Date(h.date_entree)) {
      await connection.rollback();

      return res.status(400).json({
        message: "La sortie ne peut pas précéder l'entrée."
      });
    }

    const [lits] = await connection.query(
      `
      SELECT id_lit, statut
      FROM lit
      WHERE id_lit = ?
      FOR UPDATE
      `,
      [h.id_lit]
    );

    if (
      !lits.length ||
      lits[0].statut !== "OCCUPE"
    ) {
      await connection.rollback();

      return res.status(409).json({
        message: "Le lit n'est pas marqué comme occupé."
      });
    }

    const [result] = await connection.query(
      `
      INSERT INTO sortie_patient (
        id_hospitalisation,
        date_sortie,
        motif_sortie,
        diagnostic_sortie,
        traitement_sortie,
        recommandations,
        prochain_controle,
        statut
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        id_hospitalisation,
        sortieDate,
        motif_sortie,
        diagnostic_sortie.trim(),
        traitement_sortie || null,
        recommandations || null,
        prochain_controle || null,
        statut
      ]
    );

    await connection.query(
      `
      UPDATE hospitalisation
      SET date_sortie = ?
      WHERE id_hospitalisation = ?
      `,
      [sortieDate, id_hospitalisation]
    );

    await connection.query(
      `
      UPDATE lit
      SET statut = 'DISPONIBLE'
      WHERE id_lit = ?
      `,
      [h.id_lit]
    );

    await connection.commit();

    res.status(201).json({
      success: true,
      message: "Sortie enregistrée et lit libéré.",
      id_sortie: result.insertId
    });

  } catch (error) {
    if (connection) {
      await connection.rollback();
    }

    console.error("createSortie :", error);

    res.status(error.code === "ER_DUP_ENTRY" ? 409 : 500).json({
      message:
        error.code === "ER_DUP_ENTRY"
          ? "Une sortie existe déjà pour cette hospitalisation."
          : "Impossible d'enregistrer la sortie."
    });

  } finally {
    if (connection) connection.release();
  }
};

// =====================================================
// PUT /api/sorties-patient/:id
// Modifier uniquement les informations médicales.
// Ne jamais modifier ici l'hospitalisation ou le lit.
// =====================================================

exports.updateSortie = async (req, res) => {
  const erreurs = validerInformations(req.body);

  if (erreurs.length) {
    return res.status(400).json({
      message: erreurs.join(". ")
    });
  }

  const {
    motif_sortie,
    diagnostic_sortie,
    traitement_sortie,
    recommandations,
    prochain_controle
  } = req.body;

  const statut =
    motif_sortie === "transfert" ? "transfere" : "sorti";

  try {
    const [result] = await db.query(
      `
      UPDATE sortie_patient
      SET
        motif_sortie = ?,
        diagnostic_sortie = ?,
        traitement_sortie = ?,
        recommandations = ?,
        prochain_controle = ?,
        statut = ?
      WHERE id_sortie = ?
      `,
      [
        motif_sortie,
        diagnostic_sortie.trim(),
        traitement_sortie || null,
        recommandations || null,
        prochain_controle || null,
        statut,
        req.params.id
      ]
    );

    if (!result.affectedRows) {
      return res.status(404).json({
        message: "Sortie introuvable."
      });
    }

    res.json({
      success: true,
      message: "Dossier de sortie mis à jour."
    });

  } catch (error) {
    console.error("updateSortie :", error);

    res.status(500).json({
      message: "Impossible de modifier le dossier."
    });
  }
};