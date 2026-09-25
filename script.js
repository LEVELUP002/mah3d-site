"use strict";

/*
=========================================================
 MAH3D SUPABASE WEBSITE
 FREE / PAID PROJECT SYSTEM
 + MVOLA PAYMENT HOOK
=========================================================
*/

console.log("======================================");
console.log("MAH3D SUPABASE ADMIN STARTING");
console.log("======================================");


/* =======================================================
   SUPABASE CONFIG
======================================================= */

const SUPABASE_URL =
    "https://drfxgjvvldccxbccgiud.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_iaxxz6gFJhMdR5tTZGZMOg_CiSibohE";


if (
    !window.supabase ||
    typeof window.supabase.createClient !== "function"
) {
    console.error("Supabase library not loaded.");

    alert(
        "Supabase library tsy tafiditra. Jereo ny CDN ao amin'ny index.html."
    );

    throw new Error("Supabase library missing");
}


const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY,
        {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true
            }
        }
    );


/* =======================================================
   CONFIG
======================================================= */

const STORAGE_BUCKET = "projects";

const CURRENCY = "USD";

/*
 IMPORTANT:
 MVOLA endpoint public URL only.
 NO SECRET HERE.
*/

const MVOLA_FUNCTION_URL =
    "https://drfxgjvvldccxbccgiud.supabase.co/functions/v1/mvola-pay";


/* =======================================================
   SHORTCUT
======================================================= */

function $(id) {
    return document.getElementById(id);
}


/* =======================================================
   GLOBAL STATE
======================================================= */

let currentUser = null;

let allProjects = [];

let currentModalProject = null;


/* =======================================================
   DOM
======================================================= */

const loginPanel = $("loginPanel");
const loginForm = $("loginForm");
const emailInput = $("email");
const passwordInput = $("password");
const loginBtn = $("loginBtn");
const loginMessage = $("loginMessage");

const dashboard = $("dashboard");
const adminEmail = $("adminEmail");
const logoutBtn = $("logoutBtn");

const statusDot = $("statusDot");
const connectionStatus = $("connectionStatus");

const projectCount = $("projectCount");
const paidCount = $("paidCount");
const databaseStatus = $("databaseStatus");

const uploadForm = $("uploadForm");
const projectTitle = $("projectTitle");
const projectDescription = $("projectDescription");
const projectCategory = $("projectCategory");
const projectAccess = $("projectAccess");
const projectPrice = $("projectPrice");
const priceGroup = $("priceGroup");
const projectFile = $("projectFile");

const uploadBtn = $("uploadBtn");
const uploadProgress = $("uploadProgress");
const uploadStatus = $("uploadStatus");

const adminProjects = $("adminProjects");

const searchInput = $("searchInput");
const categoryFilter = $("categoryFilter");
const accessFilter = $("accessFilter");

const projectsGrid = $("projectsGrid");

const modal = $("modal");
const closeModal = $("closeModal");

const modalCategory = $("modalCategory");
const modalTitle = $("modalTitle");
const modalDescription = $("modalDescription");
const modalPrice = $("modalPrice");
const modalDownload = $("modalDownload");

const year = $("year");


/* =======================================================
   YEAR
======================================================= */

if (year) {
    year.textContent = new Date().getFullYear();
}


/* =======================================================
   HELPERS
======================================================= */

