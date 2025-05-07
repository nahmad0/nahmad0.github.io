document.addEventListener("DOMContentLoaded", () => {
    // Handle hamburger menu
    const hamburger = document.querySelector('.hamburger');
    const nav = document.querySelector('header nav');
    if (hamburger) {
        hamburger.addEventListener('click', () => {
            nav.classList.toggle('active');
        });
    }

    // Load news if on news.html
    const newsSection = document.querySelector(".basic-content");
    if (newsSection && document.title.includes("News")) {
        fetch("https://news-api-proxy-six.vercel.app/news")
            .then(res => res.json())
            .then(data => {
                console.log(data);  
                const articles = data.articles;
                let html = '<h1>Latest Cybersecurity News</h1>';

                articles.forEach(article => {
                  // Safely remove the '[+1234 chars]' if it appears in content
                    const cleanedContent = (article.content || 'No content available.').replace(/\[\+\d+\schars\]/g, '');

                    html += `
                        <section class="basic-section">
                            <h2>📰 ${article.title}</h2>
                            <p><strong>Source:</strong> ${article.source.name}</p>
                            <p><strong>Published:</strong> ${new Date(article.publishedAt).toLocaleDateString()}</p>
                            <p><strong>Author:</strong> ${article.author || 'Unknown'}</p>
                            ${article.urlToImage ? `<img src="${article.urlToImage}" alt="${article.title}" style="width:100%; height:auto; max-width:600px; margin: 10px 0;">` : ''}
                            <p>${article.description || 'No description available.'}</p>
                            <p>${cleanedContent || 'No content available.'}</p>
                            <a href="${article.url}" target="_blank">Read more</a>
                        </section>
                    `;
                });

                newsSection.innerHTML = html;
            })
            .catch(err => {
                console.error("Error fetching news:", err);
                newsSection.innerHTML = "<p>Failed to load news. Please try again later.</p>";
            });
    }
});

// Handle form submission and verification
// Check if the form and verification section exist before adding event listeners
const form = document.getElementById("signup-form");
const emailInput = document.getElementById("email-input");
const nameInput = document.getElementById("name-input");
const roleInput = document.getElementById("role-input");
const messageInput = document.getElementById("message-input");
const messageBox = document.getElementById("signup-message");

const verifySection = document.getElementById("verify-section");
const verifyInput = document.getElementById("verification-code");
const verifyButton = document.getElementById("verify-button");
const verifyMessage = document.getElementById("verify-message");

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const data = {
      name: nameInput.value,
      email: emailInput.value,
      role: roleInput.value,
      message: messageInput.value
    };

    try {
      const res = await fetch("https://news-api-proxy-glax.vercel.app/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      const result = await res.json();
      if (res.ok) {
        // Save values in localStorage for verify step
        localStorage.setItem("verificationEmail", data.email);
        localStorage.setItem("verificationName", data.name);
        localStorage.setItem("verificationRole", data.role);
        localStorage.setItem("verificationMessage", data.message);
        localStorage.setItem("verificationCodeTime", Date.now().toString());

        messageBox.textContent = result.message;
        messageBox.style.color = "lightgreen";
        verifySection.style.display = "block";
      } else {
        messageBox.textContent = result.error || "Something went wrong.";
        messageBox.style.color = "orange";
      }
    } catch (err) {
      console.error("Fetch failed:", err);
      messageBox.textContent = "Server error. Please try again.";
      messageBox.style.color = "red";
    }
  });
}

if (verifyButton) {
  verifyButton.addEventListener("click", async () => {
    const code = verifyInput.value;

    const email = localStorage.getItem("verificationEmail");
    const name = localStorage.getItem("verificationName");
    const role = localStorage.getItem("verificationRole");
    const message = localStorage.getItem("verificationMessage");
    const codeTime = parseInt(localStorage.getItem("verificationCodeTime"));
    const now = Date.now();
    const diffMinutes = (now - codeTime) / (1000 * 60);

    // ❌ Code expired
    if (diffMinutes > 10) {
      verifyMessage.textContent = "Code has expired. Please sign up again.";
      verifyMessage.style.color = "red";
      localStorage.clear(); // optional full clear
      return;
    }

    try {
      const res = await fetch("https://news-api-proxy-glax.vercel.app/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, name, role, message })
      });

      const result = await res.json();
      if (res.ok) {
        verifyMessage.textContent = result.message;
        verifyMessage.style.color = "lightgreen";
        form.reset();
        verifySection.style.display = "none";

        // Clear localStorage after success
        localStorage.clear();
      } else {
        verifyMessage.textContent = result.error || "Invalid code.";
        verifyMessage.style.color = "orange";
      }
    } catch (err) {
      console.error("Verification failed:", err);
      verifyMessage.textContent = "Server error. Try again.";
      verifyMessage.style.color = "red";
    }
  });
}


// Define the function that switches between tabs
function opentab(tabName, event) {
  // Get all elements with class "tab-contents" and hide them
  const tabContents = document.querySelectorAll(".tab-contents");
  tabContents.forEach(content => {
      content.classList.remove("active-tab"); // Remove active class to hide
  });

  // Get all elements with class "tab-links" and remove the active highlight
  const tabLinks = document.querySelectorAll(".tab-links");
  tabLinks.forEach(link => {
      link.classList.remove("active-link"); // Remove active class from all buttons
  });

  // Show the selected tab content by adding the active class
  document.getElementById(tabName).classList.add("active-tab");

  // Highlight the clicked button (add the active class)
  event.currentTarget.classList.add("active-link");
}


//IP chekcer


document.getElementById('ip-check-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const ip = document.getElementById('ip-input').value.trim();
  const messageBox = document.getElementById('ip-check-message');
  const resultBox = document.getElementById('ip-result');

  // Reset UI
  messageBox.textContent = '';
  resultBox.classList.add('hidden');

  if (!ip) {
      messageBox.textContent = '⚠️ Please enter a valid IP address.';
      return;
  }

  messageBox.textContent = '🔄 Checking...';

  try {
      const res = await fetch(`https://ipapi.co/${ip}/json/`);
      const data = await res.json();

      if (data.error) {
          messageBox.textContent = `❌ Error: ${data.reason}`;
          return;
      }

      // Fill in results
      document.getElementById('result-ip').textContent = data.ip || 'N/A';
      document.getElementById('result-country').textContent = data.country_name || 'N/A';
      document.getElementById('result-region').textContent = data.region || 'N/A';
      document.getElementById('result-city').textContent = data.city || 'N/A';
      document.getElementById('result-isp').textContent = data.org || 'N/A';
      document.getElementById('result-reputation').textContent = 'Basic lookup - reputation not checked yet';

      resultBox.classList.remove('hidden');
      messageBox.textContent = '';
  } catch (err) {
      console.error(err);
      messageBox.textContent = '❌ Failed to fetch IP data. Please try again.';
  }
});

