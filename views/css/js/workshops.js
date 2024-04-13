
document.addEventListener('DOMContentLoaded', function() {
    // Get the modal
    var wsModal = document.querySelector(".ws-modal");

    // Get all the buttons that could open the modal
    var wsButtons = document.querySelectorAll(".ws-modal-button");

    // Get the <span> element that closes the modal
    var wsSpan = document.querySelector(".ws-close");

    // Add click event listeners to each sign-up button
    wsButtons.forEach(function(btn) {
        btn.addEventListener('click', function() {
            const workshopId = this.getAttribute('data-workshop-id');
            // Set the workshopId in the hidden input inside the form
            document.querySelector("#ws-signupForm input[name='workshopId']").value = workshopId;
            wsModal.style.display = "block";
        });
    });

    // When the user clicks on <span> (x), close the modal
    wsSpan.onclick = function() {
        wsModal.style.display = "none";
    }

    // Close the modal if the user clicks anywhere outside of it
    window.onclick = function(event) {
        if (event.target == wsModal) {
            wsModal.style.display = "none";
        }
    }

    // Handle form submission
    document.getElementById("ws-signupForm").addEventListener("submit", function(e) {
        e.preventDefault();
        const formData = new FormData(this);

        // Convert formData to a plain object
        const formObject = {};
        formData.forEach((value, key) => formObject[key] = value);

        // Debugging: Log form data to ensure it's correct
        console.log("Form data:", formObject);

        // Replace '/api/workshops/signup' with your actual endpoint
        fetch('/api/workshops/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formObject),
        })
        .then(response => response.json())
        .then(data => {
            console.log(data); // Log response data
            alert('Sign up successful!');
            wsModal.style.display = "none";
        })
        .catch((error) => {
            console.error('Error:', error);
            alert('An error occurred. Please try again.');
        });
    });
});


document.addEventListener('DOMContentLoaded', function () {
    // Example: Form submission validation for the workshop posting form
    const postWorkshopForm = document.querySelector('.workshop-form form');
    
    if (postWorkshopForm) {
        postWorkshopForm.addEventListener('submit', function (event) {
            const registrationLinkInput = document.querySelector('input[name="registrationLink"]');
            if (registrationLinkInput && registrationLinkInput.value) {
                // Simple validation for a URL format
                const urlPattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
                    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
                    '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
                    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
                    '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
                    '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
                if (!urlPattern.test(registrationLinkInput.value)) {
                    alert('Please enter a valid URL for the registration link.');
                    event.preventDefault(); // Prevent form submission
                }
            }
        });
    }
});





function displayWorkshopDetails(workshop) {
    const detailsContainer = document.getElementById('workshopDetails');
    
    // Clear existing content
    detailsContainer.innerHTML = '';

    // Add workshop title and description
    const title = document.createElement('h2');
    title.textContent = workshop.title;
    const description = document.createElement('p');
    description.textContent = workshop.description;
    detailsContainer.appendChild(title);
    detailsContainer.appendChild(description);

    // Check if there are any students signed up
    if (workshop.students && workshop.students.length > 0) {
        // Create a table for student details
        const table = document.createElement('table');
        table.innerHTML = `
            <tr>
                <th>Full Name</th>
                <th>Email</th>
                <th>Phone Number</th>
                <th>Major</th>
                <th>Year in Education</th>
            </tr>
        `;
        
        // Append a row for each student
        workshop.students.forEach(student => {
            const row = table.insertRow();
            row.innerHTML = `
                <td>${student.fullName}</td>
                <td>${student.email}</td>
                <td>${student.phoneNumber}</td>
                <td>${student.major}</td>
                <td>${student.yearInEducation}</td>
            `;
        });
        
        detailsContainer.appendChild(table);
    } else {
        // Display a message if no students have signed up yet
        const noStudentsMsg = document.createElement('p');
        noStudentsMsg.textContent = 'No students have signed up yet.';
        detailsContainer.appendChild(noStudentsMsg);
    }
}

function fetchWorkshopDetails(workshopId) {
    fetch(`/api/workshops/${workshopId}`)
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(workshop => {
        setTimeout(() => {
            displayWorkshopDetails(workshop);
        }, 2200); 
    })
    .catch(error => console.error('Error fetching workshop details:', error));
}