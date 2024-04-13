
document.addEventListener('DOMContentLoaded', function() {
var modal = document.getElementById('jobPostEdit-modal');
var form = document.getElementById('jobPostEdit-form');

// Event listeners for edit buttons
document.querySelectorAll('.edit-job-btn').forEach(item => {
    item.addEventListener('click', function(event) {
        event.preventDefault(); // Prevent default link action
        var postId = this.getAttribute('data-postId');
        console.log("Opening modal for post ID:", postId);
        modal.style.display = "block";
        form.action = "/edit-job-post/" + postId; // Set the form action dynamically
    });
});

// Close modal event listener
var span = document.getElementsByClassName("jobPostEdit-close")[0];
span.addEventListener('click', function() {
    modal.style.display = "none";
});

// Close modal if user clicks outside of it
window.addEventListener('click', function(event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
});
});








document.addEventListener('DOMContentLoaded', function() {
// Target edit buttons for job posts specifically
document.querySelectorAll('.edit-job-btn').forEach(item => {
    item.onclick = function() {
        // Prevent opening the wrong modal
        var editModal = document.getElementById('jobPostEdit-modal');

        // Open the job post edit modal specifically
        editModal.style.display = "block";

        // Populate the edit form as needed
        // Example for setting the job post ID
        var postId = this.getAttribute('data-postId');
        document.getElementById('jobPostEdit-id').value = postId;

        // Stop the event here to prevent triggering other modals
        return false;
    }
});

// Close functionality for the edit modal, adjust as needed
var span = document.getElementsByClassName("jobPostEdit-close")[0];
span.onclick = function() {
    var editModal = document.getElementById('jobPostEdit-modal');
    editModal.style.display = "none";
}

// Close the modal if the user clicks outside of it
window.onclick = function(event) {
    var editModal = document.getElementById('jobPostEdit-modal');
    if (event.target == editModal) {
        editModal.style.display = "none";
    }
}
});










    document.getElementById('jobPostForm').addEventListener('submit', function(e) {
        e.preventDefault(); // Prevent the default form submission action.
    
        // Gather the form data.
        const formData = new FormData(this);
        const jsonData = {};
        formData.forEach((value, key) => { jsonData[key] = value; });
    
        // Send the data using Fetch API.
        fetch('/job-posts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(jsonData),
        })
        .then(response => response.json())
        .then(data => {

            currentUserId =  '<%= user._id %>';
            console.log("Job posted successfully", data);

            const jobPostsList = document.querySelector('#jobPostsList'); // Ensure you have a container with this ID in your HTML.
            const newPostHtml = `
                <div class="job-post" data-id="${data._id}" >
                    <p>Posted by: ${data.username}</p>
                    <h3>${data.title}</h3>
                    <p>${data.description}</p>
                    <p>Requirements: ${data.requirements}</p>
                    <p>Company: ${data.company} - Location: ${data.location}</p>
                    ${data.applicationLink ? `<a href="${data.applicationLink}">Apply here</a>` : ''}
                    ${(currentUserId === data.postedBy.toString() || user.isAdmin) ? `<button class="delete-btn">Delete</button>` : ''}
                </div>
            `;
            jobPostsList.insertAdjacentHTML('beforeend', newPostHtml);

            this.reset();

        })
        .catch(error => {
            console.error("Error posting job:", error);
        });
    });







document.addEventListener('DOMContentLoaded', () => {
const jobPostsContainer = document.querySelector('#jobPostsList');

jobPostsContainer.addEventListener('click', function(e) {
    if (e.target.classList.contains('delete-btn')) {
        const jobPostDiv = e.target.closest('.job-post');
        const postId = jobPostDiv.getAttribute('data-id');

        fetch(`/job-posts/${postId}`, { method: 'DELETE' })
            .then(response => {
                if (response.ok) {
                    jobPostDiv.remove(); // Remove the job post from the page
                                    }
            })
            .catch(error => console.error('Error:', error));
    }
});
});




