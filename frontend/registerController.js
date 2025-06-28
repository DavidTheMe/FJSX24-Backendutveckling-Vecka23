const usernameInput = document.getElementsByClassName("username-input")[0];
const passwordInput = document.getElementsByClassName("password-input")[0];
const errorText = document.getElementsByClassName("error-text")[0];

async function tryRegister() {
  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();

  if (username.length > 40 || username.length < 3) {
    errorText.textContent = "Username must be between 3 and 40 characters long";
    return;
  }

  if (password.length > 40 || password.length < 3) {
    errorText.textContent = "Password must be between 3 and 40 characters long";
    return;
  }

  errorText.textContent = "Please wait...";

  try {
    const response = await fetch('http://localhost:7000/users');

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const users = await response.json();

    // Check if any user has the same username
    const userExists = users.some(user => user.username === username);

    if (userExists) {
      errorText.textContent = "Username is taken";
    } else {
      register(username, password);
    }

  } catch (error) {
    errorText.textContent = "Error: " + error.message;
    console.error(error);
  }
}

async function register(username, password) {

  try {
    const response = await fetch('http://localhost:7000/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        'username': username,
        'password': password
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    errorText.textContent = "Register successful";
    const data = await response.json();
  } catch (error) {
    console.error('Error:', error);
  }

}
