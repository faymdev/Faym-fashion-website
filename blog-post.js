const commentsKey = "blog_comments_" + window.location.pathname;

// Load comments on page load
document.addEventListener("DOMContentLoaded", loadComments);

function loadComments() {
  const saved = JSON.parse(localStorage.getItem(commentsKey)) || [];
  const list = document.getElementById("commentsList");
  list.innerHTML = "";

  saved.forEach(c => {
    list.innerHTML += `
      <div class="comment-box">
        <div class="comment-name">${c.name}</div>
        <div class="comment-message">${c.message}</div>
        <div class="comment-time">${c.time}</div>
      </div>
    `;
  });
}

// Handle comment submit
document.getElementById("commentForm").addEventListener("submit", function(e) {
  e.preventDefault();

  const name = document.getElementById("commentName").value;
  const message = document.getElementById("commentMessage").value;

  const newComment = {
    name,
    message,
    time: new Date().toLocaleString()
  };

  // Save locally
  const existing = JSON.parse(localStorage.getItem(commentsKey)) || [];
  existing.push(newComment);
  localStorage.setItem(commentsKey, JSON.stringify(existing));

  // clear inputs
  document.getElementById("commentForm").reset();

  // Reload comment list
  loadComments();
});


// comment succes
document.getElementById("commentForm").addEventListener("submit", function(e) {
    e.preventDefault();

    const name = document.getElementById("commentName").value.trim();
    const msg = document.getElementById("commentMessage").value.trim();
    const success = document.getElementById("commentSuccess");

    if (!name || !msg) return;

    // Load existing comments
    const postId = new URLSearchParams(window.location.search).get("id") || "0";
    let comments = JSON.parse(localStorage.getItem("comments_" + postId)) || [];

    // Save new comment
    comments.push({ name, msg });
    localStorage.setItem("comments_" + postId, JSON.stringify(comments));

    // Clear fields
    document.getElementById("commentName").value = "";
    document.getElementById("commentMessage").value = "";

    // Reload comments
    loadComments();

    // ✔ Show success message
    success.style.display = "block";

    setTimeout(() => {
        success.style.display = "none";
    }, 2000);
});
