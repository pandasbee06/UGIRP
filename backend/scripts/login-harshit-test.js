async function run() {
  const res = await fetch("http://localhost:5000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "harshitgaokar@gmail.com",
      password: "Harshit@123",
    }),
  });
  const body = await res.json();
  console.log("status", res.status);
  console.log("hasToken", Boolean(body.token));
  console.log("userEmail", body.user?.email);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

