


const doc = document;
const menuOpen = doc.querySelector(".nav-menu");
const menuClose = doc.querySelector(".close");
const overlay = doc.querySelector(".overlay");

menuOpen.addEventListener("click", () => {
  overlay.classList.add("overlay--active");
});

menuClose.addEventListener("click", () => {
  overlay.classList.remove("overlay--active");
});



async function searchUser(event) {
  if (event.key === "Enter") {
    event.preventDefault(); // Prevent form submission or any default action
    const username = event.target.value.trim();
    if (username) {

      try {


        const response = await fetch(`/users/${username}`);
        if (response.ok) {
          window.location.href = `/users/${username}`;
        } else {
// User not found, show the modal
const modal = document.getElementById("userNotFoundModal");
const span = document.getElementsByClassName("close-button")[0];

modal.style.display = "block";

span.onclick = function() {
  modal.style.display = "none";
}

window.onclick = function(event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
}
        }
        
      } catch (error) {
        console.error("Error checking user:", error);
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: "Something went wrong!",
          footer: '<a href="#">Why do I have this issue?</a>'
        });

    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("yourSearchInputId"); // Make sure to replace this with your actual search input ID
  searchInput.addEventListener("keypress", searchUser);
});}



