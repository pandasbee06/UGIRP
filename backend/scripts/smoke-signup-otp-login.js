const mysql = require("mysql2/promise");

async function run() {
  const email = `new${Date.now()}@example.com`;
  const password = "Flow@123";

  const signupRes = await fetch("http://localhost:5000/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fullName: "Flow User",
      email,
      mobile: "9999999999",
      aadhaar: "123412341234",
      role: "citizen",
      password,
    }),
  });
  const signupJson = await signupRes.json();
  console.log("signup_status", signupRes.status, signupJson.message);

  const conn = await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "Sangam@27",
    database: "ugirp",
  });
  const [rows] = await conn.query("SELECT otp_code FROM users WHERE email = ? LIMIT 1", [email]);
  await conn.end();
  const otp = rows?.[0]?.otp_code;
  console.log("otp_found", Boolean(otp));

  const verifyRes = await fetch("http://localhost:5000/api/auth/verify-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp }),
  });
  const verifyJson = await verifyRes.json();
  console.log("verify_status", verifyRes.status, Boolean(verifyJson.token));

  const loginRes = await fetch("http://localhost:5000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const loginJson = await loginRes.json();
  console.log("login_status", loginRes.status, Boolean(loginJson.token));
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

