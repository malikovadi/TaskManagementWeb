const apiUrl = 'https://656976d8de53105b0dd71234.mockapi.io/api/v1/user';

function checkUsernameExists(username) {
    return fetch(`${apiUrl}?username=${username}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => data.length > 0)
        .catch(error => {
            console.error('Error checking username existence:', error);
            throw error; // Propagate the error to the calling code
        });
}

function createUser(username, password) {
    // Implement logic to create a new user (e.g., using fetch to add to the mock API)
    fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        const userId = data.id;
        localStorage.setItem('userId', userId);
        displayMessage('Sign up successful. You can now sign in.', 'signupMessage');
    })
    .catch(error => {
        displayMessage('Failed to sign up. Please try again.', 'signupMessage');
        console.error('Sign-up error:', error);
    });
}

function signUp() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (!username || !password) {
        displayMessage('Please provide both username and password.', 'signupMessage');
        return;
    }

    // Check if the username already exists
    checkUsernameExists(username)
        .then(usernameExists => {
            if (usernameExists) {
                displayMessage('Username already exists. Please choose a different username.', 'signupMessage');
            } else {
                // If the username doesn't exist, proceed with sign up
                createUser(username, password);
            }
        })
        .catch(error => {
            displayMessage('Failed to check username availability. Please try again.', 'signupMessage');
            console.error('Error checking username existence:', error);
        });
}

function signIn() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (!username || !password) {
        alert('Incorrect username or password... Please, try again!');
        return;
    }

    fetch(`${apiUrl}?username=${username}&password=${password}`)
    .then(response => response.json())
    .then(data => {
        if (data.length > 0) {
            const userId = data[0].id;
            localStorage.setItem('userId', userId);
            displayMessage('Sign in successful. Redirecting to the main page...', 'signinMessage');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
        } else {
            displayMessage('Invalid username or password. Please try again.', 'signinMessage');
        }
    })
    .catch(error => {
        displayMessage('Failed to sign in. Please try again.', 'signinMessage');
        console.error('Sign-in error:', error);
    });
}

function signOut() {
    // Clear the stored user ID
    localStorage.removeItem('userId');

    // Redirect the user to the sign-in page (replace 'signin.html' with your actual sign-in page)
    window.location.href = 'signInPage.html';
}

function saveTask() {
    const userId = getAuthenticatedUserId();
    const titleInput = document.getElementById('title');
    const descriptionInput = document.getElementById('description');
    const deadlineInput = document.getElementById('deadline');

    const title = titleInput.value;
    const description = descriptionInput.value;
    const deadline = deadlineInput.value;

    if (!title || !description || !deadline) {
        alert('Please fill in all fields before saving.');
        return;
    }

    const selectedRow = document.querySelector("#taskTableBody tr.selected");

    if (selectedRow) {
        // Update the existing task in the DOM
        selectedRow.cells[0].innerHTML = title;
        selectedRow.cells[1].innerHTML = description;
        selectedRow.cells[2].innerHTML = deadline;

        // Update the task in the API
        const taskId = selectedRow.id;
        const data = {
            title: title,
            description: description,
            deadline: deadline,
            completed: selectedRow.getAttribute("data-completed") === "true"
        };

        updateTaskInApi(taskId, data);

        // Hide the "Edit" button
        document.getElementById('editTask').style.display = 'none';
    } else {
        // Create a new task
        const taskData = {
            title: title,
            description: description,
            deadline: deadline,
            completed: false,
        };

        fetch(`${apiUrl}/${userId}/tasks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(taskData),
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log('Task created:', data);
            
            // Remove the selection from any previously selected rows
            const allRows = document.querySelectorAll('#taskTableBody tr');
            allRows.forEach(row => {
                row.classList.remove('selected');
            });

            // Create a new row for the task and insert it into the table
            const tableBody = document.getElementById('taskTableBody');
            const newRow = tableBody.insertRow();
            newRow.id = data.id;
            newRow.setAttribute('data-completed', data.completed);

            const cell1 = newRow.insertCell(0);
            const cell2 = newRow.insertCell(1);
            const cell3 = newRow.insertCell(2);
            const cell4 = newRow.insertCell(3);

            cell1.innerHTML = data.title;
            cell2.innerHTML = data.description;
            cell3.innerHTML = data.deadline;
            cell4.innerHTML = data.completed ? 'Completed' : 'Not Completed';

            // Add event listener to the new row
            newRow.addEventListener('click', handleTableRowClick);

            // Highlight the new row
            highlightSelectedRow(newRow);

            // Show the "Edit" button
            document.getElementById('editTask').style.display = 'inline-block';
        })
        .catch(error => {
            console.error('Error creating/updating task:', error);
        });
    }

    // Clear input fields
    clearInputFields();

    // Save tasks to local storage
    saveTasksToLocalstorage();
}



