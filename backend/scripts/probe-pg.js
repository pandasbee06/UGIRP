const { Client } = require("pg");

const tries = [
  // User-provided combinations
  { user: "Sangam27", password: "Sangam@27", database: "postgres" },
  { user: "Sangam27", password: "Sangam@27", database: "ugirp" },
  { user: "sangam27", password: "Sangam@27", database: "postgres" },
  { user: "sangam27", password: "Sangam@27", database: "ugirp" },

  // Common local defaults
  { user: "postgres", password: "Sangam@27", database: "postgres" },
  { user: "postgres", password: "postgres", database: "postgres" },
  { user: "postgres", password: "1234", database: "postgres" },
  { user: "postgres", password: "password", database: "postgres" },
  { user: "postgres", password: "", database: "postgres" },
  { user: "postgres", password: "", database: "ugirp" },

  // Potential machine/user-based roles
  { user: "adity", password: "Sangam@27", database: "postgres" },
  { user: "adity", password: "Sangam@27", database: "ugirp" },
  { user: "aditya", password: "Sangam@27", database: "postgres" },
  { user: "aditya", password: "Sangam@27", database: "ugirp" },
];

async function run() {
  for (const t of tries) {
    const auth = t.password ? `${t.user}:${encodeURIComponent(t.password)}` : t.user;
    const connectionString = `postgres://${auth}@127.0.0.1:5432/${t.database}`;
    const client = new Client({
      connectionString,
      ssl: false,
      connectionTimeoutMillis: 2500,
    });
    try {
      await client.connect();
      console.log(`OK ${connectionString}`);
      await client.end();
      process.exit(0);
    } catch (error) {
      console.log(`FAIL ${connectionString} ${(error && error.code) || error.message}`);
      try {
        await client.end();
      } catch {
        // no-op
      }
    }
  }
  process.exit(1);
}

run();

