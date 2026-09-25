const SUPABASE_URL = "https://drfxgjvvldccxbccgiud.supabase.co";
const SUPABASE_KEY = "sb_publishable_iaxxz6gFJhMdR5tTZGZMOg_CiSibohE";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
let allProjects = [];
let currentUser = null;

const $ = id => document.getElementById(id);

document.addEventListener("DOMContentLoaded", async () => {
  setupLogin();
  setupUpload();
  setupLogout();
  setupSearch();
  setupModal();

  const { data, error } = await supabaseClient.auth.getSession();
  if (error) console.error("SESSION ERROR:", error);

  currentUser = data?.session?.user || null;
  updateAuthUI();
  await loadProjects();
});

supabaseClient.auth.onAuthStateChange((_event, session) => {
  currentUser = session?.user || null;
  updateAuthUI();
});

function updateAuthUI() {
  const loginPanel = $("loginPanel");
  const dashboard = $("dashboard");
  if (currentUser) {
    if (loginPanel) loginPanel.style.display = "none";
    if (dashboard) dashboard.style.display = "block";
    if ($("adminEmail")) $("adminEmail").textContent = currentUser.email || "";
    renderAdminProjects();
  } else {
    if (loginPanel) loginPanel.style.display = "block";
    if (dashboard) dashboard.style.display = "none";
  }
}

function setupLogin() {
  const form = $("loginForm");
  if (!form) return;
  form.addEventListener("submit", async e => {
    e.preventDefault();
    const msg = $("loginMessage");
    msg.textContent = "⏳ Logging in...";
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: $("email").value.trim(),
      password: $("password").value
    });
    if (error) {
      console.error(error);
      msg.textContent = "❌ " + error.message;
      return;
    }
    currentUser = data.user;
    msg.textContent = "✅ Login successful.";
    updateAuthUI();
  });
}

function setupLogout() {
  $("logoutBtn")?.addEventListener("click", async () => {
    await supabaseClient.auth.signOut();
    currentUser = null;
    updateAuthUI();
  });
}

async function loadProjects() {
  const grid = $("projectsGrid");
  try {
    const { data, error } = await supabaseClient
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    allProjects = data || [];
    renderProjects(allProjects);
    renderDownloads();
    renderAdminProjects();
  } catch (error) {
    console.error("PROJECT LOAD ERROR:", error);
    if (grid) grid.innerHTML = `<div class="project-error">❌ ${escapeHTML(error.message)}</div>`;
  }
}

function renderProjects(projects) {
  const grid = $("projectsGrid");
  if (!grid) return;

  if (!projects.length) {
    grid.innerHTML = `<div class="empty-projects">No projects published yet.</div>`;
    return;
  }

  grid.innerHTML = projects.map(p => `
    <article class="project-card">
      <span class="project-category">${escapeHTML(p.category || "Other")}</span>
      <h3>${escapeHTML(p.title)}</h3>
      <p>${escapeHTML(p.description || "No description.")}</p>
      <button class="btn primary project-button" onclick="openProject('${p.id}')">View Project</button>
    </article>
  `).join("");
}

function renderDownloads() {
  const list = $("downloadsList");
  if (!list) return;

  if (!allProjects.length) {
    list.innerHTML = `<div class="empty-projects">No downloads available.</div>`;
    return;
  }

  list.innerHTML = allProjects.map(p => `
    <div class="download-item">
      <div>
        <strong>${escapeHTML(p.title)}</strong>
        <small>${escapeHTML(p.file_name || "Project file")}</small>
      </div>
      <a class="btn primary" href="${escapeAttribute(p.file_url)}" target="_blank" rel="noopener">Download</a>
    </div>
  `).join("");
}

function renderAdminProjects() {
  const box = $("adminProjects");
  if (!box) return;
  if ($("projectCount")) $("projectCount").textContent = allProjects.length;

  if (!currentUser) {
    box.innerHTML = "";
    return;
  }

  if (!allProjects.length) {
    box.innerHTML = `<div class="empty-projects">Nothing to manage.</div>`;
    return;
  }

  box.innerHTML = allProjects.map(p => `
    <div class="admin-project">
      <div>
        <strong>${escapeHTML(p.title)}</strong>
        <small>${escapeHTML(p.category || "Other")}</small>
      </div>
      <button class="btn danger" onclick="deleteProject('${p.id}')">Delete</button>
    </div>
  `).join("");
}

