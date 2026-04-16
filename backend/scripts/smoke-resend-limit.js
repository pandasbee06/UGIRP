const mysql = require("mysql2/promise");

async function run() {
  const email = `limit${Date.now()}@example.com`;

  await fetch("http://localhost:5000/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fullName: "Limit User",
      email,
      mobile: "9111111111",
      password: "Flow@123",
      role: "citizen",
      aadhaar: "111122223333",
    }),
  });

  let lastStatus = 0;
  let lastMsg = "";
  for (let i = 1; i <= 6; i += 1) {
    const r = await fetch("http://localhost:5000/api/auth/resend-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const j = await r.json();
    lastStatus = r.status;
    lastMsg = j.message || "";
    console.log("attempt", i, "status", r.status, "message", lastMsg);
  }

  const conn = await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "Sangam@27",
    database: "ugirp",
  });
  const [rows] = await conn.query(
    "SELECT COUNT(*) as c FROM otp_resend_attempts WHERE user_id = (SELECT id FROM users WHERE email = ? LIMIT 1)",
    [email]
  );
  await conn.end();
  console.log("stored_attempts", rows?.[0]?.c);
  console.log("final_status", lastStatus, "final_message", lastMsg);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

