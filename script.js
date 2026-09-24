const SUPABASE_URL =
  "https://drfxgjvvldccxbccgiud.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_iaxxz6gFjhMdR5tTZGZMOg_CiSibohE";

const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );


// ================================
// MENU
// ================================

const menuBtn = document.getElementById("menuBtn");
const nav = document.getElementById("nav");

menuBtn.addEventListener("click", () => {
  nav.classList.toggle("open");
});


// ================================
// DOM
// ================================

const projectsGrid =
  document.getElementById("projectsGrid");

const downloadsList =
  document.getElementById("downloadsList");

const searchInput =
  document.getElementById("searchInput");

const categoryFilter =
  document.getElementById("categoryFilter");

const loginBox =
  document.getElementById("loginBox");

const dashboard =
  document.getElementById("dashboard");

const loginForm =
  document.getElementById("loginForm");

const loginMessage =
  document.getElementById("loginMessage");

const logoutBtn =
  document.getElementById("logoutBtn");

const uploadForm =
  document.getElementById("uploadForm");

const uploadProgress =
  document.getElementById("uploadProgress");

const adminProjects =
  document.getElementById("adminProjects");

const projectCount =
  document.getElementById("projectCount");

const modal =
  document.getElementById("modal");

const closeModal =
  document.getElementById("closeModal");

let allProjects = [];


// ================================
// LOAD PROJECTS
// ================================

async function loadProjects() {

  projectsGrid.innerHTML =
    `<div class="loading">Loading projects...</div>`;

  const { data, error } =
    await supabaseClient
      .from("projects")
      .select("*")
      .order("created_at", {
        ascending: false
      });

  if (error) {

    projectsGrid.innerHTML =
      `<div class="loading">
        Error loading projects: ${escapeHtml(error.message)}
      </div>`;

    return;
  }

  allProjects = data || [];

  renderProjects(allProjects);
  renderDownloads(allProjects);
  renderAdminProjects(allProjects);
}


// ================================
// RENDER PUBLIC PROJECTS
// ================================

function renderProjects(projects) {

  if (!projects.length) {

    projectsGrid.innerHTML =
      `<div class="loading">
        No projects published yet.
      </div>`;

    return;
  }

  projectsGrid.innerHTML =
    projects.map(project => {

      return `
        <article class="project-card">

          <span class="category">
            ${escapeHtml(project.category)}
          </span>

          <h3>
            ${escapeHtml(project.title)}
          </h3>

          <p>
            ${escapeHtml(project.description || "No description.")}
          </p>

          <div class="card-buttons">

            <button
              class="btn primary"
              onclick="openProject('${project.id}')"
            >
              View
            </button>

            <a
              class="btn secondary"
              href="${escapeAttribute(project.file_url)}"
              target="_blank"
              rel="noopener"
            >
              Download
            </a>

          </div>

        </article>
      `;

    }).join("");
}


// ================================
// DOWNLOADS
// ================================

function renderDownloads(projects) {

  if (!projects.length) {

    downloadsList.innerHTML =
      `<div class="loading">
        No downloads available.
      </div>`;

    return;
  }

  downloadsList.innerHTML =
    projects.map(project => {

      return `
        <div class="download-item">

          <div>
            <strong>
              ${escapeHtml(project.title)}
            </strong>

            <div class="category">
              ${escapeHtml(project.category)}
            </div>
          </div>

          <a
            class="btn primary"
            href="${escapeAttribute(project.file_url)}"
            target="_blank"
            rel="noopener"
          >
            Download
          </a>

        </div>
      `;

    }).join("");
}


// ================================
// SEARCH
// ================================

function filterProjects() {

  const search =
    searchInput.value
      .trim()
      .toLowerCase();

  const category =
    categoryFilter.value;

  const filtered =
    allProjects.filter(project => {

      const text =
        `${project.title} ${project.description} ${project.category}`
          .toLowerCase();

      const matchesSearch =
        text.includes(search);

      const matchesCategory =
        category === "all" ||
        project.category === category;

      return matchesSearch && matchesCategory;

    });

  renderProjects(filtered);
}

searchInput.addEventListener(
  "input",
  filterProjects
);

categoryFilter.addEventListener(
  "change",
  filterProjects
);


// ================================
// PROJECT MODAL
// ================================

window.openProject = function(id) {

  const project =
    allProjects.find(p => p.id === id);

  if (!project) return;

  document.getElementById("modalTitle")
    .textContent = project.title;

  document.getElementById("modalCategory")
    .textContent = project.category;

  document.getElementById("modalDescription")
    .textContent =
      project.description || "No description.";

  document.getElementById("modalDownload")
    .href = project.file_url;

  modal.classList.remove("hidden");
};

closeModal.addEventListener(
  "click",
  () => modal.classList.add("hidden")
);

modal.addEventListener("click", event => {

  if (event.target === modal) {
    modal.classList.add("hidden");
  }

});


