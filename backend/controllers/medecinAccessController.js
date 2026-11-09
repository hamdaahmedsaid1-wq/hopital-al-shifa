const db = require("../config/database");


// =====================================================
// TROUVER LE MEDECIN CONNECTE
// =====================================================

async function trouverMedecinConnecte(idUtilisateur) {

    const [rows] = await db.query(
        `
        SELECT
            id_medecin,
            nom,
            prenom,
            id_utilisateur
        FROM medecin
        WHERE id_utilisateur = ?
        `,
        [idUtilisateur]
    );

    if (rows.length === 0) {
        return null;
    }

    return rows[0];
}


// =====================================================
// MES PATIENTS
// =====================================================

exports.getMesPatients = async (req, res) => {

    try {

        const idUtilisateur = req.user.id_utilisateur;

        const medecin =
            await trouverMedecinConnecte(idUtilisateur);


        if (!medecin) {

            return res.status(404).json({
                message:
                    "Aucun médecin associé à ce compte."
            });

        }


        const [patients] = await db.query(
            `
            SELECT DISTINCT

                p.id_patient,
                p.nom,
                p.prenom,
                p.date_naissance,
                p.sexe,
                p.telephone,
                p.adresse,
                p.groupe_sanguin

            FROM patient p

            LEFT JOIN rendez_vous rv
                ON rv.id_patient = p.id_patient

            LEFT JOIN consultation c
                ON c.id_patient = p.id_patient

            WHERE
                rv.id_medecin = ?
                OR
                c.id_medecin = ?

            ORDER BY p.nom, p.prenom
            `,
            [
                medecin.id_medecin,
                medecin.id_medecin
            ]
        );


        res.json({
            medecin: {
                id_medecin: medecin.id_medecin,
                nom: medecin.nom,
                prenom: medecin.prenom
            },

            total: patients.length,

            patients
        });


    } catch (error) {

        console.error(
            "Erreur récupération patients médecin :",
            error
        );

        res.status(500).json({
            message: "Erreur serveur"
        });

    }

};