function updateTaskInApi(taskId, data) {
    const userId = localStorage.getItem('userId');

    fetch(`${apiUrl}/${userId}/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    })
    .then(response => response.json())
    .then(updatedTask => {
        console.log('Task updated in API:', updatedTask);
    })
    .catch(error => {
        console.error('Error updating task in API:', error);
    });
}

function complete() {
    var selectedRow = document.querySelector("#taskTableBody tr.selected");

    if (selectedRow) {
        var completed = selectedRow.getAttribute("data-completed") === "true";

        // Update the completion status in the row
        selectedRow.setAttribute("data-completed", !completed);
        var statusCell = selectedRow.cells[3];
        statusCell.innerHTML = !completed ? "Completed" : "Not Completed";

        // Update the completion status in the API
        var taskId = selectedRow.id;
        var data = { completed: !completed };

        updateTaskInApi(taskId, data);

        // Update local storage
        saveTasksToLocalstorage();
    } else {
        console.error('No task selected for completion.');
    }
}

function clearInputFields() {
    // Get all input elements
    const inputFields = document.querySelectorAll('input');

    // Loop through the input elements and set their values to an empty string
    inputFields.forEach(input => {
        input.value = '';
    });
}
// Update the populateTable function to include a "Delete" button in each row
function populateTable(tasks) {
    const tableBody = document.getElementById("taskTableBody");
    tableBody.innerHTML = ""; // Clear existing rows

    tasks.forEach(function (task) {
        const row = tableBody.insertRow();
        row.id = task.id;
        row.setAttribute("data-completed", task.completed);

        const cell1 = row.insertCell(0);
        const cell2 = row.insertCell(1);
        const cell3 = row.insertCell(2);
        const cell4 = row.insertCell(3);

        cell1.innerHTML = task.title;
        cell2.innerHTML = task.description;
        cell3.innerHTML = task.deadline;
        cell4.innerHTML = task.completed ? "Completed" : "Not Completed";

        // Add event listener to the row
        row.addEventListener("click", handleTableRowClick);
    });
}

function deleteTask() {
    const selectedRow = document.querySelector("#taskTableBody tr.selected");

    if (selectedRow) {
        const taskId = selectedRow.id;

        // Delete the task from the API
        deleteTaskFromApi(taskId)
            .then(() => {
                // Remove the selected row from the table
                selectedRow.remove();

                // Update local storage
                saveTasksToLocalstorage();
                clearInputFields();
            })
            .catch(error => {
                console.error('Error deleting task:', error);
            });
    } else {
        console.error('No task selected for deletion.');
    }
}


function deleteTaskFromApi(taskId) {
    const userId = localStorage.getItem('userId');

    return fetch(`${apiUrl}/${userId}/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        },
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        console.log('Task deleted from API');
    })
    .catch(error => {
        console.error('Error deleting task from API:', error.message);
        throw error; // Propagate the error to the calling code
    });
}


function saveTasksToLocalstorage() {
    const tasks = getAllTasksFromTable();
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function getAllTasksFromTable() {
    const tasks = [];
    const tableRows = document.querySelectorAll('#taskTableBody tr');

    tableRows.forEach(row => {
        const task = {
            id: row.id,
            title: row.cells[0].innerHTML,
            description: row.cells[1].innerHTML,
            deadline: row.cells[2].innerHTML,
            completed: row.getAttribute('data-completed') === 'true',
        };
        tasks.push(task);
    });

    return tasks;
}

function displayTasks(filter) {
    const tableRows = document.querySelectorAll('#taskTableBody tr');

    tableRows.forEach(row => {
        const completed = row.getAttribute('data-completed') === 'true';

        switch (filter) {
            case 'all':
                row.style.display = 'table-row';
                break;
            case 'completed':
                row.style.display = completed ? 'table-row' : 'none';
                break;
            case 'active':
                row.style.display = completed ? 'none' : 'table-row';
                break;
        }
    });
}

function getAuthenticatedUserId() {
    return localStorage.getItem('userId');
}

function displayMessage(message, elementId) {
    document.getElementById(elementId).textContent = message;
}

function fetchTasks(userId) {
    return fetch(`${apiUrl}/${userId}/tasks`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch tasks');
            }
            return response.json();
        })
        .catch(error => {
            console.error('Error fetching tasks:', error);
        });
}



