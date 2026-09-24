```javascript
/* =========================
   MAH3D ADMIN LOGIN
========================= */

/*
   IMPORTANT:
   This is only a client-side demo login.
   GitHub Pages has no secure backend.
*/

const adminLoginForm =
    document.getElementById("adminLoginForm");

const loginPanel =
    document.getElementById("loginPanel");

const adminDashboard =
    document.getElementById("adminDashboard");

const loginMessage =
    document.getElementById("loginMessage");

const logoutButton =
    document.getElementById("logoutButton");

const projectCount =
    document.getElementById("projectCount");

const adminProjectUpload =
    document.getElementById("adminProjectUpload");

const adminUploadMessage =
    document.getElementById("adminUploadMessage");


/*
   DEMO LOGIN

   Change these values for your local demo,
   but do NOT use real sensitive passwords here.
*/

const DEMO_USERNAME = "admin";
const DEMO_PASSWORD = "MAH3D2026";


function updateProjectCount() {

    const projects =
        JSON.parse(
            localStorage.getItem(
                "mah3d_projects"
            ) || "[]"
        );

    if (projectCount) {
        projectCount.textContent =
            projects.length;
    }

}


function showDashboard() {

    if (loginPanel) {
        loginPanel.hidden = true;
    }

    if (adminDashboard) {
        adminDashboard.hidden = false;
    }

    updateProjectCount();

}


function showLogin() {

    if (loginPanel) {
        loginPanel.hidden = false;
    }

    if (adminDashboard) {
        adminDashboard.hidden = true;
    }

}


if (adminLoginForm) {

    adminLoginForm.addEventListener(
        "submit",
        function(event) {

            event.preventDefault();

            const username =
                document
                    .getElementById(
                        "adminUsername"
                    )
                    .value
                    .trim();

            const password =
                document
                    .getElementById(
                        "adminPassword"
                    )
                    .value;


            if (
                username === DEMO_USERNAME &&
                password === DEMO_PASSWORD
            ) {

                sessionStorage.setItem(
                    "mah3d_admin",
                    "true"
                );

                loginMessage.textContent = "";

                showDashboard();

            }
            else {

                loginMessage.textContent =
                    "Invalid username or password.";

            }

        }
    );

}


if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        function() {

            sessionStorage.removeItem(
                "mah3d_admin"
            );

            showLogin();

        }
    );

}


if (adminProjectUpload) {

    adminProjectUpload.addEventListener(
        "change",
        function() {

            if (!this.files.length) {
                return;
            }

            const file = this.files[0];

            adminUploadMessage.innerHTML =
                "✓ Selected: <strong>" +
                escapeHTML(file.name) +
                "</strong><br>" +
                "Ready for a real backend upload.";

            /*
               Save project metadata locally.
               The actual file is NOT uploaded to GitHub.
            */

            const projects =
                JSON.parse(
                    localStorage.getItem(
                        "mah3d_projects"
                    ) || "[]"
                );

            projects.push({

                name:
                    file.name.replace(
                        /\.[^/.]+$/,
                        ""
                    ),

                filename: file.name,

                date:
                    new Date().toISOString()

            });

            localStorage.setItem(
                "mah3d_projects",
                JSON.stringify(projects)
            );

            updateProjectCount();

            this.value = "";

        }
    );

}


/*
   Restore admin session
*/

if (
    sessionStorage.getItem(
        "mah3d_admin"
    ) === "true"
) {

    showDashboard();

}
else {

    showLogin();

}
```