function escapeHTML(value) {

    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function normalizeAccess(project) {

    return project &&
        project.access_type === "paid"
        ? "paid"
        : "free";
}


function getPrice(project) {

    const value = Number(project?.price);

    return Number.isFinite(value)
        ? value
        : 0;
}


function formatPrice(price) {

    const value = Number(price);

    if (!Number.isFinite(value)) {
        return "0.00";
    }

    return value.toFixed(2);
}


function formatMoney(price) {

    return (
        formatPrice(price)
        + " "
        + CURRENCY
    );
}


function setStatus(
    element,
    message,
    type = ""
) {

    if (!element) {
        return;
    }

    element.textContent = message || "";

    element.className = "status";

    if (type) {
        element.classList.add(type);
    }
}


/* =======================================================
   PRICE UI
======================================================= */

function updatePriceVisibility() {

    if (
        !projectAccess ||
        !priceGroup ||
        !projectPrice
    ) {
        return;
    }

    const paid =
        projectAccess.value === "paid";

    if (paid) {

        priceGroup.classList.remove("hidden");

        projectPrice.disabled = false;
        projectPrice.required = true;

        if (
            !projectPrice.value ||
            Number(projectPrice.value) <= 0
        ) {
            projectPrice.value = "5";
        }

    } else {

        priceGroup.classList.add("hidden");

        projectPrice.disabled = true;
        projectPrice.required = false;

        projectPrice.value = "0";
    }
}


if (projectAccess) {

    projectAccess.addEventListener(
        "change",
        updatePriceVisibility
    );

    updatePriceVisibility();
}


/* =======================================================
   AUTH
======================================================= */

async function getCurrentUser() {

    try {

        const {
            data,
            error
        } =
            await supabaseClient.auth.getUser();

        if (error) {

            console.warn(
                "getUser:",
                error.message
            );

            return null;
        }

        return data?.user || null;

    } catch (error) {

        console.error(
            "getCurrentUser:",
            error
        );

        return null;
    }
}


/* =======================================================
   LOGIN / DASHBOARD
======================================================= */

function showLogin() {

    if (loginPanel) {
        loginPanel.classList.remove("hidden");
    }

    if (dashboard) {
        dashboard.classList.add("hidden");
    }

    if (adminEmail) {
        adminEmail.textContent = "-";
    }
}


function showDashboard(user) {

    if (loginPanel) {
        loginPanel.classList.add("hidden");
    }

    if (dashboard) {
        dashboard.classList.remove("hidden");

        /*
        Force visible in case another CSS rule
        accidentally hides dashboard.
        */
        dashboard.style.display = "";
    }

    if (adminEmail) {
        adminEmail.textContent =
            user?.email || "";
    }
}


/* =======================================================
   LOGIN
======================================================= */

if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();

            setStatus(
                loginMessage,
                "Signing in..."
            );

            if (loginBtn) {

                loginBtn.disabled = true;
                loginBtn.textContent = "LOGIN...";
            }

            const email =
                emailInput?.value.trim() || "";

            const password =
                passwordInput?.value || "";

            if (!email || !password) {

                setStatus(
                    loginMessage,
                    "Email and password are required.",
                    "error"
                );

                if (loginBtn) {

                    loginBtn.disabled = false;
                    loginBtn.textContent = "LOGIN";
                }

                return;
            }


            try {

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

                    setStatus(
                        loginMessage,
                        error.message,
                        "error"
                    );

                    return;
                }


                currentUser =
                    data?.user || null;


                showDashboard(
                    currentUser
                );


                setStatus(
                    loginMessage,
                    "Login successful.",
                    "success"
                );


                await loadProjects();
                await loadAdminProjects();


            } catch (error) {

                console.error(
                    "LOGIN EXCEPTION:",
                    error
                );

                setStatus(
                    loginMessage,
                    error.message ||
                    "Login failed.",
                    "error"
                );

            } finally {

                if (loginBtn) {

                    loginBtn.disabled = false;
                    loginBtn.textContent = "LOGIN";
                }
            }
        }
    );
}


/* =======================================================
   LOGOUT
======================================================= */

if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        async function() {

            try {

                await supabaseClient.auth.signOut();

                currentUser = null;

                showLogin();

                setStatus(
                    loginMessage,
                    "Logged out.",
                    "success"
                );

            } catch (error) {

                console.error(
                    "LOGOUT:",
                    error
                );
            }
        }
    );
}


/* =======================================================
   AUTH STATE
======================================================= */

supabaseClient.auth.onAuthStateChange(
    async function(event, session) {

        console.log(
            "AUTH EVENT:",
            event
        );

        currentUser =
            session?.user || null;

        if (currentUser) {

            showDashboard(
                currentUser
            );

            await loadAdminProjects();

        } else {

            showLogin();
        }
    }
);


/* =======================================================
   LOAD PROJECTS
======================================================= */

