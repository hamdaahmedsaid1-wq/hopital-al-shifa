/* ==========================================================
   HÔPITAL AL-SHIFA
   LAYOUT GLOBAL
   MENU DYNAMIQUE SELON LE ROLE
========================================================== */

import {
  appliquerPermissions
} from "./permissions.js";


import {
  deconnexion,
  getUtilisateurConnecte
} from "./secure-api.js";



/* ==========================================================
   1. ICONES SVG
========================================================== */

function iconMenu(type) {

  const icons = {

    home: `
      <svg viewBox="0 0 24 24">
        <path d="M3 11.5L12 4l9 7.5"/>
        <path d="M5 10.5V20h14v-9.5"/>
        <path d="M9 20v-6h6v6"/>
      </svg>
    `,

    patient: `
      <svg viewBox="0 0 24 24">
        <circle cx="12" cy="7.5" r="3.5"/>
        <path d="M5 20c0-4 3-6.5 7-6.5s7 2.5 7 6.5"/>
      </svg>
    `,

    calendar: `
      <svg viewBox="0 0 24 24">
        <rect x="3" y="5" width="18" height="16" rx="2"/>
        <path d="M8 3v4M16 3v4M3 10h18"/>
        <path d="M7 14h2M11 14h2M15 14h2M7 18h2M11 18h2"/>
      </svg>
    `,

    stethoscope: `
      <svg viewBox="0 0 24 24">
        <path d="M6 3v6a5 5 0 0 0 10 0V3"/>
        <path d="M4 3h4M14 3h4"/>
        <path d="M11 14v2a5 5 0 0 0 10 0v-2"/>
        <circle cx="19" cy="12" r="2"/>
      </svg>
    `,

    bed: `
      <svg viewBox="0 0 24 24">
        <path d="M3 5v15M21 12v8"/>
        <path d="M3 15h18"/>
        <path d="M6 8h5a3 3 0 0 1 3 3v4H6z"/>
        <path d="M3 20v-3M21 20v-3"/>
      </svg>
    `,

    medical: `
      <svg viewBox="0 0 24 24">
        <path d="M12 3v18"/>
        <path d="M7 8h10"/>
        <path d="M7 16h10"/>
      </svg>
    `,

    exit: `
      <svg viewBox="0 0 24 24">
        <path d="M10 4H5v16h5"/>
        <path d="M14 8l4 4-4 4"/>
        <path d="M18 12H9"/>
      </svg>
    `,

    clipboard: `
      <svg viewBox="0 0 24 24">
        <rect x="5" y="4" width="14" height="17" rx="2"/>
        <path d="M9 4V2h6v2"/>
        <path d="M9 9h6M9 13h6M9 17h4"/>
      </svg>
    `,

    card: `
      <svg viewBox="0 0 24 24">
        <rect x="3" y="5" width="18" height="14" rx="2"/>
        <path d="M3 10h18"/>
        <path d="M7 15h4"/>
      </svg>
    `,

    money: `
      <svg viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="8"/>
        <path d="M12 7v10"/>
        <path d="M15 9.5c-.7-1-1.7-1.5-3-1.5-1.7 0-3 1-3 2.3 0 1.7 1.4 2 3 2.4 1.7.3 3 .7 3 2.3 0 1.4-1.3 2.5-3 2.5-1.5 0-2.7-.6-3.4-1.7"/>
      </svg>
    `,

    users: `
      <svg viewBox="0 0 24 24">
        <circle cx="8" cy="8" r="3"/>
        <circle cx="17" cy="9" r="2.5"/>
        <path d="M2 20c0-3.5 2.7-6 6-6s6 2.5 6 6"/>
        <path d="M14 15c3.5-.5 7 1.7 7 5"/>
      </svg>
    `,

    profile: `
      <svg viewBox="0 0 24 24">
        <circle cx="12" cy="8" r="4"/>
        <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>
      </svg>
    `,

    chart: `
      <svg viewBox="0 0 24 24">
        <path d="M4 20V11h4v9"/>
        <path d="M10 20V4h4v16"/>
        <path d="M16 20v-7h4v7"/>
      </svg>
    `,

    plus: `
      <svg viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9"/>
        <path d="M12 8v8M8 12h8"/>
      </svg>
    `

  };


  return `
    <span class="nav-icon">
      ${icons[type] || icons.home}
    </span>
  `;

}



/* ==========================================================
   2. CREER UN LIEN
========================================================== */

function menuLink(
  href,
  icon,
  label
) {

  return `
    <a href="${href}">

      ${iconMenu(icon)}

      <span class="nav-label">
        ${label}
      </span>

    </a>
  `;

}



