const mysql = require("mysql2/promise");

async function run() {
  const email = `otp${Date.now()}@example.com`;

  await fetch("http://localhost:5000/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fullName: "OTP User",
      email,
      mobile: "9000000000",
      password: "Flow@123",
      role: "citizen",
      aadhaar: "123456789012",
    }),
  });

  const conn = await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "Sangam@27",
    database: "ugirp",
  });
  const [firstRows] = await conn.query("SELECT otp_code FROM users WHERE email = ? LIMIT 1", [email]);
  const firstOtp = firstRows?.[0]?.otp_code;

  const resendRes = await fetch("http://localhost:5000/api/auth/resend-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const resendJson = await resendRes.json();
  console.log("resend_status", resendRes.status, resendJson.message);

  const [secondRows] = await conn.query("SELECT otp_code FROM users WHERE email = ? LIMIT 1", [email]);
  await conn.end();
  const secondOtp = secondRows?.[0]?.otp_code;
  console.log("otp_changed", Boolean(firstOtp && secondOtp && firstOtp !== secondOtp));
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