async function loadProjects() {

    console.log(
        "Loading projects..."
    );

    if (databaseStatus) {
        databaseStatus.textContent = "Loading...";
    }


    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .from("projects")
                .select(
                    "id,title,description,category,file_url,file_name,owner_id,created_at,access_type,price"
                )
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                );


        if (error) {

            console.error(
                "PROJECT LOAD ERROR:",
                error
            );

            allProjects = [];

            renderProjects();

            if (databaseStatus) {
                databaseStatus.textContent = "ERROR";
                databaseStatus.style.color =
                    "#ff7189";
            }

            return;
        }


        allProjects =
            Array.isArray(data)
                ? data
                : [];


        updateStats();

        renderProjects();


        if (databaseStatus) {

            databaseStatus.textContent = "OK";
            databaseStatus.style.color =
                "var(--green)";
        }


    } catch (error) {

        console.error(
            "LOAD PROJECTS:",
            error
        );

        allProjects = [];

        renderProjects();

        if (databaseStatus) {

            databaseStatus.textContent =
                "ERROR";

            databaseStatus.style.color =
                "#ff7189";
        }
    }
}


/* =======================================================
   STATS
======================================================= */

function updateStats() {

    const total =
        allProjects.length;

    const paid =
        allProjects.filter(
            p => normalizeAccess(p) === "paid"
        ).length;


    if (projectCount) {
        projectCount.textContent = total;
    }

    if (paidCount) {
        paidCount.textContent = paid;
    }

    if (connectionStatus) {
        connectionStatus.textContent = "Online";
    }

    if (statusDot) {
        statusDot.style.background =
            "var(--green)";
    }
}


/* =======================================================
   FILTER
======================================================= */

function getFilteredProjects() {

    const search =
        (
            searchInput?.value || ""
        )
        .trim()
        .toLowerCase();


    const category =
        categoryFilter?.value || "all";


    const access =
        accessFilter?.value || "all";


    return allProjects.filter(
        project => {

            const title =
                String(
                    project.title || ""
                ).toLowerCase();


            const description =
                String(
                    project.description || ""
                ).toLowerCase();


            const projectCategory =
                String(
                    project.category || "Other"
                );


            const projectAccess =
                normalizeAccess(project);


            const searchOK =
                !search ||
                title.includes(search) ||
                description.includes(search);


            const categoryOK =
                category === "all" ||
                projectCategory === category;


            const accessOK =
                access === "all" ||
                projectAccess === access;


            return (
                searchOK &&
                categoryOK &&
                accessOK
            );
        }
    );
}


/* =======================================================
   FILTER EVENTS
======================================================= */

if (searchInput) {
    searchInput.addEventListener(
        "input",
        renderProjects
    );
}

if (categoryFilter) {
    categoryFilter.addEventListener(
        "change",
        renderProjects
    );
}

if (accessFilter) {
    accessFilter.addEventListener(
        "change",
        renderProjects
    );
}


/* =======================================================
   PROJECT CARD
======================================================= */

function createProjectCard(
    project,
    isAdmin = false
) {

    const access =
        normalizeAccess(project);

    const price =
        getPrice(project);

    const category =
        escapeHTML(
            project.category || "Other"
        );

    const title =
        escapeHTML(
            project.title ||
            "Untitled Project"
        );

    const description =
        escapeHTML(
            project.description ||
            "No description."
        );

    const fileName =
        escapeHTML(
            project.file_name || ""
        );


    const badge =
        access === "paid"

            ? `
                <span class="badge badge-paid">
                    💎 PAID
                </span>
              `

            : `
                <span class="badge badge-free">
                    🟢 FREE
                </span>
              `;


    const priceHTML =
        access === "paid"

            ? `
                <div class="price paid">
                    ${escapeHTML(
                        formatMoney(price)
                    )}
                </div>
              `

            : `
                <div class="price free">
                    FREE
                </div>
              `;


    let footer;


    if (isAdmin) {

        footer = `
            <div class="card-footer">

                <button
                    class="btn btn-secondary"
                    type="button"
                    onclick="openProjectModal('${project.id}')"
                >
                    View
                </button>

                <button
                    class="btn btn-danger"
                    type="button"
                    onclick="deleteProject('${project.id}')"
                >
                    Delete
                </button>

            </div>
        `;

    } else {

        footer = `
            <div class="card-footer">

                <button
                    class="btn btn-primary"
                    type="button"
                    onclick="openProjectModal('${project.id}')"
                >
                    ${
                        access === "paid"
                            ? "💎 BUY NOW"
                            : "⬇ VIEW / DOWNLOAD"
                    }
                </button>

            </div>
        `;
    }


    return `
        <article class="project-card">

            <div class="card-top">

                <div class="badges">

                    <span class="badge badge-category">
                        ${category}
                    </span>

                    ${badge}

                </div>

                <h3>
                    ${title}
                </h3>

            </div>


            <div class="card-body">

                <p class="project-description">
                    ${description}
                </p>

                ${priceHTML}

                ${
                    fileName
                        ? `
                            <div
                                style="
                                    margin-top:10px;
                                    color:#637086;
                                    font-size:11px;
                                "
                            >
                                📁 ${fileName}
                            </div>
                          `
                        : ""
                }

            </div>

            ${footer}

        </article>
    `;
}


