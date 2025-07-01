const errorText = document.getElementsByClassName("error-text")[0];
const successText = document.getElementsByClassName("success-text")[0];
const boardForm = document.getElementsByClassName("board-form")[0];
const nameInput = document.getElementsByClassName("name-input")[0];
const descriptionInput = document.getElementsByClassName("description-input")[0];
const boardFormErrorText = document.getElementsByClassName("board-form-error-text")[0];
let username = "";
let userId = "";

getBoards();
hideBoardForm();


async function getBoards(retry = true) {
  const token = localStorage.getItem('token');
  const refreshToken = localStorage.getItem('refreshToken');

  try {
    const response = await fetch("http://localhost:7000/boards", {
      method: "GET",
      headers: {
        'Authorization': `Bearer ${token}`,
        'refresh-token': refreshToken
      }
    });

    if (!response.ok) {
      let errorData = {};
      try {
        errorData = await response.json();
      } catch {}
      errorText.textContent = "Error fetching boards: " + (errorData.message || response.statusText);
      successText.textContent = '';
      return;
    }

    const newAccessToken = response.headers.get('new-access-token');
    updateRefreshTokenIfNeeded(newAccessToken);

    const data = await response.json();

    username = data.user?.username || "(unknown user)";
    userId = data.user?.id;

    if (!data.boards) {
      errorText.textContent = "No boards data found.";
      successText.textContent = '';
      return;
    }

    successText.textContent = 'You are logged in as ' + username;

    renderBoards(data.boards);

  } catch (error) {
    console.error("Network or parsing error:", error);
    errorText.textContent = "Network error: " + error.message;
    successText.textContent = '';
  }
}

function renderBoards(boards) {

    //Delete current boards
    const elements = document.querySelectorAll('.green-box-board');

    elements.forEach(element => {
        element.remove();
    });

    //Create new boards
    boards.forEach(board => {
        // Create container div
        const box = document.createElement('div');
        box.className = 'green-box-board';

        // Title
        const title = document.createElement('h2');
        title.textContent = board.name;
        box.appendChild(title);

        // Description
        const description = document.createElement('p');
        description.className = 'description-box';
        description.textContent = board.description || "No description provided.";
        box.appendChild(description);

        // "Go to board" button
        const goButton = document.createElement('button');
        goButton.textContent = 'Go to board';
        goButton.onclick = () => {
            // You can customize this behavior (e.g. navigate to /boards/:id)
            alert(`Going to board: ${board.name}`);
        };
        box.appendChild(goButton);

        // "Delete board" button
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete board';
        deleteButton.onclick = () => {
            deleteBoard(board.id);
        };
        box.appendChild(deleteButton);

        // Last updated
        const updated = document.createElement('p');
        updated.textContent = `Last updated: ${board.last_updated || 'Unknown date'}`;
        box.appendChild(updated);

        // Append to body
        document.body.appendChild(box);
    });
}

function showBoardForm() {
    boardForm.style.display = "block";
}

function hideBoardForm() {
    boardForm.style.display = "none";
    nameInput.value = "";
    descriptionInput.value = "";
    boardFormErrorText.textContent = "";
}

function tryCreatingBoard() {
    //CHeck length
    if (nameInput.value.length < 1 && descriptionInput.value.length < 1) {
        boardFormErrorText.textContent = "You must add both a name and description to your board";
    }
    else {
        const token = localStorage.getItem('token');
        const refreshToken = localStorage.getItem('refreshToken');
        createBoard(token, refreshToken, userId, nameInput.value, descriptionInput.value);
    }

}

async function createBoard(token, refreshToken, ownerId, name, description) {
    boardFormErrorText.textContent = "Loading...";

    try {
        const response = await fetch('http://localhost:7000/boards', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'refresh-token': refreshToken
            },
            body: JSON.stringify({
                "ownerId": ownerId,
                "name": name,
                "description": description
            }),
        });

        // Try parsing JSON safely
        let data = null;
        try {
            data = await response.json();
        } catch (jsonError) {
            // It might not be JSON, ignore
        }

        if (!response.ok) {
            const errorMessage = data?.error || `HTTP error ${response.status}`;
            boardFormErrorText.textContent = errorMessage;
            console.error('Server responded with error:', errorMessage);
            return; // Stop here, do not hide form
        }

        // Success
        hideBoardForm();
        updateRefreshTokenIfNeeded(response.headers.get('new-access-token'));
        getBoards();
        boardFormErrorText.textContent = "Board created successfully.";
    } catch (error) {
        boardFormErrorText.textContent = "Network error: Could not create board.";
        console.error('Network or unexpected error:', error);
    }
}

async function deleteBoard(boardId) {
    successText.textContent = "Loading...";
    const token = localStorage.getItem('token');
    const refreshToken = localStorage.getItem('refreshToken');

    console.log(boardId);

    try {
        const response = await fetch('http://localhost:7000/boards', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'refresh-token': refreshToken
            },
            body: JSON.stringify({
                "id": boardId,
            }),
        });

        // Try parsing JSON safely
        let data = null;
        try {
            data = await response.json();
        } catch (jsonError) {
            // It might not be JSON, ignore
            successText.textContent = "";
        }

        if (!response.ok) {
            const errorMessage = data?.error || `HTTP error ${response.status}`;
            errorText.textContent = errorMessage;
            successText.textContent = "";
            console.error('Server responded with error:', errorMessage);
            return; // Stop here, do not hide form
        }

        // Success
        updateRefreshTokenIfNeeded(response.headers.get('new-access-token'));
        getBoards();
        successText.textContent = "";
    } catch (error) {
        successText.textContent = "";
        errorText.textContent = "Network error: Could not delete board.";
        console.error('Network or unexpected error:', error);
    }
    getBoards();
}

function logout() {
    window.location = "login.html";
}

async function deleteAccount() {
    successText.textContent = "Loading...";

    console.log(userId);

    const token = localStorage.getItem('token');
    const refreshToken = localStorage.getItem('refreshToken');

    try {
        const response = await fetch(`http://localhost:7000/users/${userId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'refresh-token': refreshToken
            }
        });

        // Try parsing JSON safely
        let data = null;
        try {
            data = await response.json();
        } catch (jsonError) {
            successText.textContent = "";
        }

        if (!response.ok) {
            const errorMessage = data?.error || `HTTP error ${response.status}`;
            errorText.textContent = errorMessage;
            successText.textContent = "";
            console.error('Server responded with error:', errorMessage);
            return;
        }

        // Success
        logout();
    } catch (error) {
        successText.textContent = "";
        errorText.textContent = "Network error: Could not delete user.";
        console.error('Network or unexpected error:', error);
    }
}

function updateRefreshTokenIfNeeded(newAccessToken) {
    if (newAccessToken != null) {
        console.log("Received new access token from server");
        localStorage.setItem('token', newAccessToken);
    }
}