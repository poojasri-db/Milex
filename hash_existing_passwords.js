const db = require("./db");
const bcrypt = require("bcrypt");

async function migratePasswords() {
    try {
        const [users] = await db.query(
            "SELECT USER_ID, USER_PASSWORD FROM m_user"
        );

        let updated = 0;
        let skipped = 0;

        for (const user of users) {

            const password = user.USER_PASSWORD;

            if (!password) {
                skipped++;
                continue;
            }

            // Avoid hashing an existing bcrypt hash again
            if (/^\$2[aby]\$\d{2}\$/.test(password)) {
                skipped++;
                continue;
            }

            const hashedPassword = await bcrypt.hash(password, 12);

            await db.query(
                `UPDATE m_user
                 SET USER_PASSWORD = ?
                 WHERE USER_ID = ?`,
                [hashedPassword, user.USER_ID]
            );

            updated++;
        }

        console.log("Password migration completed");
        console.log("Updated:", updated);
        console.log("Skipped:", skipped);

    } catch (error) {
        console.error("Migration failed:", error.message);
    } finally {
        await db.end();
    }
}

migratePasswords();