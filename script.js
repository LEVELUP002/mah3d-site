```javascript
"use strict";

/* =========================================================
   MAH3D SITE
   Supabase Admin / Projects
   ========================================================= */

/*
  IMPORTANT:
  Apetraho ao amin'ny index.html:
  
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <script src="./script.js"></script>

  Supabase URL:
  https://drfxgjvvldccxbccgiud.supabase.co

  IMPORTANT:
  Apetraho eto ilay Publishable Key VAOVAO nadika mivantana
  avy amin'ny Supabase Dashboard > Settings > API Keys.
*/

const SUPABASE_URL =
  "https://drfxgjvvldccxbccgiud.supabase.co";

const SUPABASE_KEY =
  "PASTE_YOUR_SUPABASE_PUBLISHABLE_KEY_HERE";


/* =========================================================
   SUPABASE INITIALIZATION
   ========================================================= */

if (!window.supabase) {
  console.error("❌ Supabase JS tsy vo-load.");

  document.addEventListener("DOMContentLoaded", () => {
    const msg = document.getElementById("loginMessage");

    if (msg) {
      msg.textContent =
        "❌ Supabase JS tsy vo-load. Jereo ny index.html.";
    }
  });

  throw new Error(
    "Supabase JS missing. Load @supabase/supabase-js before script.js"
  );
}

if (
  !SUPABASE_KEY ||
  SUPABASE_KEY === "PASTE_YOUR_SUPABASE_PUBLISHABLE_KEY_HERE"
) {
  console.error("❌ Supabase Publishable Key mbola tsy napetraka.");

  document.addEventListener("DOMContentLoaded", () => {
    const msg = document.getElementById("loginMessage");

    if (msg) {
      msg.textContent =
        "❌ Ampidiro aloha ny Supabase Publishable Key.";
    }
  });

  throw new Error("Supabase Publishable Key missing");
}

const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );

console.log("✅ MAH3D Supabase client initialized");


/* =========================================================
   GLOBAL STATE
   ========================================================= */

let allProjects = [];
let currentUser = null;


/* =========================================================
   SHORTCUT
   ========================================================= */

const $ = (id) => document.getElementById(id);


/* =========================================================
   DOM READY
   ========================================================= */

document.addEventListener("DOMContentLoaded", async () => {

  console.log("🚀 MAH3D site starting...");

  setupLogin();
  setupUpload();
  setupLogout();
  setupSearch();
  setupModal();

  await checkSession();
  await loadProjects();

});


/* =========================================================
   CHECK SESSION
   ========================================================= */

async function checkSession() {

  console.log("🔐 Checking Supabase session...");

  try {

    const {
      data,
      error
    } = await supabaseClient.auth.getSession();

    if (error) {

      console.error(
        "SESSION ERROR:",
        error
      );

      showLoginMessage(
        "❌ Session error: " +
        error.message
      );

      currentUser = null;

      updateAuthUI();

      return;
    }

    currentUser =
      data?.session?.user || null;

    console.log(
      currentUser
        ? "✅ Session active: " + currentUser.email
        : "ℹ️ No active session"
    );

    updateAuthUI();

  } catch (error) {

    console.error(
      "SESSION EXCEPTION:",
      error
    );

    showLoginMessage(
      "❌ " + error.message
    );
  }
}


/* =========================================================
   AUTH STATE
   ========================================================= */

supabaseClient.auth.onAuthStateChange(
  (event, session) => {

    console.log(
      "AUTH EVENT:",
      event
    );

    currentUser =
      session?.user || null;

    updateAuthUI();

  }
);


/* =========================================================
   AUTH UI
   ========================================================= */

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


/* =========================================================
   LOGIN
   ========================================================= */

function setupLogin() {

  const form =
    $("loginForm");

  if (!form) {

    console.warn(
      "⚠️ loginForm not found"
    );

    return;
  }

  form.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();

      const email =
        $("email")?.value
          ?.trim();

      const password =
        $("password")?.value || "";

      const msg =
        $("loginMessage");

      if (!email) {

        showLoginMessage(
          "❌ Ampidiro ny email."
        );

        return;
      }

      if (!password) {

        showLoginMessage(
          "❌ Ampidiro ny password."
        );

        return;
      }

      if (msg) {
        msg.textContent =
          "⏳ Logging in...";
      }

      console.log(
        "🔐 Login attempt:",
        email
      );

      try {

        const {
          data,
          error
        } =
          await supabaseClient.auth.signInWithPassword(
            {
              email: email,
              password: password
            }
          );

        if (error) {

          console.error(
            "LOGIN ERROR:",
            error
          );

          showLoginMessage(
            "❌ " +
            getFriendlyAuthError(
              error
            )
          );

          return;
        }

        if (!data?.user) {

          showLoginMessage(
            "❌ Login failed: user not returned."
          );

          return;
        }

        currentUser =
          data.user;

        console.log(
          "✅ LOGIN SUCCESS:",
          currentUser.email
        );

        showLoginMessage(
          "✅ Login successful!"
        );

        updateAuthUI();

        await loadProjects();

      } catch (error) {

        console.error(
          "LOGIN EXCEPTION:",
          error
        );

        showLoginMessage(
          "❌ " +
          (error.message ||
            "Login failed")
        );
      }

    }
  );
}


/* =========================================================
   FRIENDLY AUTH ERRORS
   ========================================================= */

function getFriendlyAuthError(error) {

  const message =
    String(
      error?.message || ""
    );

  const lower =
    message.toLowerCase();

  if (
    lower.includes(
      "invalid api key"
    )
  ) {

    return (
      "Invalid API key. " +
      "Hamarino ny Supabase Publishable Key " +
      "ao amin'ny script.js."
    );
  }

  if (
    lower.includes(
      "invalid login credentials"
    )
  ) {

    return (
      "Email na password diso."
    );
  }

  if (
    lower.includes(
      "email not confirmed"
    )
  ) {

    return (
      "Tsy mbola voamarina ilay email."
    );
  }

  if (
    lower.includes(
      "too many requests"
    )
  ) {

    return (
      "Be loatra ny login attempts. " +
      "Andraso kely dia avereno."
    );
  }

  return message ||
    "Login failed.";
}


/* =========================================================
   LOGIN MESSAGE
   ========================================================= */

function showLoginMessage(message) {

  const msg =
    $("loginMessage");

  if (msg) {
    msg.textContent =
      message;
  }

  console.log(
    "LOGIN MESSAGE:",
    message
  );
}


/* =========================================================
   LOGOUT
   ========================================================= */

function setupLogout() {

  const button =
    $("logoutBtn");

  if (!button) return;

  button.addEventListener(
    "click",
    async () => {

      try {

        const {
          error
        } =
          await supabaseClient.auth.signOut();

        if (error) {
          throw error;
        }

        currentUser =
          null;

        updateAuthUI();

        showLoginMessage(
          "✅ Logged out."
        );

      } catch (error) {

        console.error(
          "LOGOUT ERROR:",
          error
        );

        alert(
          "❌ Logout failed: " +
          error.message
        );
      }

    }
  );
}


/* =========================================================
   LOAD PROJECTS
   ========================================================= */

async function loadProjects() {

  const grid =
    $("projectsGrid");

  try {

    console.log(
      "📚 Loading projects..."
    );

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
      "✅ Projects:",
      allProjects.length
    );

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

    if (grid) {

      grid.innerHTML =
        `<div class="project-error">
          ❌ ${escapeHTML(
            error.message
          )}
        </div>`;

    }
  }
}


/* =========================================================
   RENDER PUBLIC PROJECTS
   ========================================================= */

function renderProjects(
  projects
) {

  const grid =
    $("projectsGrid");

  if (!grid) return;

  if (!projects.length) {

    grid.innerHTML =
      `<div class="empty-projects">
        No projects published yet.
      </div>`;

    return;
  }

  grid.innerHTML =
    projects.map(
      (p) => {

        return `
          <article class="project-card">

            <span class="project-category">
              ${escapeHTML(
                p.category ||
                "Other"
              )}
            </span>

            <h3>
              ${escapeHTML(
                p.title ||
                "Untitled"
              )}
            </h3>

            <p>
              ${escapeHTML(
                p.description ||
                "No description."
              )}
            </p>

            <button
              class="btn primary project-button"
              onclick="openProject('${escapeAttribute(
                p.id
              )}')"
            >
              View Project
            </button>

          </article>
        `;
      }
    ).join("");
}


/* =========================================================
   DOWNLOADS
   ========================================================= */

function renderDownloads() {

  const list =
    $("downloadsList");

  if (!list) return;

  if (!allProjects.length) {

    list.innerHTML =
      `<div class="empty-projects">
        No downloads available.
      </div>`;

    return;
  }

  list.innerHTML =
    allProjects.map(
      (p) => {

        return `
          <div class="download-item">

            <div>

              <strong>
                ${escapeHTML(
                  p.title
                )}
              </strong>

              <small>
                ${escapeHTML(
                  p.file_name ||
                  "Project file"
                )}
              </small>

            </div>

            <a
              class="btn primary"
              href="${escapeAttribute(
                p.file_url ||
                "#"
              )}"
              target="_blank"
              rel="noopener"
            >
              Download
            </a>

          </div>
        `;
      }
    ).join("");
}


/* =========================================================
   ADMIN PROJECTS
   ========================================================= */

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

    box.innerHTML =
      `<div class="empty-projects">
        Nothing to manage.
      </div>`;

    return;
  }

  box.innerHTML =
    allProjects.map(
      (p) => {

        return `
          <div class="admin-project">

            <div>

              <strong>
                ${escapeHTML(
                  p.title
                )}
              </strong>

              <small>
                ${escapeHTML(
                  p.category ||
                  "Other"
                )}
              </small>

            </div>

            <button
              class="btn danger"
              onclick="deleteProject('${escapeAttribute(
                p.id
              )}')"
            >
              Delete
            </button>

          </div>
        `;
      }
    ).join("");
}


/* =========================================================
   UPLOAD
   ========================================================= */

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

      if (!currentUser) {

        setProgress(
          progress,
          "❌ Login required."
        );

        return;
      }

      const title =
        $("projectTitle")
          ?.value
          ?.trim();

      const description =
        $("projectDescription")
          ?.value
          ?.trim() || "";

      const category =
        $("projectCategory")
          ?.value || "Other";

      const file =
        $("projectFile")
          ?.files?.[0];

      if (!title) {

        setProgress(
          progress,
          "❌ Ampidiro ny titre."
        );

        return;
      }

      if (!file) {

        setProgress(
          progress,
          "❌ Misafidiana fichier."
        );

        return;
      }

      let storagePath =
        null;

      try {

        setProgress(
          progress,
          "📤 Uploading file..."
        );

        const safeName =
          file.name.replace(
            /[^a-zA-Z0-9._-]/g,
            "_"
          );

        storagePath =
          `${currentUser.id}/${Date.now()}_${safeName}`;

        const {
          error: uploadError
        } =
          await supabaseClient.storage
            .from("projects")
            .upload(
              storagePath,
              file,
              {
                cacheControl:
                  "31536000",
                upsert: false
              }
            );

        if (uploadError) {

          throw new Error(
            "Storage: " +
            uploadError.message
          );
        }

        setProgress(
          progress,
          "💾 Saving project..."
        );

        const {
          data: urlData
        } =
          supabaseClient.storage
            .from("projects")
            .getPublicUrl(
              storagePath
            );

        const {
          data: inserted,
          error: dbError
        } =
          await supabaseClient
            .from("projects")
            .insert(
              {
                title,
                description,
                category,
                file_url:
                  urlData.publicUrl,
                file_name:
                  file.name
              }
            )
            .select()
            .single();

        if (dbError) {

          await supabaseClient
            .storage
            .from("projects")
            .remove(
              [storagePath]
            );

          throw new Error(
            "Database: " +
            dbError.message
          );
        }

        allProjects.unshift(
          inserted
        );

        renderProjects(
          allProjects
        );

        renderDownloads();

        renderAdminProjects();

        form.reset();

        setProgress(
          progress,
          "✅ Published successfully!"
        );

      } catch (error) {

        console.error(
          "PUBLISH ERROR:",
          error
        );

        setProgress(
          progress,
          "❌ " +
          error.message
        );
      }

    }
  );
}


/* =========================================================
   DELETE PROJECT
   ========================================================= */

window.deleteProject =
  async function (id) {

    if (!currentUser) {

      alert(
        "❌ Login required."
      );

      return;
    }

    const project =
      allProjects.find(
        (p) => p.id === id
      );

    if (!project) return;

    if (
      !confirm(
        `Delete "${project.title}"?`
      )
    ) {
      return;
    }

    try {

      const {
        error
      } =
        await supabaseClient
          .from("projects")
          .delete()
          .eq(
            "id",
            id
          );

      if (error) {
        throw error;
      }

      allProjects =
        allProjects.filter(
          (p) => p.id !== id
        );

      renderProjects(
        allProjects
      );

      renderDownloads();

      renderAdminProjects();

    } catch (error) {

      console.error(
        "DELETE ERROR:",
        error
      );

      alert(
        "❌ Delete failed: " +
        error.message
      );
    }
  };


/* =========================================================
   SEARCH
   ========================================================= */

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

  const q =
    (
      $("searchInput")
        ?.value || ""
    )
      .toLowerCase()
      .trim();

  const category =
    $("categoryFilter")
      ?.value || "";

  const filtered =
    allProjects.filter(
      (p) => {

        const text =
          `${p.title || ""} ${
            p.description || ""
          }`
            .toLowerCase();

        return (
          (!q ||
            text.includes(q)) &&
          (!category ||
            p.category === category)
        );
      }
    );

  renderProjects(
    filtered
  );
}


/* =========================================================
   MODAL
   ========================================================= */

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
}


function closeModal() {

  const modal =
    $("modal");

  if (modal) {

    modal.style.display =
      "none";

  }
}


/* =========================================================
   OPEN PROJECT
   ========================================================= */

window.openProject =
  function (id) {

    const project =
      allProjects.find(
        (p) => p.id === id
      );

    if (!project) return;

    if ($("modalCategory")) {

      $("modalCategory")
        .textContent =
        project.category ||
        "Other";

    }

    if ($("modalTitle")) {

      $("modalTitle")
        .textContent =
        project.title || "";

    }

    if ($("modalDescription")) {

      $("modalDescription")
        .textContent =
        project.description || "";

    }

    if ($("modalDownload")) {

      $("modalDownload")
        .href =
        project.file_url ||
        "#";

    }

    if ($("modal")) {

      $("modal").style.display =
        "flex";

    }
  };


/* =========================================================
   HELPERS
   ========================================================= */

function setProgress(
  element,
  message
) {

  if (element) {

    element.textContent =
      message;

  }

  console.log(
    message
  );
}


function escapeHTML(value) {

  return String(
    value ?? ""
  )
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );
}


function escapeAttribute(value) {

  return escapeHTML(
    value
  );
}


/* =========================================================
   FINAL
   ========================================================= */

console.log(
  "✅ MAH3D Admin script loaded"
);
```