// ================================
// LOGIN
// ================================

loginForm.addEventListener(
  "submit",
  async event => {

    event.preventDefault();

    loginMessage.textContent =
      "Logging in...";

    const email =
      document.getElementById("email").value.trim();

    const password =
      document.getElementById("password").value;

    const { error } =
      await supabaseClient.auth.signInWithPassword({
        email,
        password
      });

    if (error) {

      loginMessage.textContent =
        "Login failed: " + error.message;

      return;
    }

    loginMessage.textContent =
      "Login successful.";

    await updateAdminUI();

  }
);


// ================================
// LOGOUT
// ================================

logoutBtn.addEventListener(
  "click",
  async () => {

    await supabaseClient.auth.signOut();

    updateAdminUI();

  }
);


// ================================
// ADMIN UI
// ================================

async function updateAdminUI() {

  const {
    data: {
      session
    }
  } =
    await supabaseClient.auth.getSession();

  if (session) {

    loginBox.classList.add("hidden");

    dashboard.classList.remove("hidden");

    loginMessage.textContent = "";

  } else {

    loginBox.classList.remove("hidden");

    dashboard.classList.add("hidden");

  }

  renderAdminProjects(allProjects);

}


// ================================
// UPLOAD
// ================================

uploadForm.addEventListener(
  "submit",
  async event => {

    event.preventDefault();

    uploadProgress.textContent =
      "Uploading...";

    const {
      data: {
        session
      }
    } =
      await supabaseClient.auth.getSession();

    if (!session) {

      uploadProgress.textContent =
        "Please login first.";

      return;
    }

    const title =
      document.getElementById("projectTitle")
        .value.trim();

    const description =
      document.getElementById("projectDescription")
        .value.trim();

    const category =
      document.getElementById("projectCategory")
        .value;

    const fileInput =
      document.getElementById("projectFile");

    const file =
      fileInput.files[0];

    if (!file) {

      uploadProgress.textContent =
        "Select a file.";

      return;
    }

    try {

      const safeName =
        file.name
          .replace(/[^a-zA-Z0-9._-]/g, "_");

      const filePath =
        `${Date.now()}_${safeName}`;

      // Upload file
      const {
        error: uploadError
      } =
        await supabaseClient
          .storage
          .from("projects")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false
          });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const {
        data: publicData
      } =
        supabaseClient
          .storage
          .from("projects")
          .getPublicUrl(filePath);

      const publicUrl =
        publicData.publicUrl;

      // Insert project
      const {
        error: databaseError
      } =
        await supabaseClient
          .from("projects")
          .insert({
            title,
            description,
            category,
            file_url: publicUrl,
            file_name: file.name
          });

      if (databaseError) {
        throw databaseError;
      }

      uploadProgress.textContent =
        "✅ Project published successfully!";

      uploadForm.reset();

      await loadProjects();

      setTimeout(() => {
        uploadProgress.textContent = "";
      }, 4000);

    } catch (error) {

      uploadProgress.textContent =
        "❌ Upload error: " +
        error.message;

    }

  }
);


// ================================
// ADMIN PROJECT LIST
// ================================

function renderAdminProjects(projects) {

  if (!adminProjects) return;

  projectCount.textContent =
    projects.length;

  if (!projects.length) {

    adminProjects.innerHTML =
      `<p class="loading">No projects.</p>`;

    return;
  }

  adminProjects.innerHTML =
    projects.map(project => {

      return `
        <div class="admin-row">

          <div>
            <strong>
              ${escapeHtml(project.title)}
            </strong>

            <div class="category">
              ${escapeHtml(project.category)}
            </div>
          </div>

          <button
            class="btn danger"
            onclick="deleteProject('${project.id}')"
          >
            Delete
          </button>

        </div>
      `;

    }).join("");
}


// ================================
// DELETE
// ================================

window.deleteProject = async function(id) {

  const project =
    allProjects.find(p => p.id === id);

  if (!project) return;

  const confirmed =
    confirm(
      `Delete "${project.title}"?`
    );

  if (!confirmed) return;

  try {

    // Delete database record
    const {
      error
    } =
      await supabaseClient
        .from("projects")
        .delete()
        .eq("id", id);

    if (error) {
      throw error;
    }

    await loadProjects();

  } catch (error) {

    alert(
      "Delete error: " +
      error.message
    );

  }
};


// ================================
// SECURITY HELPERS
// ================================

function escapeHtml(value) {

  if (value === null || value === undefined) {
    return "";
  }

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function escapeAttribute(value) {

  return escapeHtml(value);

}


// ================================
// AUTH STATE
// ================================

supabaseClient.auth.onAuthStateChange(
  async () => {
    await updateAdminUI();
  }
);


// ================================
// START
// ================================

(async function init() {

  await loadProjects();

  await updateAdminUI();

})();