function loadTasks() {
    return new Promise((resolve, reject) => {
        // Retrieve the user ID from local storage
        const userId = getAuthenticatedUserId();

        if (userId) {
            // Load tasks from the API
            fetchTasks(userId)
                .then(tasks => {
                    populateTable(tasks);
                    resolve();  // Resolve the promise when tasks are loaded
                })
                .catch(error => {
                    console.error('Error fetching tasks from API:', error);
                    reject(error);  // Reject the promise on error
                });

            // Load tasks from local storage
            loadTasksFromLocalStorage();
        } else {
            reject(new Error('User ID not found.'));
        }
    });
}

loadTasks().then(() => {
    // Additional actions after tasks are loaded
    console.log('Tasks loaded successfully');
}).catch(error => {
    console.error('Error loading tasks:', error);
});


function loadTasksFromLocalStorage() {
    const storedTasks = localStorage.getItem('tasks');
    if (storedTasks) {
        const tasks = JSON.parse(storedTasks);
        populateTable(tasks);
    }
}

const authenticatedUserId = getAuthenticatedUserId();

document.addEventListener("DOMContentLoaded", function () {
    // Other initialization code...

    // Attach click event listener to radio buttons
    var allTasksRadio = document.getElementById("allTasks");
    var completedTasksRadio = document.getElementById("completedTasks");
    var activeTasksRadio = document.getElementById("activeTasks");

    allTasksRadio.addEventListener("click", function () {
        displayTasks("all");
    });

    completedTasksRadio.addEventListener("click", function () {
        displayTasks("completed");
    });

    activeTasksRadio.addEventListener("click", function () {
        displayTasks("active");
    });

    // Load existing tasks from the API and local storage
    loadTasks();
});

function handleTableRowClick(event) {
    const selectedRow = event.target.closest('tr');

    if (selectedRow) {
        // Highlight the selected row
        highlightSelectedRow(selectedRow);

        // Show the "Edit" button
        document.getElementById('editTask').style.display = 'inline-block';

        // Update button visibility based on completion status
        updateButtonVisibility(selectedRow);
    }
}

function editTask() {
    const selectedRow = document.querySelector("#taskTableBody tr.selected");

    if (selectedRow) {
        // Fill input fields with data from the selected row
        document.getElementById('title').value = selectedRow.cells[0].innerHTML;
        document.getElementById('description').value = selectedRow.cells[1].innerHTML;
        document.getElementById('deadline').value = selectedRow.cells[2].innerHTML;
    }
}

function highlightSelectedRow(selectedRow) {
    // Remove the "selected" class from all rows
    const allRows = document.querySelectorAll('#taskTableBody tr');
    allRows.forEach(row => {
        row.classList.remove('selected');
    });

    // Add the "selected" class to the clicked row
    selectedRow.classList.add('selected');

    // Toggle the visibility of the "Edit" button based on whether a row is selected
    const editButton = document.getElementById('editTask');
    editButton.style.display = selectedRow ? 'block' : 'none';
}


function updateButtonVisibility(selectedRow) {
    const markButton = document.getElementById("markAsComplete");
    const deleteButton = document.getElementById("delete");

    // Check the completion status of the selected row
    const completed = selectedRow.getAttribute("data-completed") === "true";

    // Show/hide buttons based on completion status
    markButton.style.display = completed ? "none" : "block";
    deleteButton.style.display = "block";
}

document.body.addEventListener('click', function(event) {
    const isClickInsideTable = event.target.closest('#taskTableBody');
    
    // If the click is outside the table or on a selected row, unselect the row
    if (!isClickInsideTable || event.target.closest('#taskTableBody tr.selected')) {
        unselectTableRow();
    }
});

document.getElementById('taskTableBody').addEventListener('click', function(event) {
    // If the click is on a selected row, unselect the row
    if (event.target.tagName === 'TR' && event.target.classList.contains('selected')) {
        unselectTableRow();
    }
});

function unselectTableRow() {
    // Remove the "selected" class from all rows
    const allRows = document.querySelectorAll('#taskTableBody tr');
    allRows.forEach(row => {
        row.classList.remove('selected');
    });

    // Hide the "Edit" button if it exists
    const editTaskButton = document.getElementById('editTask');
    if (editTaskButton) {
        editTaskButton.style.display = 'none';
    }
}