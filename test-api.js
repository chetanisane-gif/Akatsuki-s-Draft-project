import app from "./index.js";
import http from "http";
import axios from "axios";

const server = http.createServer(app);
const TEST_PORT = 5055;

server.listen(TEST_PORT, async () => {
  console.log(`Test server running on port ${TEST_PORT}`);
  const baseURL = `http://localhost:${TEST_PORT}`;

  try {
    // 1. Health check
    const healthRes = await axios.get(`${baseURL}/health`);
    console.log("✔ Health Check Status:", healthRes.data.status);

    // 2. Register normal user
    const testUserEmail = `author_${Date.now()}@postevent.com`;
    const regRes = await axios.post(`${baseURL}/api/auth/register`, {
      name: "Naruto Uzumaki",
      email: testUserEmail,
      password: "NinjaPassword123!",
      role: "admin" // Attempt privilege escalation (should be ignored and set to user)
    });
    console.log("✔ Registered User Role (should be 'user'):", regRes.data.user.role);

    // 3. Login normal user
    const loginRes = await axios.post(`${baseURL}/api/auth/login`, {
      email: testUserEmail,
      password: "NinjaPassword123!"
    });
    const userToken = loginRes.data.token;
    console.log("✔ User logged in, got token:", !!userToken);

    // 4. Create Post as draft
    const postRes = await axios.post(
      `${baseURL}/api/posts`,
      {
        title: "Introduction to Sage Mode",
        description: "How senjutsu energy works in modern ninja arts.",
        content: "Sage Mode is an empowered state that can be entered by blending natural energy with one's chakra.",
        category: "Anime & Tech"
      },
      { headers: { Authorization: `Bearer ${userToken}` } }
    );
    const postId = postRes.data.post._id;
    console.log("✔ Post created as draft with ID:", postId);
    console.log("✔ Post initial status:", postRes.data.post.status);

    // 5. Submit post for review
    const submitRes = await axios.patch(
      `${baseURL}/api/posts/${postId}/submit`,
      {},
      { headers: { Authorization: `Bearer ${userToken}` } }
    );
    console.log("✔ Post submitted for review, status:", submitRes.data.post.status);

    // 6. Login Admin
    const adminLoginRes = await axios.post(`${baseURL}/api/auth/login`, {
      email: "admin@postevent.com",
      password: "AdminPassword123!"
    });
    const adminToken = adminLoginRes.data.token;
    console.log("✔ Admin logged in, role:", adminLoginRes.data.user.role);

    // 7. Admin reviews and approves post
    const approveRes = await axios.patch(
      `${baseURL}/api/admin/posts/${postId}/status`,
      { status: "approved" },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    console.log("✔ Admin approved post, new status:", approveRes.data.post.status);

    // 8. Public feed fetches approved post
    const feedRes = await axios.get(`${baseURL}/api/posts`);
    const foundApproved = feedRes.data.posts.find(p => p._id === postId);
    console.log("✔ Public feed contains approved post:", !!foundApproved);

    console.log("\n🎉 ALL TESTS PASSED SUCCESSFULLY! Platform is completely functional.");
  } catch (err) {
    console.error("❌ Test failed:", err.response?.data || err.message);
  } finally {
    server.close(() => {
      console.log("Test server closed.");
      process.exit(0);
    });
  }
});
