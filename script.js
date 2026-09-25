"use strict";

/*
========================================================
 MAH3D SUPABASE ADMIN
 Auth + Projects + Upload + Delete + RLS
========================================================

IMPORTANT:
Use ONLY your Supabase PUBLISHABLE key here.

DO NOT put sb_secret_... in this file.
========================================================
*/


// ======================================================
// SUPABASE CONFIG
// ======================================================

const SUPABASE_URL =
  "https://drfxgjvvldccxbccgiud.supabase.co";

/*
Paste the CURRENT Publishable key from:

Supabase Dashboard
→ Project Settings
→ API
→ Publishable key

Do NOT paste sb_secret_...
*/

const SUPABASE_KEY =
  "sb_publishable_iaxxz6gFjhMdR5tTZGZMOg_CiSibohE";


if (!window.supabase) {

  console.error(
    "Supabase JS library was not loaded."
  );

  alert(
    "Supabase library not loaded. Check index.html."
  );

  throw new Error(
    "Supabase JS library missing."
  );
}


if (
  !SUPABASE_KEY ||
  SUPABASE_KEY ===
    "sb_secret_zpZpYBLTpU9GeppyUrUWLw_UfVCvBZu"
) {

  console.error(
    "Supabase Publishable key is missing."
  );

  alert(
    "Supabase Publishable key is missing in script.js"
  );

  throw new Error(
    "Missing Supabase Publishable key."
  );
}


// Create Supabase client

const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );


// ======================================================
// GLOBAL STATE
// ======================================================

let currentUser = null;
let allProjects = [];


// ======================================================
// HELPERS
// ======================================================

const $ = (id) =>
  document.getElementById(id);


function escapeHTML(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


function escapeAttribute(value) {

  return escapeHTML(value);
}


function showMessage(
  element,
  message,
  type = "success"
) {

  if (!element) return;

  element.textContent = message;

  element.className =
    "message show " + type;
}


function clearMessage(element) {

  if (!element) return;

  element.textContent = "";

  element.className =
    "message";
}


// ======================================================
// CONNECTION STATUS
// ======================================================

function setConnectionStatus(
  online,
  text
) {

  const dot =
    $("statusDot");

  const status =
    $("connectionStatus");

  if (dot) {

    dot.classList.toggle(
      "online",
      online
    );
  }

  if (status) {

    status.textContent =
      text;
  }
}


// ======================================================
// INITIALIZATION
// ======================================================

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    console.log(
      "================================"
    );

    console.log(
      "MAH3D SUPABASE ADMIN STARTING"
    );

    console.log(
      "================================"
    );

    setupLogin();

    setupLogout();

    setupUpload();

    setupSearch();

    setupModal();

    await checkSession();

    await loadProjects();

  }
);


// ======================================================
// AUTH SESSION
// ======================================================

async function checkSession() {

  try {

    setConnectionStatus(
      true,
      "Connecting..."
    );

    const {
      data,
      error
    } =
      await supabaseClient.auth.getSession();


    if (error) {

      console.error(
        "SESSION ERROR:",
        error
      );

      setConnectionStatus(
        false,
        "Auth error"
      );

      return;
    }


    currentUser =
      data?.session?.user || null;


    console.log(
      "Current user:",
      currentUser
    );


    updateAuthUI();


    if (currentUser) {

      setConnectionStatus(
        true,
        "Online"
      );

    } else {

      setConnectionStatus(
        true,
        "Ready"
      );
    }


  } catch (error) {

    console.error(
      "SESSION EXCEPTION:",
      error
    );

    setConnectionStatus(
      false,
      "Connection error"
    );

  }
}


// ======================================================
// AUTH STATE CHANGE
// ======================================================

supabaseClient.auth.onAuthStateChange(
  (event, session) => {

    console.log(
      "AUTH EVENT:",
      event
    );


    currentUser =
      session?.user || null;


    updateAuthUI();


    if (currentUser) {

      setConnectionStatus(
        true,
        "Online"
      );

    } else {

      setConnectionStatus(
        true,
        "Ready"
      );
    }

  }
);


// ======================================================
// UPDATE AUTH UI
// ======================================================

function updateAuthUI() {

  const loginPanel =
    $("loginPanel");

  const dashboard =
    $("dashboard");


  if (currentUser) {

    if (loginPanel) {

      loginPanel.style.display =
        "none";
    }


    if (dashboard) {

      dashboard.style.display =
        "block";
    }


    if ($("adminEmail")) {

      $("adminEmail").textContent =
        currentUser.email || "";
    }


    renderAdminProjects();


  } else {

    if (loginPanel) {

      loginPanel.style.display =
        "block";
    }


    if (dashboard) {

      dashboard.style.display =
        "none";
    }

  }
}


// ======================================================
// LOGIN
// ======================================================