/* =======================================================
   RENDER PROJECTS
======================================================= */

function renderProjects() {

    if (!projectsGrid) {
        return;
    }


    const projects =
        getFilteredProjects();


    if (!projects.length) {

        projectsGrid.innerHTML = `
            <div class="empty">

                <div class="empty-icon">
                    📦
                </div>

                <div>
                    No projects found.
                </div>

            </div>
        `;

        return;
    }


    projectsGrid.innerHTML =
        projects
            .map(
                p =>
                    createProjectCard(
                        p,
                        false
                    )
            )
            .join("");
}


/* =======================================================
   PROJECT MODAL
======================================================= */

window.openProjectModal =
    function(projectId) {

        const project =
            allProjects.find(
                p =>
                    String(p.id) ===
                    String(projectId)
            );


        if (!project) {
            return;
        }


        currentModalProject =
            project;


        const access =
            normalizeAccess(project);

        const price =
            getPrice(project);


        if (modalCategory) {

            modalCategory.innerHTML = `
                <span class="badge badge-category">
                    ${escapeHTML(
                        project.category ||
                        "Other"
                    )}
                </span>

                ${
                    access === "paid"

                        ? `
                            <span class="badge badge-paid">
                                💎 PAID
                            </span>
                          `

                        : `
                            <span class="badge badge-free">
                                🟢 FREE
                            </span>
                          `
                }
            `;
        }


        if (modalTitle) {
            modalTitle.textContent =
                project.title ||
                "Untitled Project";
        }


        if (modalDescription) {
            modalDescription.textContent =
                project.description ||
                "No description.";
        }


        if (modalPrice) {

            modalPrice.textContent =
                access === "paid"
                    ? formatMoney(price)
                    : "FREE";

            modalPrice.style.color =
                access === "paid"
                    ? "var(--gold)"
                    : "var(--green)";
        }


        if (modalDownload) {

            if (access === "free") {

                modalDownload.href =
                    project.file_url || "#";

                modalDownload.textContent =
                    "⬇ DOWNLOAD FREE";

                modalDownload.onclick = null;

            } else {

                /*
                IMPORTANT:
                Paid project must NOT directly
                expose the public storage URL.
                */

                modalDownload.href = "#";

                modalDownload.textContent =
                    "💎 BUY WITH MVOLA";

                modalDownload.onclick =
                    function(event) {

                        event.preventDefault();

                        startMvolaPayment(
                            project
                        );
                    };
            }
        }


        if (modal) {
            modal.classList.add("show");
        }
    };


/* =======================================================
   CLOSE MODAL
======================================================= */

function closeProjectModal() {

    if (modal) {
        modal.classList.remove("show");
    }

    currentModalProject = null;
}


if (closeModal) {

    closeModal.addEventListener(
        "click",
        closeProjectModal
    );
}


if (modal) {

    modal.addEventListener(
        "click",
        function(event) {

            if (
                event.target === modal
            ) {
                closeProjectModal();
            }
        }
    );
}


document.addEventListener(
    "keydown",
    function(event) {

        if (event.key === "Escape") {
            closeProjectModal();
        }
    }
);


/* =======================================================
   ADMIN PROJECTS
======================================================= */

