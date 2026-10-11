/**
 * Cria (ou redefine a senha de) um administrador.
 *
 *   npm run admin:create -- --email voce@exemplo.com --name "Seu Nome" --role owner
 *
 * A senha é pedida no terminal (não aparece na tela nem no histórico).
 * Em CI é possível usar a variável ADMIN_PASSWORD.
 * Use --reset-password para trocar a senha de um administrador existente.
 */
import { createInterface } from "node:readline";
import { hashPassword } from "better-auth/crypto";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { adminUsers, authAccounts, authSessions } from "../src/db/schema";
import { connect, describeTarget, getArg, hasFlag } from "./_shared";

const MIN_PASSWORD_LENGTH = 12;

function promptHidden(question: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    const output = rl as unknown as { _writeToOutput: (text: string) => void; output: NodeJS.WriteStream };
    let muted = false;
    output._writeToOutput = (text: string) => {
      if (!muted) output.output.write(text);
    };
    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write("\n");
      resolve(answer);
    });
    muted = true;
  });
}

function validatePassword(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) return `A senha deve ter ao menos ${MIN_PASSWORD_LENGTH} caracteres.`;
  if (password.length > 128) return "A senha deve ter no máximo 128 caracteres.";
  if (!/[a-zA-Z]/.test(password) || !/\d/.test(password)) return "Use letras e números na senha.";
  return null;
}

async function main() {
  const email = z.email().safeParse(getArg("email")?.trim().toLowerCase());
  if (!email.success) {
    console.error('✖ Informe um e-mail válido: --email voce@exemplo.com');
    process.exit(1);
  }
  const name = getArg("name")?.trim() || email.data.split("@")[0]!;
  const role = getArg("role") ?? "owner";
  if (role !== "owner" && role !== "editor") {
    console.error('✖ --role deve ser "owner" ou "editor".');
    process.exit(1);
  }
  const reset = hasFlag("reset-password");

  let password = process.env.ADMIN_PASSWORD ?? "";
  if (!password) {
    password = await promptHidden("Senha: ");
    const confirmation = await promptHidden("Confirme a senha: ");
    if (password !== confirmation) {
      console.error("✖ As senhas não conferem.");
      process.exit(1);
    }
  }
  const problem = validatePassword(password);
  if (problem) {
    console.error(`✖ ${problem}`);
    process.exit(1);
  }

  const { url, db, close } = connect();
  console.log(`→ Banco: ${describeTarget(url)}`);
  const hash = await hashPassword(password);

  const [existing] = await db
    .select({ id: adminUsers.id })
    .from(adminUsers)
    .where(eq(sql`lower(${adminUsers.email})`, email.data))
    .limit(1);

  if (existing && !reset) {
    console.error("✖ Já existe um administrador com este e-mail. Use --reset-password para trocar a senha.");
    process.exit(1);
  }

  if (existing) {
    await db
      .update(authAccounts)
      .set({ password: hash })
      .where(and(eq(authAccounts.userId, existing.id), eq(authAccounts.providerId, "credential")));
    // Encerra sessões abertas após a troca de senha.
    await db.delete(authSessions).where(eq(authSessions.userId, existing.id));
    console.log(`✔ Senha redefinida para ${email.data}. Sessões anteriores foram encerradas.`);
  } else {
    const [user] = await db
      .insert(adminUsers)
      .values({ email: email.data, name, role, emailVerified: true })
      .returning({ id: adminUsers.id });
    await db.insert(authAccounts).values({
      userId: user!.id,
      accountId: user!.id,
      providerId: "credential",
      password: hash,
    });
    console.log(`✔ Administrador criado: ${email.data} (${role}).`);
  }
  await close();
}

main().catch((error) => {
  console.error("✖ Falha:", error instanceof Error ? error.message : error);
  process.exit(1);
});