function setupLogin() {

  const form =
    $("loginForm");

  if (!form) {

    console.error(
      "loginForm not found."
    );

    return;
  }


  form.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();


      const email =
        $("email")?.value
          .trim();

      const password =
        $("password")?.value || "";


      const message =
        $("loginMessage");

      const button =
        $("loginBtn");


      if (!email || !password) {

        showMessage(
          message,
          "❌ Ampidiro email sy password.",
          "error"
        );

        return;
      }


      button.disabled =
        true;

      button.textContent =
        "Logging in...";


      showMessage(
        message,
        "⏳ Connecting to Supabase...",
        "success"
      );


      try {

        console.log(
          "LOGIN START:",
          email
        );


        const {
          data,
          error
        } =
          await supabaseClient.auth
            .signInWithPassword({
              email,
              password
            });


        if (error) {

          console.error(
            "LOGIN ERROR:",
            error
          );


          showMessage(
            message,
            "❌ Login failed: " +
              error.message,
            "error"
          );


          return;
        }


        currentUser =
          data.user;


        console.log(
          "LOGIN SUCCESS:",
          currentUser
        );


        showMessage(
          message,
          "✅ TAFAIDITRA: " +
            (currentUser.email || ""),
          "success"
        );


        updateAuthUI();

        await loadProjects();


      } catch (error) {

        console.error(
          "LOGIN EXCEPTION:",
          error
        );


        showMessage(
          message,
          "❌ " +
            (error.message ||
              "Unknown login error"),
          "error"
        );

      } finally {

        button.disabled =
          false;

        button.textContent =
          "Login";

      }

    }
  );
}


// ======================================================
// LOGOUT
// ======================================================

function setupLogout() {

  const button =
    $("logoutBtn");

  if (!button) return;


  button.addEventListener(
    "click",
    async () => {

      button.disabled =
        true;

      button.textContent =
        "Logging out...";


      try {

        const {
          error
        } =
          await supabaseClient.auth
            .signOut();


        if (error) {

          throw error;
        }


        currentUser =
          null;


        updateAuthUI();


        console.log(
          "LOGGED OUT"
        );


      } catch (error) {

        console.error(
          "LOGOUT ERROR:",
          error
        );


        alert(
          "Logout failed: " +
            error.message
        );


      } finally {

        button.disabled =
          false;

        button.textContent =
          "Logout";

      }

    }
  );
}


// ======================================================
// LOAD PROJECTS
// ======================================================

async function loadProjects() {

  console.log(
    "Loading projects..."
  );


  try {

    const {
      data,
      error
    } =
      await supabaseClient
        .from("projects")
        .select("*")
        .order(
          "created_at",
          {
            ascending: false
          }
        );


    if (error) {

      throw error;
    }


    allProjects =
      data || [];


    console.log(
      "Projects loaded:",
      allProjects
    );


    if ($("databaseStatus")) {

      $("databaseStatus").textContent =
        "OK";
    }


    renderProjects(
      allProjects
    );

    renderDownloads();

    renderAdminProjects();


  } catch (error) {

    console.error(
      "PROJECT LOAD ERROR:",
      error
    );


    if ($("databaseStatus")) {

      $("databaseStatus").textContent =
        "ERROR";
    }


    const grid =
      $("projectsGrid");


    if (grid) {

      grid.innerHTML = `
        <div class="empty">
          ❌ Database error:
          ${escapeHTML(error.message)}
        </div>
      `;
    }

  }
}


// ======================================================
// RENDER PUBLIC PROJECTS
// ======================================================

function renderProjects(
  projects
) {

  const grid =
    $("projectsGrid");

  if (!grid) return;


  if (!projects.length) {

    grid.innerHTML = `
      <div class="empty">
        No projects published yet.
      </div>
    `;

    return;
  }


  grid.innerHTML =
    projects.map(
      (project) => {

        const id =
          escapeAttribute(
            project.id
          );


        return `
          <article class="project-card">

            <span class="category">
              ${escapeHTML(
                project.category ||
                "Other"
              )}
            </span>

            <h3>
              ${escapeHTML(
                project.title
              )}
            </h3>

            <p>
              ${escapeHTML(
                project.description ||
                "No description."
              )}
            </p>

            <button
              class="btn primary"
              onclick="openProject('${id}')"
            >
              View Project
            </button>

          </article>
        `;
      }
    )
    .join("");
}


// ======================================================
// DOWNLOADS
// ======================================================

function renderDownloads() {

  const list =
    $("downloadsList");

  if (!list) return;


  if (!allProjects.length) {

    list.innerHTML = `
      <div class="empty">
        No downloads available.
      </div>
    `;

    return;
  }


  list.innerHTML =
    allProjects.map(
      (project) => {

        return `
          <div class="download-item">

            <div>

              <strong>
                ${escapeHTML(
                  project.title
                )}
              </strong>

              <small>
                ${escapeHTML(
                  project.file_name ||
                  "Project file"
                )}
              </small>

            </div>

            <a
              class="btn primary"
              href="${escapeAttribute(
                project.file_url
              )}"
              target="_blank"
              rel="noopener"
            >
              Download
            </a>

          </div>
        `;

      }
    )
    .join("");
}


