const db = require("../config/database");

// =====================================================
// CONFIGURATION
// =====================================================

const MODES = [
  "ESPECES",
  "CARTE",
  "VIREMENT",
  "MOBILE_MONEY"
];

const PAIEMENT_SELECT = `
  SELECT
    pa.id_paiement,
    pa.date_paiement,
    pa.montant,
    pa.mode_paiement,
    pa.id_facture,

    f.date_facture,
    f.montant_total,
    f.statut,
    f.id_patient,

    p.nom AS nom_patient,
    p.prenom AS prenom_patient

  FROM paiement pa

  INNER JOIN facture f
    ON f.id_facture = pa.id_facture

  INNER JOIN patient p
    ON p.id_patient = f.id_patient
`;

// =====================================================
// UTILITAIRES
// =====================================================

function montantEnCentimes(valeur) {
  if (
    valeur === null ||
    valeur === undefined ||
    valeur === ""
  ) {
    return null;
  }

  const texte = String(valeur).trim();

  if (!/^\d+(\.\d{1,2})?$/.test(texte)) {
    return null;
  }

  const [entier, decimal = ""] = texte.split(".");

  const centimes =
    Number(entier) * 100 +
    Number(decimal.padEnd(2, "0"));

  if (
    !Number.isSafeInteger(centimes) ||
    centimes <= 0 ||
    centimes > 9999999999
  ) {
    return null;
  }

  return centimes;
}

function centimesVersSQL(centimes) {
  return (centimes / 100).toFixed(2);
}

function dateSQL(valeur) {
  if (typeof valeur !== "string") {
    return null;
  }

  const date = valeur.trim().replace("T", " ");

  const resultat =
    /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(date)
      ? `${date}:00`
      : date;

  if (
    !/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(
      resultat
    )
  ) {
    return null;
  }

  const d = new Date(resultat.replace(" ", "T"));

  if (Number.isNaN(d.getTime())) {
    return null;
  }

  return resultat;
}

// =====================================================
// GET /api/paiements
// RÉCUPÉRER TOUS LES PAIEMENTS
// =====================================================

exports.getPaiements = async (req, res) => {
  try {
    const [rows] = await db.query(`
      ${PAIEMENT_SELECT}
      ORDER BY pa.date_paiement DESC, pa.id_paiement DESC
    `);

    res.json(rows);

  } catch (error) {
    console.error("getPaiements :", error);

    res.status(500).json({
      message: "Impossible de charger les paiements."
    });
  }
};

// =====================================================
// GET /api/paiements/statistiques
// =====================================================

exports.getStatistiques = async (req, res) => {
  try {
    const [[paiements]] = await db.query(`
      SELECT
        COUNT(*) AS total_paiements,

        COALESCE(SUM(montant), 0) AS total_encaisse,

        COALESCE(
          SUM(
            CASE
              WHEN DATE(date_paiement) = CURDATE()
              THEN montant
              ELSE 0
            END
          ),
          0
        ) AS encaisse_aujourdhui

      FROM paiement
    `);

    const [[factures]] = await db.query(`
      SELECT
        COUNT(*) AS factures_non_soldees
      FROM facture
      WHERE statut IN ('NON_PAYEE', 'PARTIELLE')
    `);

    res.json({
      total_paiements: Number(paiements.total_paiements),
      total_encaisse: Number(paiements.total_encaisse),
      encaisse_aujourdhui: Number(
        paiements.encaisse_aujourdhui
      ),
      factures_non_soldees: Number(
        factures.factures_non_soldees
      )
    });

  } catch (error) {
    console.error("getStatistiques paiement :", error);

    res.status(500).json({
      message: "Impossible de charger les statistiques."
    });
  }
};

// =====================================================
// GET /api/paiements/factures-disponibles
// FACTURES AVEC SOLDE RESTANT
// =====================================================

