import { hashPassword } from "better-auth/crypto";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getDb } from "@/db";
import { adminUsers, authAccounts, courses, testimonials } from "@/db/schema";
import { resetContent } from "../support/db";

// --- Mocks mínimos do runtime do Next (fora do servidor Next) ---
const runtime = vi.hoisted(() => ({ headers: new Headers() }));
vi.mock("next/headers", () => ({
  headers: async () => runtime.headers,
  cookies: async () => ({ get: () => undefined, getAll: () => [], set: () => {}, delete: () => {}, has: () => false }),
}));
vi.mock("next/cache", () => ({ updateTag: vi.fn(), revalidateTag: vi.fn(), cacheLife: vi.fn(), cacheTag: vi.fn() }));

const { getAuth } = await import("@/lib/auth");
const actions = await import("@/server/actions/admin");
const { initialActionState } = await import("@/lib/validation/common");

const ORIGIN = "http://localhost:3000";
const PASSWORD = "SenhaForte12345";
let ipCounter = 0;

async function createAdmin(email: string, role: "owner" | "editor") {
  const db = getDb();
  const [user] = await db.insert(adminUsers).values({ email, name: role, role, emailVerified: true }).returning();
  await db.insert(authAccounts).values({
    userId: user!.id,
    accountId: user!.id,
    providerId: "credential",
    password: await hashPassword(PASSWORD),
  });
  return user!;
}

