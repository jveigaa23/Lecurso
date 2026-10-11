import { sql } from "drizzle-orm";
import { getDb } from "@/db";

export async function resetContent() {
  await getDb().execute(
    sql`truncate table orders, testimonials, courses, categories, site_settings, auth_sessions, auth_accounts, auth_verifications, auth_rate_limits, admin_users restart identity cascade`,
  );
}
