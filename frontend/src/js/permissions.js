import {
  getUtilisateurConnecte,
  deconnexion
} from "./secure-api.js";


/* =========================================================
   RECUPERER LE ROLE DE L'UTILISATEUR
========================================================= */

function getRole() {

  const utilisateur =
    getUtilisateurConnecte();

  if (!utilisateur) {
    return null;
  }

  return String(
    utilisateur.role || ""
  )
    .toLowerCase()
    .trim();

}


/* =========================================================
   RECUPERER LE DASHBOARD SELON LE ROLE
========================================================= */

function getDashboardParRole(role) {

  if (
    role.includes("administrateur") ||
    role.includes("admin")
  ) {
    return "/src/pages/dashboard.html";
  }


  if (
    role.includes("médecin") ||
    role.includes("medecin")
  ) {
    return "/src/pages/medecin-dashboard.html";
  }


  if (
    role.includes("réception") ||
    role.includes("reception")
  ) {
    return "/src/pages/reception-dashboard.html";
  }


  if (
    role.includes("caissier")
  ) {
    return "/src/pages/caissier-dashboard.html";
  }


  if (
    role.includes("infirmier")
  ) {
    return "/src/pages/infirmier-dashboard.html";
  }


  return "/";
}


/* =========================================================
   PAGES AUTORISEES PAR ROLE
========================================================= */

function getPagesAutorisees(role) {

  /* =====================================================
     ADMINISTRATEUR
  ===================================================== */

  if (
    role.includes("administrateur") ||
    role.includes("admin")
  ) {

    return [
      "dashboard.html",
      "patients.html",
      "patient-detail.html",
      "rendez-vous.html",
      "planifier-rendez-vous.html",
      "consultation.html",
      "ordonnance.html",
      "hospitalisation.html",
      "suivi-hospitalisation.html",
      "sortie-patient.html",
      "facture.html",
      "paiement.html",
      "utilisateurs.html",
      "profil.html",
      "rapports.html"
    ];

  }


  /* =====================================================
     MEDECIN
  ===================================================== */

  if (
    role.includes("médecin") ||
    role.includes("medecin")
  ) {

    return [
      "medecin-dashboard.html",
      "patients.html",
      "patient-detail.html",
      "rendez-vous.html",
      "consultation.html",
      "ordonnance.html",
      "profil.html"
    ];

  }


  /* =====================================================
     RECEPTIONNISTE
  ===================================================== */

  if (
    role.includes("réception") ||
    role.includes("reception")
  ) {

    return [
      "reception-dashboard.html",
      "patients.html",
      "patient-detail.html",
      "rendez-vous.html",
      "planifier-rendez-vous.html",
      "profil.html"
    ];

  }


  /* =====================================================
     CAISSIER
  ===================================================== */

  if (
    role.includes("caissier")
  ) {

    return [
      "caissier-dashboard.html",
      "facture.html",
      "paiement.html",
      "profil.html"
    ];

  }


  /* =====================================================
     INFIRMIER
  ===================================================== */

  if (
    role.includes("infirmier")
  ) {

    return [
      "infirmier-dashboard.html",
      "patients.html",
      "patient-detail.html",
      "hospitalisation.html",
      "suivi-hospitalisation.html",
      "sortie-patient.html",
      "profil.html"
    ];

  }


  return [];

}


/* =========================================================
   APPLIQUER LES PERMISSIONS
========================================================= */

export function appliquerPermissions() {

  const utilisateur =
    getUtilisateurConnecte();


  /* =====================================================
     AUCUN UTILISATEUR CONNECTE
  ===================================================== */

  if (!utilisateur) {

    window.location.replace("/");

    return;

  }


  const role =
    getRole();


  if (!role) {

    window.location.replace("/");

    return;

  }


  const pagesAutorisees =
    getPagesAutorisees(role);


  /* =====================================================
     MASQUER LES MENUS INTERDITS
  ===================================================== */

  const liensMenu =
    document.querySelectorAll(
      ".sidebar a"
    );


  liensMenu.forEach((lien) => {

    const href =
      lien.getAttribute("href");


    if (!href) {
      return;
    }


    const nomPage =
      href
        .split("/")
        .pop();


    if (
      nomPage &&
      !pagesAutorisees.includes(
        nomPage
      )
    ) {

      lien.style.display =
        "none";

    }

  });



  /* =====================================================
     BLOQUER UNE PAGE NON AUTORISEE
  ===================================================== */

  const pageActuelle =
    window.location.pathname
      .split("/")
      .pop();


  if (
    pageActuelle &&
    pageActuelle !== "" &&
    !pagesAutorisees.includes(
      pageActuelle
    )
  ) {

    const dashboard =
      getDashboardParRole(role);


    window.location.replace(
      dashboard
    );

    return;

  }

}


/* =========================================================
   BOUTON DECONNEXION
========================================================= */

export function activerDeconnexion() {

  const bouton =
    document.getElementById(
      "logoutBtn"
    );


  if (!bouton) {
    return;
  }


  bouton.addEventListener(
    "click",
    () => {

      deconnexion();

    }
  );

}