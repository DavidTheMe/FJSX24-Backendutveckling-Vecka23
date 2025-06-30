const usernameInput = document.getElementsByClassName("username-input")[0];
const passwordInput = document.getElementsByClassName("password-input")[0];
const errorText = document.getElementsByClassName("error-text")[0];

async function tryLogin() {
    errorText.textContent = "Please wait...";

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    // Input validation
    if (username.length < 3 || username.length > 40) {
        errorText.textContent = "Username must be between 3 and 40 characters long.";
        return;
    }

    if (password.length < 3 || password.length > 40) {
        errorText.textContent = "Password must be between 3 and 40 characters long.";
        return;
    }

    try {
        const response = await fetch(`http://localhost:7000/users/${encodeURIComponent(username)}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ password })
        });

        if (!response.ok) {
            let errorMessage = "Login failed."; // ✅ safe fallback

            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorMessage;
            } catch (jsonError) {
                console.warn("Could not parse error response:", jsonError);
            }

            errorText.textContent = errorMessage;
            return;
        }

        // Login successful
        const data = await response.json();
        console.log(data.accessToken);
        localStorage.setItem('token', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        console.log(localStorage.getItem('token'));
        login();

    } catch (error) {
        errorText.textContent = "Network error: " + error.message;
        console.error("Fetch failed:", error);
    }
}

function login() {
    window.location = "boards.html";
}
