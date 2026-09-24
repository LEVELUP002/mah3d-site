```javascript
/* =========================
   MOBILE MENU
========================= */

const menuButton =
    document.getElementById("menuButton");

const mainNav =
    document.getElementById("mainNav");

if (menuButton) {

    menuButton.addEventListener(
        "click",
        () => {

            mainNav.classList.toggle("open");

        }
    );

}


document
    .querySelectorAll("#mainNav a")
    .forEach(link => {

        link.addEventListener(
            "click",
            () => {

                mainNav.classList.remove("open");

            }
        );

    });



/* =========================
   PROJECT MODAL
========================= */

const projectModal =
    document.getElementById("projectModal");

const modalTitle =
    document.getElementById("modalTitle");

const modalDescription =
    document.getElementById("modalDescription");


function showProject(name, description) {

    modalTitle.textContent = name;

    modalDescription.textContent =
        description;

    projectModal.classList.add("active");

}


function closeProject() {

    projectModal.classList.remove("active");

}


if (projectModal) {

    projectModal.addEventListener(
        "click",
        event => {

            if (event.target === projectModal) {
                closeProject();
            }

        }
    );

}



/* =========================
   DOWNLOAD
========================= */

function downloadSoon() {

    alert(
        "MAH3D DOWNLOAD\n\n" +
        "This file will be available soon."
    );

}



/* =========================
   PROJECT UPLOAD
========================= */

const projectUpload =
    document.getElementById("projectUpload");

const uploadMessage =
    document.getElementById("uploadMessage");

const projectGrid =
    document.getElementById("projectGrid");


if (projectUpload) {

    projectUpload.addEventListener(
        "change",
        function () {

            if (!this.files.length) {
                return;
            }

            const file = this.files[0];

            const extension =
                file.name
                    .split(".")
                    .pop()
                    .toLowerCase();


            let category = "other";

            if (
                extension === "blend" ||
                extension === "fbx" ||
                extension === "obj" ||
                extension === "glb" ||
                extension === "gltf"
            ) {

                category = "3d";

            }
            else if (
                extension === "exe" ||
                extension === "py"
            ) {

                category = "software";

            }
            else if (
                extension === "zip" ||
                extension === "rar" ||
                extension === "7z"
            ) {

                category = "other";

            }


            const projectName =
                file.name.replace(
                    /\.[^/.]+$/,
                    ""
                );


            const card =
                document.createElement("article");


            card.className =
                "project-card";

            card.dataset.category =
                category;

            card.dataset.name =
                projectName.toLowerCase();


            card.innerHTML = `

                <div class="project-image project-purple">

                    <span>
                        ${extension.toUpperCase()}
                    </span>

                </div>

                <div class="project-body">

                    <small>
                        ${category.toUpperCase()}
                    </small>

                    <h3>
                        ${escapeHTML(projectName)}
                    </h3>

                    <p>
                        Added from your computer.
                    </p>

                    <button
                        class="project-view"
                        onclick="showProject(
                            '${escapeJS(projectName)}',
                            'Local project file: ${escapeJS(file.name)}'
                        )"
                    >
                        VIEW PROJECT
                    </button>

                </div>
            `;


            projectGrid.appendChild(card);


            uploadMessage.innerHTML =
                "✓ Project added: <strong>" +
                escapeHTML(file.name) +
                "</strong>";


            /*
             * Save project information locally.
             * The actual file is NOT uploaded to GitHub.
             */

            saveProjectInfo(
                projectName,
                category,
                file.name
            );


            /*
             * Reset file selector
             */

            this.value = "";

        }
    );

}



/* =========================
   LOCAL PROJECT STORAGE
========================= */

function saveProjectInfo(
    name,
    category,
    filename
) {

    const projects =
        JSON.parse(
            localStorage.getItem(
                "mah3d_projects"
            ) || "[]"
        );


    projects.push({

        name: name,
        category: category,
        filename: filename,
        date: new Date().toISOString()

    });


    localStorage.setItem(
        "mah3d_projects",
        JSON.stringify(projects)
    );

}



/* =========================
   SEARCH PROJECTS
========================= */

const projectSearch =
    document.getElementById("projectSearch");

const projectFilter =
    document.getElementById("projectFilter");


function filterProjects() {

    const search =
        projectSearch.value
            .toLowerCase()
            .trim();

    const filter =
        projectFilter.value;


    const cards =
        document.querySelectorAll(
            ".project-card"
        );


    cards.forEach(card => {

        const name =
            card.dataset.name || "";

        const category =
            card.dataset.category || "other";


        const searchMatch =
            name.includes(search);

        const categoryMatch =
            filter === "all" ||
            category === filter;


        if (
            searchMatch &&
            categoryMatch
        ) {

            card.style.display = "";

        }
        else {

            card.style.display = "none";

        }

    });

}


if (projectSearch) {

    projectSearch.addEventListener(
        "input",
        filterProjects
    );

}


if (projectFilter) {

    projectFilter.addEventListener(
        "change",
        filterProjects
    );

}



/* =========================
   BACK TO TOP
========================= */

const topButton =
    document.getElementById("topButton");


window.addEventListener(
    "scroll",
    () => {

        if (window.scrollY > 500) {

            topButton.classList.add(
                "show"
            );

        }
        else {

            topButton.classList.remove(
                "show"
            );

        }

    }
);


topButton.addEventListener(
    "click",
    () => {

        window.scrollTo({

            top: 0,

            behavior: "smooth"

        });

    }
);



/* =========================
   SCROLL REVEAL
========================= */

const revealElements =
    document.querySelectorAll(
        ".service-card, " +
        ".project-card, " +
        ".download-item, " +
        ".contact-card, " +
        ".feature, " +
        ".about-logo"
    );


const revealObserver =
    new IntersectionObserver(
        entries => {

            entries.forEach(
                entry => {

                    if (
                        entry.isIntersecting
                    ) {

                        entry.target.classList.add(
                            "visible"
                        );

                    }

                }
            );

        },
        {
            threshold: .12
        }
    );


revealElements.forEach(
    element => {

        element.style.opacity = "0";

        element.style.transform =
            "translateY(25px)";

        element.style.transition =
            "opacity .7s ease, " +
            "transform .7s ease";

        revealObserver.observe(
            element
        );

    }
);


document.addEventListener(
    "DOMContentLoaded",
    () => {

        document
            .querySelectorAll(".visible")
            .forEach(element => {

                element.style.opacity = "1";

                element.style.transform =
                    "translateY(0)";

            });

    }
);



/* =========================
   SAFETY HELPERS
========================= */

function escapeHTML(text) {

    const div =
        document.createElement("div");

    div.textContent = text;

    return div.innerHTML;

}


function escapeJS(text) {

    return String(text)
        .replace(/\\/g, "\\\\")
        .replace(/'/g, "\\'")
        .replace(/"/g, '\\"')
        .replace(/\n/g, "\\n")
        .replace(/\r/g, "\\r");

}
```