async function loadAdminProjects() {

    if (!adminProjects) {
        return;
    }


    const user =
        currentUser ||
        await getCurrentUser();


    if (!user) {

        adminProjects.innerHTML = "";

        return;
    }


    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .from("projects")
                .select(
                    "id,title,description,category,file_url,file_name,owner_id,created_at,access_type,price"
                )
                .eq(
                    "owner_id",
                    user.id
                )
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                );


        if (error) {

            console.error(
                "ADMIN PROJECT ERROR:",
                error
            );

            adminProjects.innerHTML = `
                <div class="empty">
                    ${escapeHTML(
                        error.message
                    )}
                </div>
            `;

            return;
        }


        if (!data || !data.length) {

            adminProjects.innerHTML = `
                <div class="empty">

                    <div class="empty-icon">
                        📦
                    </div>

                    <div>
                        No projects uploaded yet.
                    </div>

                </div>
            `;

            return;
        }


        adminProjects.innerHTML =
            data
                .map(
                    project =>
                        createProjectCard(
                            project,
                            true
                        )
                )
                .join("");


    } catch (error) {

        console.error(
            "ADMIN PROJECT EXCEPTION:",
            error
        );
    }
}


/* =======================================================
   SAFE FILE NAME
======================================================= */

function makeSafeFileName(
    fileName
) {

    return fileName
        .normalize("NFKD")
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .replace(
            /[^a-zA-Z0-9._-]/g,
            "_"
        );
}


/* =======================================================
   UPLOAD
======================================================= */

if (uploadForm) {

    uploadForm.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();


            console.log(
                "MAH3D UPLOAD START"
            );


            const user =
                currentUser ||
                await getCurrentUser();


            if (!user) {

                setStatus(
                    uploadStatus,
                    "Tsy maintsy manao login aloha.",
                    "error"
                );

                return;
            }


            const title =
                projectTitle?.value.trim() || "";


            const description =
                projectDescription?.value.trim() || "";


            const category =
                projectCategory?.value ||
                "Other";


            const access =
                projectAccess?.value ||
                "free";


            const file =
                projectFile?.files?.[0];


            let price = 0;


            if (access === "paid") {

                price =
                    Number(
                        projectPrice?.value || 0
                    );


                if (
                    !Number.isFinite(price) ||
                    price <= 0
                ) {

                    setStatus(
                        uploadStatus,
                        "Ampidiro ny vidiny ho an'ny PAID model.",
                        "error"
                    );

                    return;
                }
            }


            if (!title) {

                setStatus(
                    uploadStatus,
                    "Ampidiro ny project title.",
                    "error"
                );

                return;
            }


            if (!file) {

                setStatus(
                    uploadStatus,
                    "Misafidiana fichier.",
                    "error"
                );

                return;
            }


            if (uploadBtn) {

                uploadBtn.disabled = true;
                uploadBtn.textContent =
                    "UPLOADING...";
            }


            if (uploadProgress) {
                uploadProgress.style.width =
                    "10%";
            }


            try {

                setStatus(
                    uploadStatus,
                    "Preparing upload..."
                );


                const timestamp =
                    Date.now();


                const safeName =
                    makeSafeFileName(
                        file.name
                    );


                const storagePath =
                    `${user.id}/${timestamp}_${safeName}`;


                if (uploadProgress) {
                    uploadProgress.style.width =
                        "25%";
                }


                setStatus(
                    uploadStatus,
                    "Uploading file..."
                );


                console.log(
                    "Storage path:",
                    storagePath
                );


                const {
                    error:
                        uploadError
                } =
                    await supabaseClient
                        .storage
                        .from(STORAGE_BUCKET)
                        .upload(
                            storagePath,
                            file,
                            {
                                cacheControl:
                                    "3600",

                                upsert:
                                    false
                            }
                        );


                if (uploadError) {

                    console.error(
                        "STORAGE UPLOAD ERROR:",
                        uploadError
                    );

                    throw new Error(
                        uploadError.message
                    );
                }


                if (uploadProgress) {
                    uploadProgress.style.width =
                        "60%";
                }


                setStatus(
                    uploadStatus,
                    "Creating project record..."
                );


                const {
                    data:
                        publicUrlData
                } =
                    supabaseClient
                        .storage
                        .from(STORAGE_BUCKET)
                        .getPublicUrl(
                            storagePath
                        );


                const fileUrl =
                    publicUrlData?.publicUrl;


                if (!fileUrl) {

                    throw new Error(
                        "Could not create file URL."
                    );
                }


                const {
                    error:
                        databaseError
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
                                user.id,

                            access_type:
                                access,

                            price:
                                access === "paid"
                                    ? price
                                    : 0
                        });


                if (databaseError) {

                    console.error(
                        "DATABASE INSERT ERROR:",
                        databaseError
                    );


                    try {

                        await supabaseClient
                            .storage
                            .from(STORAGE_BUCKET)
                            .remove([
                                storagePath
                            ]);

                    } catch (cleanupError) {

                        console.warn(
                            "Cleanup:",
                            cleanupError
                        );
                    }


                    throw new Error(
                        databaseError.message
                    );
                }


                if (uploadProgress) {
                    uploadProgress.style.width =
                        "100%";
                }


                setStatus(
                    uploadStatus,

                    access === "paid"
                        ? "💎 PAID model uploaded successfully!"
                        : "🟢 FREE model uploaded successfully!",

                    "success"
                );


                uploadForm.reset();


                if (projectPrice) {
                    projectPrice.value = "0";
                }


                if (projectAccess) {
                    projectAccess.value = "free";
                }


                updatePriceVisibility();


                await loadProjects();

                await loadAdminProjects();


                setTimeout(
                    function() {

                        if (uploadProgress) {
                            uploadProgress.style.width =
                                "0%";
                        }

                    },
                    1500
                );


            } catch (error) {

                console.error(
                    "UPLOAD ERROR:",
                    error
                );


                setStatus(
                    uploadStatus,

                    "Upload failed: " +
                    (
                        error.message ||
                        "Unknown error"
                    ),

                    "error"
                );


                if (uploadProgress) {
                    uploadProgress.style.width =
                        "0%";
                }


            } finally {

                if (uploadBtn) {

                    uploadBtn.disabled = false;

                    uploadBtn.textContent =
                        "🚀 UPLOAD PROJECT";
                }
            }
        }
    );

} else {

    console.error(
        "❌ uploadForm NOT FOUND"
    );
}


