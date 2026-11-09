const db = require("../config/database");


// AFFICHER TOUS LES PATIENTS
exports.getPatients = async (req, res) => {
  try {
    const [patients] = await db.query(
      "SELECT * FROM patient ORDER BY id_patient DESC"
    );

    res.json(patients);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Erreur serveur"
    });
  }
};


// AFFICHER UN PATIENT
exports.getPatientById = async (req, res) => {
  try {
    const id = req.params.id;

    const [patients] = await db.query(
      "SELECT * FROM patient WHERE id_patient = ?",
      [id]
    );

    if (patients.length === 0) {
      return res.status(404).json({
        message: "Patient introuvable"
      });
    }

    res.json(patients[0]);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Erreur serveur"
    });
  }
};


// AJOUTER
exports.createPatient = async (req, res) => {
  try {
    const {
      nom,
      prenom,
      date_naissance,
      sexe,
      telephone,
      adresse,
      groupe_sanguin
    } = req.body;

    if (!nom || !prenom || !date_naissance || !sexe) {
      return res.status(400).json({
        message: "Informations obligatoires manquantes"
      });
    }

    const [result] = await db.query(
      `INSERT INTO patient
      (
        nom,
        prenom,
        date_naissance,
        sexe,
        telephone,
        adresse,
        groupe_sanguin
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        nom,
        prenom,
        date_naissance,
        sexe,
        telephone,
        adresse,
        groupe_sanguin
      ]
    );

    res.status(201).json({
      message: "Patient ajouté avec succès",
      id_patient: result.insertId
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Erreur ajout patient"
    });
  }
};


// MODIFIER
exports.updatePatient = async (req, res) => {
  try {
    const {
      nom,
      prenom,
      date_naissance,
      sexe,
      telephone,
      adresse,
      groupe_sanguin
    } = req.body;

    const [result] = await db.query(
      `UPDATE patient

       SET nom = ?,
           prenom = ?,
           date_naissance = ?,
           sexe = ?,
           telephone = ?,
           adresse = ?,
           groupe_sanguin = ?

       WHERE id_patient = ?`,
      [
        nom,
        prenom,
        date_naissance,
        sexe,
        telephone,
        adresse,
        groupe_sanguin,
        req.params.id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Patient introuvable"
      });
    }

    res.json({
      message: "Patient modifié avec succès"
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Erreur modification patient"
    });
  }
};


// SUPPRIMER
exports.deletePatient = async (req, res) => {
  try {
    const [result] = await db.query(
      "DELETE FROM patient WHERE id_patient = ?",
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Patient introuvable"
      });
    }

    res.json({
      message: "Patient supprimé"
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Impossible de supprimer ce patient"
    });
  }
};
