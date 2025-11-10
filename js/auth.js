// Backend Base URL - automatically detects production vs local
const API_BASE = window.location.origin;

document.addEventListener("DOMContentLoaded", () => {
  const signupBtn = document.getElementById("signupBtn");
  const loginBtn = document.getElementById("loginBtn");

  // --- SIGNUP ---
  if (signupBtn) {
    signupBtn.addEventListener("click", async () => {
  const full_name = document.getElementById("full_name").value.trim();
  const email = document.getElementById("email").value.trim();
  const phone = (document.getElementById("phone") && document.getElementById("phone").value.trim()) || null;
  const password = document.getElementById("password").value.trim();

      if (!full_name || !email || !password) {
        alert("Please fill all required fields!");
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/api/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ full_name, email, phone, password }),
        });

        const data = await res.json();
        
        if (res.ok) {
          alert(data.message || "Signup successful!");
          // Redirect to login page
          window.location.href = "login.html";
        } else {
          alert(data.message || "Signup failed");
        }
      } catch (err) {
        console.error("Signup error:", err);
        alert("Signup failed — check console for details");
      }
    });
  }

  // --- LOGIN ---
  if (loginBtn) {
    loginBtn.addEventListener("click", async () => {
      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value.trim();

      if (!email || !password) {
        alert("Please enter both email and password!");
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/api/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, password }),
        });

        const data = await res.json();
        
        if (res.ok) {
          alert(data.message || "Login successful");
          // Server session cookie created; redirect to index
          window.location.href = "index.html";
        } else {
          // Check if email is not verified
          if (data.emailVerified === false && data.canResend) {
            alert(data.message);
            // Show resend verification section
            const resendSection = document.getElementById("resendSection");
            if (resendSection) {
              resendSection.style.display = "block";
              // Store email for resend
              resendSection.dataset.email = email;
            }
          } else {
            alert(data.message || "Login failed");
          }
        }
      } catch (err) {
        console.error("Login error:", err);
        alert("Login failed — check console for details");
      }
    });
  }

  // --- RESEND VERIFICATION EMAIL ---
  const resendBtn = document.getElementById("resendBtn");
  if (resendBtn) {
    resendBtn.addEventListener("click", async () => {
      const resendSection = document.getElementById("resendSection");
      const email = resendSection?.dataset.email || document.getElementById("email").value.trim();
      
      if (!email) {
        alert("Please enter your email first");
        return;
      }

      resendBtn.disabled = true;
      resendBtn.textContent = "Sending...";

      try {
        const res = await fetch(`${API_BASE}/api/resend-verification`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });

        const data = await res.json();
        
        if (res.ok) {
          alert(data.message || "Verification email sent!");
          resendSection.style.display = "none";
        } else {
          alert(data.message || "Failed to resend email");
        }
      } catch (err) {
        console.error("Resend error:", err);
        alert("Failed to resend verification email");
      } finally {
        resendBtn.disabled = false;
        resendBtn.textContent = "Resend Verification Email";
      }
    });
  }
});