exports.getFacturesDisponibles = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        f.id_facture,
        f.id_patient,
        f.date_facture,
        f.montant_total,
        f.statut,

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
        f.id_patient,
        f.date_facture,
        f.montant_total,
        f.statut,
        p.nom,
        p.prenom

      HAVING reste_a_payer > 0

      ORDER BY f.date_facture DESC, f.id_facture DESC
    `);

    res.json(rows);

  } catch (error) {
    console.error("getFacturesDisponibles :", error);

    res.status(500).json({
      message: "Impossible de charger les factures."
    });
  }
};

// =====================================================
// GET /api/paiements/:id
// =====================================================

exports.getPaiementById = async (req, res) => {
  try {
    const [rows] = await db.query(
      `
      ${PAIEMENT_SELECT}
      WHERE pa.id_paiement = ?
      `,
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({
        message: "Paiement introuvable."
      });
    }

    res.json(rows[0]);

  } catch (error) {
    console.error("getPaiementById :", error);

    res.status(500).json({
      message: "Impossible de consulter le paiement."
    });
  }
};

// =====================================================
// POST /api/paiements
// ENREGISTRER UN PAIEMENT
// =====================================================

exports.createPaiement = async (req, res) => {
  const {
    id_facture,
    montant,
    mode_paiement,
    date_paiement
  } = req.body;

  const factureId = Number(id_facture);

  const montantCentimes = montantEnCentimes(montant);

  const datePaiement = dateSQL(date_paiement);

  if (
    !Number.isSafeInteger(factureId) ||
    factureId <= 0
  ) {
    return res.status(400).json({
      message: "Veuillez sélectionner une facture valide."
    });
  }

  if (montantCentimes === null) {
    return res.status(400).json({
      message: "Le montant du paiement est invalide."
    });
  }

  if (!MODES.includes(mode_paiement)) {
    return res.status(400).json({
      message: "Mode de paiement invalide."
    });
  }

  if (!datePaiement) {
    return res.status(400).json({
      message: "Date de paiement invalide."
    });
  }

  let connection;

  try {
    connection = await db.getConnection();

    await connection.beginTransaction();

    // Verrouiller la facture pour empêcher
    // deux paiements simultanés dépassant le solde.

    const [factures] = await connection.query(
      `
      SELECT
        id_facture,
        montant_total,
        statut
      FROM facture
      WHERE id_facture = ?
      FOR UPDATE
      `,
      [factureId]
    );

    if (!factures.length) {
      await connection.rollback();

      return res.status(404).json({
        message: "Facture introuvable."
      });
    }

    const facture = factures[0];

    const [[resultat]] = await connection.query(
      `
      SELECT
        COALESCE(SUM(montant), 0) AS montant_paye
      FROM paiement
      WHERE id_facture = ?
      `,
      [factureId]
    );

    const totalCentimes = Math.round(
      Number(facture.montant_total) * 100
    );

    const dejaPayeCentimes = Math.round(
      Number(resultat.montant_paye) * 100
    );

    const resteCentimes =
      totalCentimes - dejaPayeCentimes;

    if (resteCentimes <= 0) {
      await connection.rollback();

      return res.status(409).json({
        message: "Cette facture est déjà entièrement payée."
      });
    }

    if (montantCentimes > resteCentimes) {
      await connection.rollback();

      return res.status(400).json({
        message:
          "Le paiement dépasse le solde restant : " +
          centimesVersSQL(resteCentimes) +
          " FDJ."
      });
    }

    // Insérer le paiement

    const [result] = await connection.query(
      `
      INSERT INTO paiement (
        date_paiement,
        montant,
        mode_paiement,
        id_facture
      )
      VALUES (?, ?, ?, ?)
      `,
      [
        datePaiement,
        centimesVersSQL(montantCentimes),
        mode_paiement,
        factureId
      ]
    );

    // Calculer le nouveau statut

    const nouveauTotal =
      dejaPayeCentimes + montantCentimes;

    let nouveauStatut = "NON_PAYEE";

    if (nouveauTotal >= totalCentimes) {
      nouveauStatut = "PAYEE";
    } else if (nouveauTotal > 0) {
      nouveauStatut = "PARTIELLE";
    }

    await connection.query(
      `
      UPDATE facture
      SET statut = ?
      WHERE id_facture = ?
      `,
      [nouveauStatut, factureId]
    );

    await connection.commit();

    res.status(201).json({
      success: true,

      message: "Paiement enregistré avec succès.",

      id_paiement: result.insertId,

      id_facture: factureId,

      montant_paye: centimesVersSQL(nouveauTotal),

      reste_a_payer: centimesVersSQL(
        totalCentimes - nouveauTotal
      ),

      statut_facture: nouveauStatut
    });

  } catch (error) {
    if (connection) {
      await connection.rollback();
    }

    console.error("createPaiement :", error);

    res.status(500).json({
      message: "Impossible d'enregistrer le paiement."
    });

  } finally {
    if (connection) {
      connection.release();
    }
  }
};