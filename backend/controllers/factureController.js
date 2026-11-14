const db = require("../config/database");

// =====================================================
// REQUÊTE COMMUNE
// =====================================================

const FACTURES_SELECT = `
  SELECT
    f.id_facture,
    f.date_facture,
    f.montant_total,
    f.statut,
    f.id_patient,

    p.nom AS nom_patient,
    p.prenom AS prenom_patient,

    COALESCE(SUM(pa.montant), 0) AS montant_paye,

    (
      f.montant_total -
      COALESCE(SUM(pa.montant), 0)
    ) AS reste_a_payer

  FROM facture f

  INNER JOIN patient p
    ON p.id_patient = f.id_patient

  LEFT JOIN paiement pa
    ON pa.id_facture = f.id_facture

  GROUP BY
    f.id_facture,
    f.date_facture,
    f.montant_total,
    f.statut,
    f.id_patient,
    p.nom,
    p.prenom
`;

// =====================================================
// GET : TOUTES LES FACTURES
// =====================================================

exports.getFactures = async (req, res) => {
  try {
    const [rows] = await db.query(`
      ${FACTURES_SELECT}
      ORDER BY f.date_facture DESC, f.id_facture DESC
    `);

    res.json(rows);

  } catch (error) {
    console.error("Erreur getFactures :", error);

    res.status(500).json({
      message: "Erreur lors du chargement des factures."
    });
  }
};

// =====================================================
// GET : FACTURE PAR ID
// =====================================================

exports.getFactureById = async (req, res) => {
  try {
    const [rows] = await db.query(
      `
      ${FACTURES_SELECT}
      HAVING f.id_facture = ?
      `,
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({
        message: "Facture introuvable."
      });
    }

    res.json(rows[0]);

  } catch (error) {
    console.error("Erreur getFactureById :", error);

    res.status(500).json({
      message: "Impossible de consulter la facture."
    });
  }
};

// =====================================================
// GET : STATISTIQUES
// =====================================================

exports.getStatistiques = async (req, res) => {
  try {
    const [[factures]] = await db.query(`
      SELECT
        COUNT(*) AS total_factures,
        COALESCE(SUM(montant_total), 0) AS total_facture
      FROM facture
    `);

    const [[paiements]] = await db.query(`
      SELECT
        COALESCE(SUM(montant), 0) AS total_paye
      FROM paiement
    `);

    const totalFacture = Number(factures.total_facture);
    const totalPaye = Number(paiements.total_paye);

    res.json({
      total_factures: Number(factures.total_factures),
      montant_facture: totalFacture,
      montant_paye: totalPaye,
      reste_a_payer: totalFacture - totalPaye
    });

  } catch (error) {
    console.error("Erreur statistiques factures :", error);

    res.status(500).json({
      message: "Erreur lors du chargement des statistiques."
    });
  }
};

// =====================================================
// POST : CRÉER UNE FACTURE
// =====================================================

exports.createFacture = async (req, res) => {
  const {
    id_patient,
    date_facture,
    montant_total
  } = req.body;

  const montant = Number(montant_total);

  if (
    !Number.isInteger(Number(id_patient)) ||
    Number(id_patient) <= 0 ||
    !date_facture ||
    !Number.isFinite(montant) ||
    montant <= 0 ||
    !Number.isInteger(Math.round(montant * 100))
  ) {
    return res.status(400).json({
      message: "Veuillez renseigner correctement tous les champs."
    });
  }

  try {
    const [patients] = await db.query(
      "SELECT id_patient FROM patient WHERE id_patient = ?",
      [id_patient]
    );

    if (!patients.length) {
      return res.status(404).json({
        message: "Patient introuvable."
      });
    }

    const [result] = await db.query(
      `
      INSERT INTO facture (
        date_facture,
        montant_total,
        statut,
        id_patient
      )
      VALUES (?, ?, 'NON_PAYEE', ?)
      `,
      [
        date_facture,
        montant,
        id_patient
      ]
    );

    res.status(201).json({
      success: true,
      message: "Facture créée avec succès.",
      id_facture: result.insertId
    });

  } catch (error) {
    console.error("Erreur createFacture :", error);

    res.status(500).json({
      message: "Impossible de créer la facture."
    });
  }
};

// =====================================================
// PUT : MODIFIER UNE FACTURE
// =====================================================

exports.updateFacture = async (req, res) => {
  const {
    id_patient,
    date_facture,
    montant_total
  } = req.body;

  const montant = Number(montant_total);

  if (
    !Number.isInteger(Number(id_patient)) ||
    Number(id_patient) <= 0 ||
    !date_facture ||
    !Number.isFinite(montant) ||
    montant <= 0
  ) {
    return res.status(400).json({
      message: "Informations de facture invalides."
    });
  }

  let connection;

  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    const [factures] = await connection.query(
      `
      SELECT id_facture
      FROM facture
      WHERE id_facture = ?
      FOR UPDATE
      `,
      [req.params.id]
    );

    if (!factures.length) {
      await connection.rollback();

      return res.status(404).json({
        message: "Facture introuvable."
      });
    }

    const [[paiements]] = await connection.query(
      `
      SELECT COUNT(*) AS total
      FROM paiement
      WHERE id_facture = ?
      `,
      [req.params.id]
    );

    if (Number(paiements.total) > 0) {
      await connection.rollback();

      return res.status(409).json({
        message:
          "Impossible de modifier une facture ayant déjà reçu un paiement."
      });
    }

    const [patients] = await connection.query(
      "SELECT id_patient FROM patient WHERE id_patient = ?",
      [id_patient]
    );

    if (!patients.length) {
      await connection.rollback();

      return res.status(404).json({
        message: "Patient introuvable."
      });
    }

    await connection.query(
      `
      UPDATE facture
      SET
        id_patient = ?,
        date_facture = ?,
        montant_total = ?,
        statut = 'NON_PAYEE'
      WHERE id_facture = ?
      `,
      [
        id_patient,
        date_facture,
        montant,
        req.params.id
      ]
    );

    await connection.commit();

    res.json({
      success: true,
      message: "Facture modifiée avec succès."
    });

  } catch (error) {
    if (connection) await connection.rollback();

    console.error("Erreur updateFacture :", error);

    res.status(500).json({
      message: "Impossible de modifier la facture."
    });

  } finally {
    if (connection) connection.release();
  }
};

// =====================================================
// DELETE : SUPPRIMER UNE FACTURE SANS PAIEMENT
// =====================================================

exports.deleteFacture = async (req, res) => {
  let connection;

  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    const [factures] = await connection.query(
      `
      SELECT id_facture
      FROM facture
      WHERE id_facture = ?
      FOR UPDATE
      `,
      [req.params.id]
    );

    if (!factures.length) {
      await connection.rollback();

      return res.status(404).json({
        message: "Facture introuvable."
      });
    }

    const [[paiements]] = await connection.query(
      `
      SELECT COUNT(*) AS total
      FROM paiement
      WHERE id_facture = ?
      `,
      [req.params.id]
    );

    if (Number(paiements.total) > 0) {
      await connection.rollback();

      return res.status(409).json({
        message:
          "Impossible de supprimer une facture ayant reçu un paiement."
      });
    }

    await connection.query(
      "DELETE FROM facture WHERE id_facture = ?",
      [req.params.id]
    );

    await connection.commit();

    res.json({
      success: true,
      message: "Facture supprimée avec succès."
    });

  } catch (error) {
    if (connection) await connection.rollback();

    console.error("Erreur deleteFacture :", error);

    res.status(500).json({
      message: "Impossible de supprimer la facture."
    });

  } finally {
    if (connection) connection.release();
  }
};