const db = require("../config/database");
const bcrypt = require("bcryptjs");

exports.getUtilisateurs = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT
        u.id_utilisateur,
        u.nom_utilisateur,
        u.id_role,
        r.nom_role

       FROM utilisateur u

       JOIN role r
       ON u.id_role = r.id_role

       ORDER BY u.id_utilisateur DESC`
    );

    res.json(rows);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Erreur serveur"
    });
  }
};


exports.getUtilisateurById = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT
        u.id_utilisateur,
        u.nom_utilisateur,
        u.id_role,
        r.nom_role

       FROM utilisateur u

       JOIN role r
       ON u.id_role = r.id_role

       WHERE u.id_utilisateur = ?`,
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({
        message: "Utilisateur introuvable"
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


exports.createUtilisateur = async (req, res) => {
  try {
    const {
      nom_utilisateur,
      mot_de_passe,
      id_role
    } = req.body;

    const hash = await bcrypt.hash(
      mot_de_passe,
      10
    );

    const [result] = await db.query(
      `INSERT INTO utilisateur
      (
        nom_utilisateur,
        mot_de_passe,
        id_role
      )

      VALUES (?, ?, ?)`,
      [
        nom_utilisateur,
        hash,
        id_role
      ]
    );

    res.status(201).json({
      message: "Utilisateur créé",
      id_utilisateur: result.insertId
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Erreur création utilisateur"
    });
  }
};


exports.updateUtilisateur = async (req, res) => {
  try {
    const {
      nom_utilisateur,
      id_role
    } = req.body;

    const [result] = await db.query(
      `UPDATE utilisateur

       SET nom_utilisateur = ?,
           id_role = ?

       WHERE id_utilisateur = ?`,
      [
        nom_utilisateur,
        id_role,
        req.params.id
      ]
    );

    if (!result.affectedRows) {
      return res.status(404).json({
        message: "Utilisateur introuvable"
      });
    }

    res.json({
      message: "Utilisateur modifié"
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Erreur modification utilisateur"
    });
  }
};


exports.deleteUtilisateur = async (req, res) => {
  try {
    const [result] = await db.query(
      "DELETE FROM utilisateur WHERE id_utilisateur = ?",
      [req.params.id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({
        message: "Utilisateur introuvable"
      });
    }

    res.json({
      message: "Utilisateur supprimé"
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Suppression impossible"
    });
  }
};