function setupUpload() {
  const form = $("uploadForm");
  if (!form) return;

  form.addEventListener("submit", async e => {
    e.preventDefault();

    const progress = $("uploadProgress");
    if (!currentUser) {
      progress.textContent = "❌ Login required.";
      return;
    }

    const title = $("projectTitle").value.trim();
    const description = $("projectDescription").value.trim();
    const category = $("projectCategory").value;
    const file = $("projectFile").files[0];

    if (!title) {
      progress.textContent = "❌ Ampidiro ny titre.";
      return;
    }
    if (!file) {
      progress.textContent = "❌ Misafidiana fichier.";
      return;
    }

    let storagePath = null;

    try {
      progress.textContent = "📤 Uploading file...";

      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      storagePath = `${currentUser.id}/${Date.now()}_${safeName}`;

      const { error: uploadError } = await supabaseClient.storage
        .from("projects")
        .upload(storagePath, file, {
          cacheControl: "31536000",
          upsert: false
        });

      if (uploadError) throw new Error("Storage: " + uploadError.message);

      progress.textContent = "💾 Saving project...";

      const { data: urlData } = supabaseClient.storage
        .from("projects")
        .getPublicUrl(storagePath);

      const { data: inserted, error: dbError } = await supabaseClient
        .from("projects")
        .insert({
          title,
          description,
          category,
          file_url: urlData.publicUrl,
          file_name: file.name
        })
        .select()
        .single();

      if (dbError) {
        await supabaseClient.storage.from("projects").remove([storagePath]);
        throw new Error("Database: " + dbError.message);
      }

      allProjects.unshift(inserted);
      renderProjects(allProjects);
      renderDownloads();
      renderAdminProjects();

      form.reset();
      progress.textContent = "✅ Published successfully!";
    } catch (error) {
      console.error("PUBLISH ERROR:", error);
      progress.textContent = "❌ " + error.message;
    }
  });
}

window.deleteProject = async function(id) {
  if (!currentUser) return;

  const project = allProjects.find(p => p.id === id);
  if (!project) return;
  if (!confirm(`Delete "${project.title}"?`)) return;

  try {
    const { error } = await supabaseClient.from("projects").delete().eq("id", id);
    if (error) throw error;

    allProjects = allProjects.filter(p => p.id !== id);
    renderProjects(allProjects);
    renderDownloads();
    renderAdminProjects();
  } catch (error) {
    alert("❌ Delete failed: " + error.message);
  }
};

function setupSearch() {
  $("searchInput")?.addEventListener("input", applyFilters);
  $("categoryFilter")?.addEventListener("change", applyFilters);
}

function applyFilters() {
  const q = ($("searchInput")?.value || "").toLowerCase().trim();
  const category = $("categoryFilter")?.value || "";

  const filtered = allProjects.filter(p => {
    const text = `${p.title || ""} ${p.description || ""}`.toLowerCase();
    return (!q || text.includes(q)) && (!category || p.category === category);
  });

  renderProjects(filtered);
}

function setupModal() {
  $("closeModal")?.addEventListener("click", closeModal);
  $("modal")?.addEventListener("click", e => {
    if (e.target === $("modal")) closeModal();
  });
}

function closeModal() {
  if ($("modal")) $("modal").style.display = "none";
}

window.openProject = function(id) {
  const p = allProjects.find(x => x.id === id);
  if (!p) return;

  $("modalCategory").textContent = p.category || "Other";
  $("modalTitle").textContent = p.title || "";
  $("modalDescription").textContent = p.description || "";
  $("modalDownload").href = p.file_url || "#";
  $("modal").style.display = "flex";
};

function escapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
function escapeAttribute(value) {
  return escapeHTML(value);
}

console.log("✅ MAH3D site loaded");
