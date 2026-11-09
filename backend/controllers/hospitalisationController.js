const db = require("../config/database");

exports.getHospitalisations = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT
        h.*,
        p.nom AS nom_patient,
        p.prenom AS prenom_patient,
        l.numero_lit,
        c.numero_chambre

       FROM hospitalisation h

       JOIN patient p
       ON h.id_patient = p.id_patient

       JOIN lit l
       ON h.id_lit = l.id_lit

       JOIN chambre c
       ON l.id_chambre = c.id_chambre

       ORDER BY h.date_entree DESC`
    );

    res.json(rows);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Erreur serveur"
    });
  }
};


exports.getHospitalisationById = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM hospitalisation WHERE id_hospitalisation = ?",
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({
        message: "Hospitalisation introuvable"
      });
    }

    res.json(rows[0]);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Erreur serveur"
    });
  }
};


exports.createHospitalisation = async (req, res) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const {
      date_entree,
      motif,
      id_patient,
      id_lit
    } = req.body;

    const [lits] = await connection.query(
      "SELECT statut FROM lit WHERE id_lit = ?",
      [id_lit]
    );

    if (!lits.length) {
      await connection.rollback();

      return res.status(404).json({
        message: "Lit introuvable"
      });
    }

    if (lits[0].statut !== "DISPONIBLE") {
      await connection.rollback();

      return res.status(400).json({
        message: "Ce lit est déjà occupé"
      });
    }

    const [result] = await connection.query(
      `INSERT INTO hospitalisation
      (
        date_entree,
        date_sortie,
        motif,
        id_patient,
        id_lit
      )

      VALUES (?, NULL, ?, ?, ?)`,
      [
        date_entree,
        motif,
        id_patient,
        id_lit
      ]
    );

    await connection.query(
      `UPDATE lit
       SET statut = 'OCCUPE'
       WHERE id_lit = ?`,
      [id_lit]
    );

    await connection.commit();

    res.status(201).json({
      message: "Hospitalisation enregistrée",
      id_hospitalisation: result.insertId
    });

  } catch (error) {
    await connection.rollback();

    console.error(error);

    res.status(500).json({
      message: "Erreur hospitalisation"
    });

  } finally {
    connection.release();
  }
};


exports.sortiePatient = async (req, res) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [hospitalisations] = await connection.query(
      `SELECT id_lit
       FROM hospitalisation
       WHERE id_hospitalisation = ?`,
      [req.params.id]
    );

    if (!hospitalisations.length) {
      await connection.rollback();

      return res.status(404).json({
        message: "Hospitalisation introuvable"
      });
    }

    const idLit = hospitalisations[0].id_lit;

    await connection.query(
      `UPDATE hospitalisation
       SET date_sortie = NOW()
       WHERE id_hospitalisation = ?`,
      [req.params.id]
    );

    await connection.query(
      `UPDATE lit
       SET statut = 'DISPONIBLE'
       WHERE id_lit = ?`,
      [idLit]
    );

    await connection.commit();

    res.json({
      message: "Sortie enregistrée et lit libéré"
    });

  } catch (error) {
    await connection.rollback();

    console.error(error);

    res.status(500).json({
      message: "Erreur sortie patient"
    });

  } finally {
    connection.release();
  }
};