/* =======================================================
   DELETE PROJECT
======================================================= */

window.deleteProject =
    async function(projectId) {

        const user =
            currentUser ||
            await getCurrentUser();


        if (!user) {

            alert(
                "Login required."
            );

            return;
        }


        const project =
            allProjects.find(
                p =>
                    String(p.id) ===
                    String(projectId)
            );


        if (!project) {

            alert(
                "Project not found."
            );

            return;
        }


        if (
            String(project.owner_id) !==
            String(user.id)
        ) {

            alert(
                "You can only delete your own project."
            );

            return;
        }


        if (
            !window.confirm(
                `Delete "${project.title}"?`
            )
        ) {
            return;
        }


        try {

            const {
                error:
                    deleteError
            } =
                await supabaseClient
                    .from("projects")
                    .delete()
                    .eq(
                        "id",
                        projectId
                    )
                    .eq(
                        "owner_id",
                        user.id
                    );


            if (deleteError) {

                throw new Error(
                    deleteError.message
                );
            }


            /*
            Try storage cleanup.
            */

            if (project.file_url) {

                const marker =
                    "/storage/v1/object/public/projects/";


                const index =
                    project.file_url.indexOf(
                        marker
                    );


                if (index !== -1) {

                    const path =
                        decodeURIComponent(
                            project.file_url.substring(
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
                                .from(STORAGE_BUCKET)
                                .remove([
                                    path
                                ]);


                        if (storageError) {

                            console.warn(
                                "Storage cleanup:",
                                storageError
                            );
                        }
                    }
                }
            }


            alert(
                "Project deleted successfully."
            );


            await loadProjects();

            await loadAdminProjects();


        } catch (error) {

            console.error(
                "DELETE ERROR:",
                error
            );

            alert(
                "Delete failed: " +
                (
                    error.message ||
                    "Unknown error"
                )
            );
        }
    };


/* =======================================================
   MVOLA PAYMENT
======================================================= */

async function startMvolaPayment(project) {

    if (!project) {
        return;
    }


    if (
        normalizeAccess(project) !== "paid"
    ) {

        window.location.href =
            project.file_url || "#";

        return;
    }


    const price =
        getPrice(project);


    if (
        !Number.isFinite(price) ||
        price <= 0
    ) {

        alert(
            "Prix invalide."
        );

        return;
    }


    let phone =
        window.prompt(
            "Ampidiro ny numéro MVola:\n\nOhatra: 0341234567"
        );


    if (phone === null) {
        return;
    }


    phone =
        phone.trim();


    if (!phone) {

        alert(
            "Ampidiro ny numéro MVola."
        );

        return;
    }


    /*
    Normalize +261xxxxxxxxx -> 03xxxxxxxx
    */

    phone =
        phone.replace(
            /\s+/g,
            ""
        );


    if (
        phone.startsWith("+261")
    ) {

        phone =
            "0" +
            phone.substring(4);

    } else if (
        phone.startsWith("261")
    ) {

        phone =
            "0" +
            phone.substring(3);
    }


    if (
        !/^03\d{8}$/.test(phone)
    ) {

        alert(
            "Numéro MVola invalide. Ohatra: 0341234567"
        );

        return;
    }


    const orderId =
        "MAH3D-" +
        Date.now() +
        "-" +
        Math.random()
            .toString(36)
            .substring(2, 8)
            .toUpperCase();


    try {

        /*
        Disable button while request runs.
        */

        if (modalDownload) {

            modalDownload.disabled = true;

            modalDownload.textContent =
                "⏳ PAYMENT...";
        }


        console.log(
            "Starting MVola payment:",
            {
                orderId,
                projectId: project.id,
                amount: price
            }
        );


        const response =
            await fetch(
                MVOLA_FUNCTION_URL,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({

                            customerNumber:
                                phone,

                            amount:
                                Math.trunc(price),

                            orderId:
                                orderId,

                            projectId:
                                project.id,

                            projectTitle:
                                project.title
                        })
                }
            );


        const data =
            await response.json();


        console.log(
            "MVola response:",
            data
        );


        if (
            !response.ok ||
            !data.success
        ) {

            const errorMessage =
                data?.result
                    ?.errorDescription ||

                data?.result
                    ?.error ||

                data?.error ||

                "MVola payment failed.";


            alert(
                "MVola ERROR:\n\n" +
                errorMessage
            );


            return;
        }


        alert(
            "MVola payment request sent.\n\n" +
            "Order: " +
            orderId +
            "\n\n" +
            "Jereo ny téléphone-nao ary araho ny MVola confirmation."
        );


    } catch (error) {

        console.error(
            "MVola payment exception:",
            error
        );


        alert(
            "Tsy afaka mifandray amin'ny MVola.\n\n" +
            (
                error.message ||
                "Connection error"
            )
        );


    } finally {

        if (modalDownload) {

            modalDownload.disabled = false;

            modalDownload.textContent =
                "💎 BUY WITH MVOLA";
        }
    }
}


