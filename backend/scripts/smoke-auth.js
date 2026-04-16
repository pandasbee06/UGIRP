async function run() {
  const email = `user${Date.now()}@example.com`;
  const password = "Test@12345";
  const name = "UGIRP Test User";

  const regRes = await fetch("http://localhost:5000/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });
  const regJson = await regRes.json();
  console.log("register_status", regRes.status);
  console.log("register_has_token", Boolean(regJson.token));

  const loginRes = await fetch("http://localhost:5000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const loginJson = await loginRes.json();
  console.log("login_status", loginRes.status);
  console.log("login_has_token", Boolean(loginJson.token));
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