// ======================================================
// ADMIN PROJECT LIST
// ======================================================

function renderAdminProjects() {

  const box =
    $("adminProjects");

  if (!box) return;


  if ($("projectCount")) {

    $("projectCount").textContent =
      allProjects.length;
  }


  if (!currentUser) {

    box.innerHTML = "";

    return;
  }


  if (!allProjects.length) {

    box.innerHTML = `
      <div class="empty">
        Nothing to manage.
      </div>
    `;

    return;
  }


  box.innerHTML =
    allProjects.map(
      (project) => {

        return `
          <div class="admin-project">

            <div>

              <strong>
                ${escapeHTML(
                  project.title
                )}
              </strong>

              <small>
                ${escapeHTML(
                  project.category ||
                  "Other"
                )}
              </small>

            </div>

            <button
              class="btn danger"
              onclick="deleteProject('${escapeAttribute(
                project.id
              )}')"
            >
              Delete
            </button>

          </div>
        `;

      }
    )
    .join("");
}


// ======================================================
// UPLOAD
// ======================================================

function setupUpload() {

  const form =
    $("uploadForm");

  if (!form) return;


  form.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();


      const progress =
        $("uploadProgress");

      const button =
        $("uploadBtn");


      if (!currentUser) {

        showMessage(
          progress,
          "❌ Login required.",
          "error"
        );

        return;
      }


      const title =
        $("projectTitle")
          ?.value
          .trim();


      const description =
        $("projectDescription")
          ?.value
          .trim() || "";


      const category =
        $("projectCategory")
          ?.value ||
        "Other";


      const file =
        $("projectFile")
          ?.files?.[0];


      if (!title) {

        showMessage(
          progress,
          "❌ Ampidiro ny titre.",
          "error"
        );

        return;
      }


      if (!file) {

        showMessage(
          progress,
          "❌ Misafidiana fichier.",
          "error"
        );

        return;
      }


      button.disabled =
        true;

      button.textContent =
        "Uploading...";


      let storagePath =
        null;


      try {

        // ==========================================
        // STEP 1: STORAGE PATH
        // ==========================================

        showMessage(
          progress,
          "📤 Uploading file...",
          "success"
        );


        const safeName =
          file.name
            .replace(
              /[^a-zA-Z0-9._-]/g,
              "_"
            );


        storagePath =
          currentUser.id +
          "/" +
          Date.now() +
          "_" +
          safeName;


        console.log(
          "Storage path:",
          storagePath
        );


        // ==========================================
        // STEP 2: UPLOAD STORAGE
        // ==========================================

        const {
          error:
            uploadError
        } =
          await supabaseClient
            .storage
            .from("projects")
            .upload(
              storagePath,
              file,
              {
                cacheControl:
                  "31536000",

                upsert:
                  false,

                contentType:
                  file.type ||
                  "application/octet-stream"
              }
            );


        if (uploadError) {

          throw new Error(
            "Storage upload failed: " +
            uploadError.message
          );
        }


        // ==========================================
        // STEP 3: PUBLIC URL
        // ==========================================

        showMessage(
          progress,
          "🔗 Creating download URL...",
          "success"
        );


        const {
          data:
            urlData
        } =
          supabaseClient
            .storage
            .from("projects")
            .getPublicUrl(
              storagePath
            );


        const fileUrl =
          urlData?.publicUrl;


        if (!fileUrl) {

          throw new Error(
            "Could not create public URL."
          );
        }


        // ==========================================
        // STEP 4: DATABASE
        // ==========================================

        showMessage(
          progress,
          "💾 Saving project...",
          "success"
        );


        const {
          data:
            inserted,
          error:
            dbError
        } =
          await supabaseClient
            .from("projects")
            .insert({

              title:
                title,

              description:
                description,

              category:
                category,

              file_url:
                fileUrl,

              file_name:
                file.name,

              owner_id:
                currentUser.id

            })
            .select()
            .single();


        if (dbError) {

          // Remove uploaded file
          // if DB insert failed.

          await supabaseClient
            .storage
            .from("projects")
            .remove([
              storagePath
            ]);


          throw new Error(
            "Database insert failed: " +
            dbError.message
          );
        }


        // ==========================================
        // STEP 5: UPDATE UI
        // ==========================================

        allProjects.unshift(
          inserted
        );


        renderProjects(
          allProjects
        );

        renderDownloads();

        renderAdminProjects();


        form.reset();


        showMessage(
          progress,
          "✅ Published successfully!",
          "success"
        );


        console.log(
          "PROJECT CREATED:",
          inserted
        );


      } catch (error) {

        console.error(
          "PUBLISH ERROR:",
          error
        );


        showMessage(
          progress,
          "❌ " +
            error.message,
          "error"
        );


      } finally {

        button.disabled =
          false;

        button.textContent =
          "Publish Project";

      }

    }
  );
}