/* ==========================================================
   3. CREER LE MENU SELON LE ROLE
========================================================== */

function creerMenuSelonRole(role) {

  role = String(role || "")
    .toLowerCase()
    .trim();



  /* ========================================================
     ADMINISTRATEUR
  ======================================================== */

  if (
    role.includes("administrateur") ||
    role.includes("admin")
  ) {

    return `

      ${menuLink(
        "dashboard.html",
        "home",
        "Accueil"
      )}

      ${menuLink(
        "patients.html",
        "patient",
        "Patients"
      )}

      ${menuLink(
        "rendez-vous.html",
        "calendar",
        "Rendez-vous"
      )}

      ${menuLink(
        "consultation.html",
        "stethoscope",
        "Consultations"
      )}

      ${menuLink(
        "hospitalisation.html",
        "bed",
        "Hospitalisations"
      )}

      ${menuLink(
        "suivi-hospitalisation.html",
        "medical",
        "Suivi hospitalisation"
      )}

      ${menuLink(
        "sortie-patient.html",
        "exit",
        "Sortie patient"
      )}

      ${menuLink(
        "ordonnance.html",
        "clipboard",
        "Ordonnances"
      )}

      ${menuLink(
        "facture.html",
        "card",
        "Facturation"
      )}

      ${menuLink(
        "paiement.html",
        "money",
        "Paiements"
      )}


      <div class="sidebar-separator"></div>


      ${menuLink(
        "utilisateurs.html",
        "users",
        "Utilisateurs"
      )}

      ${menuLink(
        "profil.html",
        "profile",
        "Profil"
      )}

      ${menuLink(
        "rapports.html",
        "chart",
        "Rapports"
      )}

    `;

  }



  /* ========================================================
     MEDECIN
  ======================================================== */

  if (
    role.includes("médecin") ||
    role.includes("medecin")
  ) {

    return `

      ${menuLink(
        "medecin-dashboard.html",
        "home",
        "Accueil"
      )}

      ${menuLink(
        "patients.html",
        "patient",
        "Mes patients"
      )}

      ${menuLink(
        "rendez-vous.html",
        "calendar",
        "Mes rendez-vous"
      )}

      ${menuLink(
        "consultation.html",
        "stethoscope",
        "Consultations"
      )}

      ${menuLink(
        "ordonnance.html",
        "clipboard",
        "Ordonnances"
      )}


      <div class="sidebar-separator"></div>


      ${menuLink(
        "profil.html",
        "profile",
        "Mon profil"
      )}

    `;

  }



  /* ========================================================
     RECEPTION
  ======================================================== */

  if (
    role.includes("réception") ||
    role.includes("reception")
  ) {

    return `

      ${menuLink(
        "reception-dashboard.html",
        "home",
        "Accueil"
      )}

      ${menuLink(
        "patients.html",
        "patient",
        "Patients"
      )}

      ${menuLink(
        "rendez-vous.html",
        "calendar",
        "Rendez-vous"
      )}

      ${menuLink(
        "planifier-rendez-vous.html",
        "plus",
        "Nouveau rendez-vous"
      )}


      <div class="sidebar-separator"></div>


      ${menuLink(
        "profil.html",
        "profile",
        "Mon profil"
      )}

    `;

  }



  /* ========================================================
     INFIRMIER
  ======================================================== */

  if (
    role.includes("infirmier")
  ) {

    return `

      ${menuLink(
        "infirmier-dashboard.html",
        "home",
        "Accueil"
      )}

      ${menuLink(
        "patients.html",
        "patient",
        "Patients"
      )}

      ${menuLink(
        "hospitalisation.html",
        "bed",
        "Hospitalisations"
      )}

      ${menuLink(
        "suivi-hospitalisation.html",
        "medical",
        "Suivi hospitalisation"
      )}

      ${menuLink(
        "sortie-patient.html",
        "exit",
        "Sortie patient"
      )}


      <div class="sidebar-separator"></div>


      ${menuLink(
        "profil.html",
        "profile",
        "Mon profil"
      )}

    `;

  }



  /* ========================================================
     CAISSIER
  ======================================================== */

  if (
    role.includes("caissier")
  ) {

    return `

      ${menuLink(
        "caissier-dashboard.html",
        "home",
        "Accueil"
      )}

      ${menuLink(
        "facture.html",
        "card",
        "Facturation"
      )}

      ${menuLink(
        "paiement.html",
        "money",
        "Paiements"
      )}


      <div class="sidebar-separator"></div>


      ${menuLink(
        "profil.html",
        "profile",
        "Mon profil"
      )}

    `;

  }


  return "";

}