async function authRequest(path: string, body: unknown, init: { origin?: string; ip?: string; cookie?: string } = {}) {
  return getAuth().handler(
    new Request(`${ORIGIN}/api/auth${path}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: init.origin ?? ORIGIN,
        "x-forwarded-for": init.ip ?? `10.0.0.${++ipCounter}`,
        ...(init.cookie ? { cookie: init.cookie } : {}),
      },
      body: JSON.stringify(body),
    }),
  );
}

async function signIn(email: string): Promise<string> {
  const response = await authRequest("/sign-in/email", { email, password: PASSWORD });
  expect(response.status).toBe(200);
  const setCookies = response.headers.getSetCookie();
  return setCookies.map((cookie) => cookie.split(";")[0]).join("; ");
}

function useSession(cookie: string | null) {
  runtime.headers = new Headers(cookie ? { cookie } : {});
}

function courseFormData(fields: Record<string, string> = {}) {
  const data = new FormData();
  const values: Record<string, string> = {
    title: "Curso via painel",
    shortDescription: "Resumo",
    level: "todos",
    format: "",
    currency: "BRL",
    curriculum: "[]",
    faq: "[]",
    ...fields,
  };
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

async function expectRedirect(promise: Promise<unknown>, target: string) {
  const error = await promise.then(
    () => null,
    (err: unknown) => err as { digest?: string },
  );
  expect(error?.digest).toContain("NEXT_REDIRECT");
  expect(error?.digest).toContain(target);
}

beforeEach(async () => {
  await resetContent();
  useSession(null);
});

describe("autenticação", () => {
  it("login válido gera cookie de sessão HttpOnly e SameSite=Lax", async () => {
    await createAdmin("dono@exemplo.com", "owner");
    const response = await authRequest("/sign-in/email", { email: "dono@exemplo.com", password: PASSWORD });
    expect(response.status).toBe(200);
    const sessionCookie = response.headers.getSetCookie().find((c) => c.startsWith("lecurso.session_token="));
    expect(sessionCookie).toBeDefined();
    expect(sessionCookie).toMatch(/HttpOnly/i);
    expect(sessionCookie).toMatch(/SameSite=Lax/i);
    // A resposta não expõe a senha nem o hash.
    expect(await response.text()).not.toMatch(/password|scrypt/i);
  });

  it("senha errada e e-mail inexistente recebem a mesma resposta", async () => {
    await createAdmin("dono@exemplo.com", "owner");
    const wrong = await authRequest("/sign-in/email", { email: "dono@exemplo.com", password: "errada123456" });
    const missing = await authRequest("/sign-in/email", { email: "ninguem@exemplo.com", password: "errada123456" });
    expect(wrong.status).toBe(401);
    expect(missing.status).toBe(401);
    expect((await wrong.json()).message).toBe((await missing.json()).message);
  });

  it("bloqueia tentativas excessivas de login (rate limit)", async () => {
    await createAdmin("dono@exemplo.com", "owner");
    const ip = "203.0.113.50";
    const statuses: number[] = [];
    for (let i = 0; i < 7; i++) {
      const response = await authRequest("/sign-in/email", { email: "dono@exemplo.com", password: "errada123456" }, { ip });
      statuses.push(response.status);
    }
    expect(statuses.slice(0, 5).every((status) => status === 401)).toBe(true);
    expect(statuses.at(-1)).toBe(429);
  });

  it("cadastro público está desabilitado", async () => {
    const response = await authRequest("/sign-up/email", { email: "intruso@exemplo.com", password: PASSWORD, name: "X" });
    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(await getDb().select().from(adminUsers)).toHaveLength(0);
  });

  it("recusa login vindo de outra origem (CSRF)", async () => {
    await createAdmin("dono@exemplo.com", "owner");
    const response = await authRequest(
      "/sign-in/email",
      { email: "dono@exemplo.com", password: PASSWORD },
      { origin: "https://site-malicioso.com" },
    );
    expect(response.status).toBe(403);
  });

  it("logout invalida a sessão no servidor", async () => {
    await createAdmin("dono@exemplo.com", "owner");
    const cookie = await signIn("dono@exemplo.com");
    useSession(cookie);
    const { getAdminSession } = await import("@/lib/session");
    expect(await getAdminSession()).not.toBeNull();
    const response = await authRequest("/sign-out", {}, { cookie });
    expect(response.status).toBe(200);
    expect(await getAdminSession()).toBeNull();
  });
});

describe("autorização das server actions", () => {
  it("visitante anônimo é redirecionado e nada é gravado", async () => {
    await expectRedirect(actions.saveCourseAction(initialActionState, courseFormData()), "/admin/login");
    await expectRedirect(actions.saveBrandSettingsAction(initialActionState, new FormData()), "/admin/login");
    expect(await getDb().select().from(courses)).toHaveLength(0);
  });

  it("cookie de sessão forjado não é aceito", async () => {
    useSession("lecurso.session_token=forjado.assinatura-invalida");
    await expectRedirect(actions.saveCourseAction(initialActionState, courseFormData()), "/admin/login");
  });

  it("administrador cria, edita, publica e exclui curso", async () => {
    await createAdmin("dono@exemplo.com", "owner");
    useSession(await signIn("dono@exemplo.com"));

    await expectRedirect(actions.saveCourseAction(initialActionState, courseFormData()), "/admin/cursos/");
    const [created] = await getDb().select().from(courses);
    expect(created).toMatchObject({ title: "Curso via painel", slug: "curso-via-painel", isPublished: false });

    const update = await actions.saveCourseAction(
      initialActionState,
      courseFormData({ id: created!.id, title: "Editado", slug: "editado", price: "150", isPublished: "on" }),
    );
    expect(update.status).toBe("success");

    const toggle = new FormData();
    toggle.set("id", created!.id);
    toggle.set("publish", "false");
    expect((await actions.toggleCoursePublishedAction(initialActionState, toggle)).status).toBe("success");
    const [afterToggle] = await getDb().select().from(courses);
    expect(afterToggle).toMatchObject({ title: "Editado", priceCents: 15000, isPublished: false });

    const remove = new FormData();
    remove.set("id", created!.id);
    remove.set("confirm", "excluir");
    expect((await actions.deleteCourseAction(initialActionState, remove)).status).toBe("error");
    remove.set("confirm", "EXCLUIR");
    await expectRedirect(actions.deleteCourseAction(initialActionState, remove), "/admin/cursos");
    expect(await getDb().select().from(courses)).toHaveLength(0);
  });

  it("dados inválidos retornam erros por campo sem gravar", async () => {
    await createAdmin("dono@exemplo.com", "owner");
    useSession(await signIn("dono@exemplo.com"));
    const result = await actions.saveCourseAction(
      initialActionState,
      courseFormData({ title: "", purchaseUrl: "https://golpe.com/pix", price: "abc", curriculum: "{quebrado" }),
    );
    expect(result.status).toBe("error");
    expect(Object.keys(result.fieldErrors ?? {})).toEqual(expect.arrayContaining(["title", "purchaseUrl", "price", "curriculum"]));
    expect(await getDb().select().from(courses)).toHaveLength(0);

    const badId = courseFormData({ id: "1 OR 1=1" });
    expect((await actions.saveCourseAction(initialActionState, badId)).message).toBe("Curso inválido.");
  });

  it("editor não pode excluir conteúdo", async () => {
    await createAdmin("editor@exemplo.com", "editor");
    useSession(await signIn("editor@exemplo.com"));
    const [course] = await getDb().insert(courses).values({ title: "Fixo", slug: "fixo" }).returning();
    const remove = new FormData();
    remove.set("id", course!.id);
    remove.set("confirm", "EXCLUIR");
    const result = await actions.deleteCourseAction(initialActionState, remove);
    expect(result).toMatchObject({ status: "error", message: "Apenas o proprietário pode excluir conteúdo." });
    expect(await getDb().select().from(courses).where(eq(courses.id, course!.id))).toHaveLength(1);
  });

  it("depoimento só é publicado com autorização", async () => {
    await createAdmin("dono@exemplo.com", "owner");
    useSession(await signIn("dono@exemplo.com"));
    const data = new FormData();
    data.set("authorName", "Aluno");
    data.set("content", "Aprendi muito.");
    data.set("courseId", "");
    data.set("isPublished", "on");
    const denied = await actions.saveTestimonialAction(initialActionState, data);
    expect(denied.fieldErrors?.consentConfirmed).toBeDefined();
    data.set("consentConfirmed", "on");
    expect((await actions.saveTestimonialAction(initialActionState, data)).status).toBe("success");
    expect(await getDb().select().from(testimonials)).toHaveLength(1);
  });
});