// ======================================================
// DELETE PROJECT
// ======================================================

window.deleteProject =
  async function(id) {

    if (!currentUser) {

      alert(
        "Login required."
      );

      return;
    }


    const project =
      allProjects.find(
        (item) =>
          item.id === id
      );


    if (!project) {

      alert(
        "Project not found."
      );

      return;
    }


    const confirmed =
      confirm(
        'Delete "' +
        project.title +
        '"?'
      );


    if (!confirmed) return;


    try {

      console.log(
        "Deleting project:",
        project
      );


      // ==========================================
      // DATABASE DELETE
      // ==========================================

      const {
        error
      } =
        await supabaseClient
          .from("projects")
          .delete()
          .eq(
            "id",
            id
          )
          .eq(
            "owner_id",
            currentUser.id
          );


      if (error) {

        throw error;
      }


      // ==========================================
      // REMOVE STORAGE FILE
      // ==========================================

      /*
       * Because old records may not contain
       * storage_path, we reconstruct it only when
       * the file URL belongs to our bucket.
       */

      if (
        project.file_url &&
        project.file_name
      ) {

        const url =
          project.file_url;


        const marker =
          "/storage/v1/object/public/projects/";


        const index =
          url.indexOf(marker);


        if (index !== -1) {

          const path =
            decodeURIComponent(
              url.substring(
                index +
                marker.length
              )
            );


          if (path) {

            const {
              error:
                storageError
            } =
              await supabaseClient
                .storage
                .from("projects")
                .remove([
                  path
                ]);


            if (storageError) {

              console.warn(
                "Storage delete warning:",
                storageError
              );

            }

          }

        }

      }


      // ==========================================
      // UPDATE UI
      // ==========================================

      allProjects =
        allProjects.filter(
          (item) =>
            item.id !== id
        );


      renderProjects(
        allProjects
      );

      renderDownloads();

      renderAdminProjects();


      console.log(
        "PROJECT DELETED"
      );


    } catch (error) {

      console.error(
        "DELETE ERROR:",
        error
      );


      alert(
        "❌ Delete failed:\n" +
        error.message
      );

    }

  };


// ======================================================
// SEARCH
// ======================================================

function setupSearch() {

  $("searchInput")
    ?.addEventListener(
      "input",
      applyFilters
    );


  $("categoryFilter")
    ?.addEventListener(
      "change",
      applyFilters
    );
}


function applyFilters() {

  const query =
    (
      $("searchInput")
        ?.value ||
      ""
    )
      .toLowerCase()
      .trim();


  const category =
    $("categoryFilter")
      ?.value ||
    "";


  const filtered =
    allProjects.filter(
      (project) => {

        const text =
          (
            project.title ||
            ""
          ) +
          " " +
          (
            project.description ||
            ""
          ) +
          " " +
          (
            project.category ||
            ""
          );


        return (

          (!query ||
            text
              .toLowerCase()
              .includes(query))

          &&

          (!category ||
            project.category ===
            category)

        );

      }
    );


  renderProjects(
    filtered
  );
}


// ======================================================
// MODAL
// ======================================================

function setupModal() {

  $("closeModal")
    ?.addEventListener(
      "click",
      closeModal
    );


  $("modal")
    ?.addEventListener(
      "click",
      (event) => {

        if (
          event.target ===
          $("modal")
        ) {

          closeModal();
        }

      }
    );


  document.addEventListener(
    "keydown",
    (event) => {

      if (
        event.key ===
        "Escape"
      ) {

        closeModal();
      }

    }
  );
}


function closeModal() {

  const modal =
    $("modal");

  if (modal) {

    modal.style.display =
      "none";
  }
}


window.openProject =
  function(id) {

    const project =
      allProjects.find(
        (item) =>
          item.id === id
      );


    if (!project) return;


    $("modalCategory")
      .textContent =
      project.category ||
      "Other";


    $("modalTitle")
      .textContent =
      project.title ||
      "";


    $("modalDescription")
      .textContent =
      project.description ||
      "No description.";


    $("modalDownload")
      .href =
      project.file_url ||
      "#";


    $("modal")
      .style.display =
      "flex";

  };


// ======================================================
// DEBUG
// ======================================================

console.log(
  "================================"
);

console.log(
  "MAH3D script loaded"
);

console.log(
  "Supabase URL:",
  SUPABASE_URL
);

console.log(
  "Supabase client:",
  supabaseClient
);

console.log(
  "================================"
);
