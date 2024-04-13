function displayJobPostDetails(jobPost) {
    const detailsContainer = document.getElementById('jobDetails');
    
    // Clear existing content
    detailsContainer.innerHTML = '';

    // Add job post title and description
    const title = document.createElement('h2');
    title.textContent = jobPost.title;
    const description = document.createElement('p');
    description.textContent = jobPost.description;
    detailsContainer.appendChild(title);
    detailsContainer.appendChild(description);

    // Check if there are any applicants
    if (jobPost.applicants && jobPost.applicants.length > 0) {
        // Create a table for applicant details
        const table = document.createElement('table');
        table.innerHTML = `
            <tr>
                <th>Full Name</th>
                <th>Email</th>
                <th>Phone Number</th>
                <th>Is Studying</th>
                <th>Years of Experience</th>
                <th>Your City</th>
            </tr>
        `;
        
        // Append a row for each applicant
        jobPost.applicants.forEach(applicant => {
            const row = table.insertRow();
            row.innerHTML = `
                <td>${applicant.fullName}</td>
                <td>${applicant.email}</td>
                <td>${applicant.phoneNumber}</td>
                <td>${applicant.isStudying ? 'Yes' : 'No'}</td>
                <td>${applicant.yearsOfExperience}</td>
                <td>${applicant.yourCity}</td>
            `;
        });
        
        detailsContainer.appendChild(table);
    } else {
        // Display a message if no applicants have applied yet
        const noApplicantsMsg = document.createElement('p');
        noApplicantsMsg.textContent = 'No applicants have applied yet.';
        detailsContainer.appendChild(noApplicantsMsg);
    }
}

function fetchJobPostDetails(jobPostId) {
    fetch(`/api/job-posts/${jobPostId}`)
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(jobPost => {
        setTimeout(() => {
            displayJobPostDetails(jobPost);
        }, 2200); // Simulating network delay for demonstration
    })
    .catch(error => console.error('Error fetching job post details:', error));
}