/* =======================================================
   CONNECTION TEST
======================================================= */

async function testConnection() {

    try {

        const {
            error
        } =
            await supabaseClient
                .from("projects")
                .select(
                    "id",
                    {
                        count: "exact",
                        head: true
                    }
                );


        if (error) {

            console.error(
                "Connection error:",
                error
            );

            if (connectionStatus) {
                connectionStatus.textContent =
                    "Error";
            }

            if (statusDot) {
                statusDot.style.background =
                    "var(--red)";
            }

            return false;
        }


        if (connectionStatus) {
            connectionStatus.textContent =
                "Online";
        }


        if (statusDot) {
            statusDot.style.background =
                "var(--green)";
        }


        return true;


    } catch (error) {

        console.error(
            "Connection exception:",
            error
        );

        return false;
    }
}


/* =======================================================
   INIT
======================================================= */

async function init() {

    console.log(
        "MAH3D initialization..."
    );


    /*
    PUBLIC PROJECTS
    */

    await loadProjects();


    /*
    CONNECTION
    */

    await testConnection();


    /*
    AUTH
    */

    const user =
        await getCurrentUser();


    currentUser =
        user;


    if (user) {

        console.log(
            "Current user:",
            user.email
        );


        showDashboard(
            user
        );


        await loadAdminProjects();


    } else {

        console.log(
            "Current user: null"
        );


        showLogin();
    }


    console.log(
        "MAH3D initialization complete."
    );
}


/* =======================================================
   START
======================================================= */

init();