/* ==========================================================
   4. AFFICHER LE LAYOUT
========================================================== */

export function afficherLayout(titre) {


  /* ========================================================
     UTILISATEUR CONNECTE
  ======================================================== */

  const utilisateur =
    getUtilisateurConnecte();


  if (!utilisateur) {

    window.location.replace("/");

    return;

  }


  const roleUtilisateur =
    utilisateur?.role ||
    "Utilisateur";


  const nomUtilisateur =
    roleUtilisateur
      .toLowerCase()
      .includes("admin")

      ? "Hamda Ahmed Said"

      : utilisateur?.nom_utilisateur ||
        "Utilisateur";


  const initialeUtilisateur =
    nomUtilisateur
      .charAt(0)
      .toUpperCase();



  /* ========================================================
     TITRES DES PAGES
  ======================================================== */

  const titresPages = {

    "dashboard.html":
      "Tableau de bord",

    "medecin-dashboard.html":
      "Espace médecin",

    "reception-dashboard.html":
      "Espace réception",

    "infirmier-dashboard.html":
      "Espace infirmier",

    "caissier-dashboard.html":
      "Espace caissier",

    "patients.html":
      "Gestion des patients",

    "patient-detail.html":
      "Dossier patient",

    "rendez-vous.html":
      "Rendez-vous",

    "planifier-rendez-vous.html":
      "Planifier un rendez-vous",

    "consultation.html":
      "Consultations",

    "hospitalisation.html":
      "Hospitalisations",

    "suivi-hospitalisation.html":
      "Suivi des hospitalisations",

    "sortie-patient.html":
      "Sortie patient",

    "ordonnance.html":
      "Ordonnances",

    "facture.html":
      "Facturation",

    "paiement.html":
      "Paiements",

    "utilisateurs.html":
      "Gestion des utilisateurs",

    "profil.html":
      "Mon profil",

    "rapports.html":
      "Rapports et statistiques"

  };


  const page =
    window.location.pathname
      .split("/")
      .pop();


  const titrePage =
    typeof titre === "string" &&
    titre.trim()

      ? titre.trim()

      : titresPages[page] ||
        "Hôpital Al-Shifa";



  /* ========================================================
     SIDEBAR
  ======================================================== */

  const sidebar = `

    <style>

      /* =====================================================
         CONTENEUR
      ===================================================== */

      #sidebar {
        width: 236px;
        min-width: 236px;
      }



      /* =====================================================
         SIDEBAR
      ===================================================== */

      #sidebar .alshifa-sidebar {

        position: fixed;

        top: 0;
        left: 0;

        width: 236px;
        height: 100vh;

        box-sizing: border-box;

        padding:
          16px
          14px
          24px;

        color: white;

        background:
          linear-gradient(
            180deg,
            #df650b 0%,
            #c94a05 55%,
            #a93407 100%
          );

        overflow-y: auto;
        overflow-x: hidden;

        z-index: 1000;

        box-shadow:
          4px 0 20px
          rgba(0,0,0,0.10);

        isolation: isolate;

      }



      /* =====================================================
         VAGUES SVG DU BAS
      ===================================================== */

      #sidebar .sidebar-waves {

        position: absolute;

        left: 0;
        bottom: 0;

        width: 100%;
        height: 150px;

        z-index: 1;

        pointer-events: none;

      }



      /* =====================================================
         LOGO
      ===================================================== */

      #sidebar .alshifa-brand {

        position: relative;

        z-index: 5;

        display: flex;

        align-items: center;

        gap: 11px;

        padding:
          5px
          5px
          19px;

        margin-bottom:
          14px;

        border-bottom:
          1px solid
          rgba(255,255,255,0.24);

      }



      #sidebar .alshifa-brand-logo {

        width: 59px;
        height: 59px;

        min-width: 59px;

        display: flex;

        align-items: center;
        justify-content: center;

        background:
          transparent;

        border:
          none;

        box-shadow:
          none;

      }



      #sidebar .alshifa-logo-svg {

        width: 58px;
        height: 58px;

        display: block;

      }



      #sidebar .alshifa-brand-text h2 {

        margin: 0;

        color: white;

        font-size: 18px;

        font-weight: 900;

        line-height: 1.02;

      }



      #sidebar .alshifa-brand-text strong {

        display: block;

        margin-top: 5px;

        color:
          rgba(255,255,255,0.94);

        font-size: 8px;

        font-weight: 500;

      }



      #sidebar .alshifa-brand-text small {

        display: block;

        margin-top: 3px;

        color:
          rgba(255,255,255,0.88);

        font-size: 9px;

      }



      /* =====================================================
         MENU
      ===================================================== */

      #sidebar .alshifa-nav {

        position: relative;

        z-index: 5;

        display: flex;

        flex-direction: column;

        gap: 7px;

        padding-bottom:
          145px;

      }



      #sidebar .alshifa-nav a {

        width: 100%;

        min-height: 47px;

        box-sizing: border-box;

        display: flex;

        align-items: center;

        gap: 13px;

        padding:
          0
          14px;

        border-radius:
          10px;

        color:
          rgba(255,255,255,0.97);

        text-decoration:
          none;

        font-size:
          14px;

        font-weight:
          600;

        line-height:
          1.25;

        transition:
          background 0.2s ease,
          color 0.2s ease,
          transform 0.2s ease;

      }



      #sidebar .alshifa-nav a:hover {

        background:
          rgba(255,255,255,0.10);

        transform:
          translateX(2px);

      }



      /* =====================================================
         ICONES
      ===================================================== */

      #sidebar .nav-icon {

        width: 22px;
        height: 22px;

        min-width: 22px;

        display: flex;

        align-items: center;

        justify-content: center;

        color:
          currentColor;

      }



      #sidebar .nav-icon svg {

        width: 20px;
        height: 20px;

        fill: none;

        stroke:
          currentColor;

        stroke-width:
          1.9;

        stroke-linecap:
          round;

        stroke-linejoin:
          round;

      }



      #sidebar .nav-label {

        flex: 1;

        color:
          inherit;

      }



      /* =====================================================
         ACTIVE
      ===================================================== */

      #sidebar .alshifa-nav a.active {

        background:
          #fff1e8;

        color:
          #ad3907;

        font-weight:
          800;

        border-radius:
          10px;

        box-shadow:
          0 5px 14px
          rgba(85,28,0,0.15);

      }



      /* =====================================================
         SEPARATEUR
      ===================================================== */

      #sidebar .sidebar-separator {

        height: 1px;

        margin:
          18px
          7px
          17px;

        background:
          rgba(255,255,255,0.28);

      }


      #sidebar .sidebar-separator + a {

        margin-top:
          2px;

      }



      /* =====================================================
         SCROLLBAR
      ===================================================== */

      #sidebar
      .alshifa-sidebar::-webkit-scrollbar {

        width:
          4px;

      }


      #sidebar
      .alshifa-sidebar::-webkit-scrollbar-track {

        background:
          transparent;

      }


      #sidebar
      .alshifa-sidebar::-webkit-scrollbar-thumb {

        background:
          rgba(255,255,255,0.28);

        border-radius:
          20px;

      }



      /* =====================================================
         MAIN
      ===================================================== */

      .main {

        width:
          calc(100% - 236px);

        min-height:
          100vh;

        margin-left:
          236px;

      }


    </style>



    <aside class="sidebar alshifa-sidebar">


      <!-- =================================================
           LOGO
      ================================================== -->

      <div class="alshifa-brand">


        <div class="alshifa-brand-logo">


          <svg
            class="alshifa-logo-svg"
            viewBox="0 0 80 72"
            aria-hidden="true"
          >


            <path
              d="
                M40 63
                C35 58 10 43 10 24
                C10 13 18 7 27 7
                C34 7 38 11 40 15
                C42 11 47 7 54 7
                C63 7 71 13 71 24
                C71 43 46 58 40 63
                Z
              "
              fill="white"
            />


            <path
              d="
                M3 35
                H20
                L27 22
                L35 50
                L44 27
                L50 35
                H77
              "
              fill="none"
              stroke="#c64708"
              stroke-width="5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />


          </svg>


        </div>



        <div class="alshifa-brand-text">


          <h2>
            HÔPITAL
            <br>
            AL-SHIFA
          </h2>


          <strong>
            مستشفى الشفاء
          </strong>


          <small>
            Djibouti
          </small>


        </div>


      </div>



      <!-- =================================================
           NAVIGATION
      ================================================== -->

      <nav class="nav alshifa-nav">

        ${creerMenuSelonRole(
          roleUtilisateur
        )}

      </nav>



      <!-- =================================================
           VAGUES DECORATIVES DU BAS
      ================================================== -->

      <svg
        class="sidebar-waves"
        viewBox="0 0 236 150"
        preserveAspectRatio="none"
        aria-hidden="true"
      >

        <path
          d="
            M0 103
            C34 106 56 90 78 78
            C104 64 126 69 151 89
            C176 108 196 113 236 91
            L236 150
            L0 150
            Z
          "
          fill="#e56b12"
        />


        <path
          d="
            M0 129
            C33 127 55 113 79 102
            C108 89 129 92 153 109
            C177 127 199 130 236 105
            L236 150
            L0 150
            Z
          "
          fill="#ff9634"
        />

      </svg>


    </aside>

  `;



  /* ========================================================
     TOPBAR
  ======================================================== */

  const topbar = `

    <header
      class="
        topbar
        alshifa-topbar
        topbar-premium
      "
    >


      <div class="topbar-premium-left">


        <button

          type="button"

          class="topbar-menu-button"

          id="menuToggle"

          aria-label="
            Afficher ou masquer le menu
          "

        >

          ☰

        </button>



        <div class="topbar-page-info">


          <span
            class="topbar-page-label"
          >

            ESPACE DE GESTION

          </span>


          <h2
            id="topbarPageTitle"
          >
          </h2>


        </div>


      </div>



      <div class="topbar-premium-right">


        <div
          class="
            topbar-system-status
          "
        >


          <span
            class="status-dot"
          >
          </span>


          <span>
            Système opérationnel
          </span>


        </div>



        <button

          type="button"

          class="
            topbar-notification
          "

          id="notificationButton"

          title="Notifications"

          aria-label="Notifications"

        >

          🔔

        </button>



        <div class="topbar-user-wrapper">


          <a

            href="profil.html"

            class="topbar-user-button"

            style="
              text-decoration: none;
            "

          >


            <span
              class="topbar-user-avatar"
            >

              ${initialeUtilisateur}

            </span>



            <span
              class="topbar-user-details"
            >


              <strong>
                ${nomUtilisateur}
              </strong>


              <small>
                ${roleUtilisateur}
              </small>


            </span>


          </a>



          <button

            type="button"

            id="logoutButton"

            class="topbar-visible-logout"

          >

            ↪ Déconnexion

          </button>


        </div>


      </div>


    </header>

  `;



  /* ========================================================
     INSERTION
  ======================================================== */

  const sidebarContainer =
    document.getElementById(
      "sidebar"
    );


  const topbarContainer =
    document.getElementById(
      "topbar"
    );



  if (sidebarContainer) {

    sidebarContainer.innerHTML =
      sidebar;

  }



  if (topbarContainer) {

    topbarContainer.innerHTML =
      topbar;

  }



  /* ========================================================
     TITRE
  ======================================================== */

  const topbarPageTitle =
    document.getElementById(
      "topbarPageTitle"
    );


  if (topbarPageTitle) {

    topbarPageTitle.textContent =
      titrePage;

  }



  /* ========================================================
     PAGE ACTIVE
  ======================================================== */

  const pagesAssociees = {

    "patient-detail.html":
      "patients.html",

    "planifier-rendez-vous.html":
      "rendez-vous.html"

  };


  const pageNavigation =
    pagesAssociees[page] ||
    page;



  document
    .querySelectorAll(
      ".alshifa-nav a"
    )
    .forEach(

      function(link) {


        const href =
          link.getAttribute(
            "href"
          );


        if (
          href ===
          pageNavigation
        ) {


          link.classList.add(
            "active"
          );


          link.setAttribute(
            "aria-current",
            "page"
          );

        }

      }

    );



  /* ========================================================
     MENU MOBILE
  ======================================================== */

  const menuToggle =
    document.getElementById(
      "menuToggle"
    );


  if (
    menuToggle &&
    sidebarContainer
  ) {


    menuToggle
      .addEventListener(

        "click",

        function() {


          sidebarContainer
            .classList
            .toggle(
              "sidebar-mobile-open"
            );

        }

      );

  }



  /* ========================================================
     NOTIFICATIONS
  ======================================================== */

  const notificationButton =
    document.getElementById(
      "notificationButton"
    );


  if (
    notificationButton
  ) {


    notificationButton
      .addEventListener(

        "click",

        function() {


          alert(
            "Aucune nouvelle notification pour le moment."
          );

        }

      );

  }



  /* ========================================================
     DECONNEXION
  ======================================================== */

  const logoutButton =
    document.getElementById(
      "logoutButton"
    );


  if (
    logoutButton
  ) {


    logoutButton
      .addEventListener(

        "click",

        function() {

          deconnexion();

        }

      );

  }



  /* ========================================================
     PERMISSIONS
  ======================================================== */

  appliquerPermissions();

}