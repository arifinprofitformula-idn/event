import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const releaseDir = join(root, "release");
const releaseConfigPath = join(releaseDir, "api", "config.php");
let existingReleaseConfig = null;

if (existsSync(releaseConfigPath)) {
  existingReleaseConfig = await readFile(releaseConfigPath, "utf8");
}

await rm(releaseDir, { recursive: true, force: true });
await mkdir(releaseDir, { recursive: true });

if (!existsSync(join(root, "dist", "index.html"))) {
  throw new Error("dist/index.html not found. Run npm run build first.");
}

await cp(join(root, "dist"), releaseDir, { recursive: true });
await cp(join(root, "api"), join(releaseDir, "api"), { recursive: true });
await cp(join(root, "scripts", "release.htaccess"), join(releaseDir, ".htaccess"));
await cp(join(root, "docs", "mysql-schema.sql"), join(releaseDir, "mysql-schema.sql"));

if (existingReleaseConfig !== null) {
  await writeFile(releaseConfigPath, existingReleaseConfig);
}

await writeFile(join(releaseDir, "INSTALL.txt"), `Event Manager PHP/MySQL Install

1. Upload all files in this release folder to the subdomain document root.
2. Create a MySQL database and user in cPanel.
3. Copy api/config.example.php to api/config.php.
4. Edit api/config.php with database credentials and initial admin login.
5. Open https://your-domain/api/auth/session.
   Expected before login: {"session":null}
6. Open https://your-domain/ and login with the admin credentials from config.php.

Do not leave admin_password weak. After first login, create a new admin user and rotate credentials.
`);

console.log(`Release prepared at ${releaseDir}`);
if (existingReleaseConfig !== null) {
  console.log("Preserved release/api/config.php");
}
