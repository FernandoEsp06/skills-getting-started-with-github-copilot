document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        // Ensure participants array exists
        const participants = details.participants || [];
        const spotsLeft = details.max_participants - participants.length;

        // Create participants list HTML with remove buttons
        let participantsHTML = "<ul class='participants-list'>";
        if (participants.length > 0) {
          participants.forEach((participant) => {
            participantsHTML += `<li data-email="${participant}">${participant} <button class="remove-btn" data-activity="${name}" data-email="${participant}">&times;</button></li>`;
          });
        } else {
          participantsHTML += "<li class='no-participants'>No participants yet</li>";
        }
        participantsHTML += "</ul>";

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-section" style="background-color:#e3f2fd;border:1px solid #90caf9;padding:16px;border-radius:8px;box-shadow:inset 0 1px 3px rgba(0,0,0,0.05);margin-top:15px;">
            <h5 class="participants-title" style="color:#1a237e;font-size:15px;margin-bottom:10px;font-weight:600;">Participants</h5>
            ${participantsHTML}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // attach removal handler via delegation
  activitiesList.addEventListener('click', async (evt) => {
    if (evt.target.classList.contains('remove-btn')) {
      const activity = evt.target.getAttribute('data-activity');
      const email = evt.target.getAttribute('data-email');
      try {
        const resp = await fetch(`/activities/${encodeURIComponent(activity)}/participants?email=${encodeURIComponent(email)}`, { method: 'DELETE' });
        if (resp.ok) {
          fetchActivities(); // refresh list
        } else {
          const err = await resp.json();
          alert(err.detail || 'Failed to remove');
        }
      } catch (err) {
        console.error('remove error', err);
      }
    }
  });

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // refresh activities to show new participant immediately
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
