const db = require("../config/database");


// =========================================================
// RECUPERER TOUTES LES ORDONNANCES
// =========================================================

exports.getOrdonnances = async (req, res) => {
  try {

    const [rows] = await db.query(
      `
      SELECT
        o.*,
        c.diagnostic,
        p.nom AS nom_patient,
        p.prenom AS prenom_patient,
        m.nom AS nom_medecin,
        m.prenom AS prenom_medecin

      FROM ordonnance o

      JOIN consultation c
        ON o.id_consultation = c.id_consultation

      JOIN patient p
        ON c.id_patient = p.id_patient

      JOIN medecin m
        ON c.id_medecin = m.id_medecin

      ORDER BY o.date_ordonnance DESC
      `
    );

    res.json(rows);

  } catch (error) {

    console.error(
      "ERREUR GET ORDONNANCES :",
      error
    );

    res.status(500).json({
      message: "Erreur serveur"
    });
  }
};


// =========================================================
// RECUPERER UNE ORDONNANCE
// =========================================================

exports.getOrdonnanceById = async (req, res) => {
  try {

    const id = req.params.id;

    const [ordonnances] = await db.query(
      `
      SELECT
        o.*,
        c.diagnostic,
        p.nom AS nom_patient,
        p.prenom AS prenom_patient,
        m.nom AS nom_medecin,
        m.prenom AS prenom_medecin

      FROM ordonnance o

      JOIN consultation c
        ON o.id_consultation = c.id_consultation

      JOIN patient p
        ON c.id_patient = p.id_patient

      JOIN medecin m
        ON c.id_medecin = m.id_medecin

      WHERE o.id_ordonnance = ?
      `,
      [id]
    );


    if (ordonnances.length === 0) {

      return res.status(404).json({
        message: "Ordonnance introuvable"
      });

    }


    const [medicaments] = await db.query(
      `
      SELECT
        om.*,
        m.nom_medicament

      FROM ordonnance_medicament om

      JOIN medicament m
        ON om.id_medicament = m.id_medicament

      WHERE om.id_ordonnance = ?
      `,
      [id]
    );


    res.json({
      ordonnance: ordonnances[0],
      medicaments
    });


  } catch (error) {

    console.error(
      "ERREUR GET ORDONNANCE :",
      error
    );

    res.status(500).json({
      message: "Erreur serveur"
    });
  }
};


// =========================================================
// CREER UNE ORDONNANCE
// =========================================================

exports.createOrdonnance = async (req, res) => {

  let connection;

  try {

    connection = await db.getConnection();

    await connection.beginTransaction();


    const {
      date_ordonnance,
      id_consultation,
      motif,
      prescription,
      instructions
    } = req.body;


    console.log(
      "DONNEES ORDONNANCE RECUES :",
      req.body
    );


    // =====================================================
    // VERIFICATIONS
    // =====================================================

    if (!date_ordonnance) {

      await connection.rollback();

      return res.status(400).json({
        message: "La date de l'ordonnance est obligatoire"
      });
    }


    if (!id_consultation) {

      await connection.rollback();

      return res.status(400).json({
        message: "La consultation est obligatoire"
      });
    }


    if (
      !prescription ||
      typeof prescription !== "string" ||
      prescription.trim() === ""
    ) {

      await connection.rollback();

      return res.status(400).json({
        message: "La prescription est obligatoire"
      });
    }


    // =====================================================
    // VERIFIER LA CONSULTATION
    // =====================================================

    const [consultations] = await connection.query(
      `
      SELECT
        id_consultation,
        id_patient,
        id_medecin

      FROM consultation

      WHERE id_consultation = ?
      `,
      [
        Number(id_consultation)
      ]
    );


    if (consultations.length === 0) {

      await connection.rollback();

      return res.status(404).json({
        message: "Consultation introuvable"
      });
    }


    // =====================================================
    // VALEURS FINALES
    // =====================================================

    const motifFinal =
      typeof motif === "string" &&
      motif.trim() !== ""
        ? motif.trim()
        : "Traitement";


    const prescriptionFinale =
      prescription.trim();


    const instructionsFinales =
      typeof instructions === "string" &&
      instructions.trim() !== ""
        ? instructions.trim()
        : "Aucune instruction particulière";


    console.log(
      "INSTRUCTIONS FINALES :",
      instructionsFinales
    );


    // =====================================================
    // INSERTION ORDONNANCE
    // =====================================================

    const [result] = await connection.query(
      `
      INSERT INTO ordonnance
      (
        date_ordonnance,
        id_consultation,
        motif,
        prescription,
        instructions
      )

      VALUES (?, ?, ?, ?, ?)
      `,
      [
        date_ordonnance,
        Number(id_consultation),
        motifFinal,
        prescriptionFinale,
        instructionsFinales
      ]
    );


    const idOrdonnance =
      result.insertId;


    // =====================================================
    // VALIDER
    // =====================================================

    await connection.commit();


    return res.status(201).json({
      message: "Ordonnance créée avec succès",
      id_ordonnance: idOrdonnance
    });


  } catch (error) {

    if (connection) {

      try {

        await connection.rollback();

      } catch (rollbackError) {

        console.error(
          "ERREUR ROLLBACK :",
          rollbackError
        );

      }

    }


    console.error(
      "ERREUR CREATE ORDONNANCE :",
      error
    );


    return res.status(500).json({
      message: "Erreur création ordonnance",
      erreur: error.message
    });


  } finally {

    if (connection) {
      connection.release();
    }

  }

};


// =========================================================
// SUPPRIMER UNE ORDONNANCE
// =========================================================

exports.deleteOrdonnance = async (req, res) => {

  let connection;

  try {

    connection = await db.getConnection();

    await connection.beginTransaction();


    // Supprimer les médicaments liés
    await connection.query(
      `
      DELETE FROM ordonnance_medicament
      WHERE id_ordonnance = ?
      `,
      [
        req.params.id
      ]
    );


    // Supprimer l'ordonnance
    const [result] = await connection.query(
      `
      DELETE FROM ordonnance
      WHERE id_ordonnance = ?
      `,
      [
        req.params.id
      ]
    );


    if (result.affectedRows === 0) {

      await connection.rollback();

      return res.status(404).json({
        message: "Ordonnance introuvable"
      });
    }


    await connection.commit();


    res.json({
      message: "Ordonnance supprimée avec succès"
    });


  } catch (error) {

    if (connection) {

      try {

        await connection.rollback();

      } catch (rollbackError) {

        console.error(
          "ERREUR ROLLBACK DELETE :",
          rollbackError
        );

      }

    }


    console.error(
      "ERREUR DELETE ORDONNANCE :",
      error
    );


    res.status(500).json({
      message: "Suppression impossible",
      erreur: error.message
    });


  } finally {

    if (connection) {
      connection.release();
    }

  }

};