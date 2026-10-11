"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb } from "@/db";
import { getPurchaseAllowedHosts } from "@/lib/env";
import { requireAdmin } from "@/lib/session";
import { toFieldErrors, type ActionState } from "@/lib/validation/common";
import {
  brandSettingsFormData,
  brandSettingsSchema,
  categoryFormData,
  categorySchema,
  homeSettingsFormData,
  homeSettingsSchema,
  legalSettingsFormData,
  legalSettingsSchema,
  profileSettingsFormData,
  profileSettingsSchema,
  testimonialFormData,
  testimonialSchema,
} from "@/lib/validation/content";
import { courseFormDataToObject, createCourseSchema } from "@/lib/validation/course";
import { TAGS } from "@/server/data/tags";
import * as service from "@/server/services/content";

const INVALID_FORM: ActionState = { status: "error", message: "Revise os campos destacados." };
const OWNER_ONLY: ActionState = { status: "error", message: "Apenas o proprietário pode excluir conteúdo." };

/** Exclusões são restritas ao papel "owner". */
async function isOwner(): Promise<boolean> {
  const session = await requireAdmin();
  return session.role === "owner";
}

function readId(formData: FormData): string | null {
  const parsed = z.uuid().safeParse(formData.get("id"));
  return parsed.success ? parsed.data : null;
}

/** Converte falhas em mensagens seguras: erros internos nunca chegam ao navegador. */
function failure(error: unknown, context: string): ActionState {
  if (error instanceof service.ServiceError) {
    return {
      status: "error",
      message: error.message,
      fieldErrors: error.field ? { [error.field]: [error.message] } : undefined,
    };
  }
  console.error(`[admin] Falha ao ${context}:`, error);
  return {
    status: "error",
    message: "Não foi possível salvar agora. Verifique a conexão e tente novamente.",
  };
}

/* ------------------------------ Cursos ------------------------------ */

export async function saveCourseAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const rawId = formData.get("id");
  const id = rawId ? readId(formData) : null;
  if (rawId && !id) return { status: "error", message: "Curso inválido." };

  const parsed = createCourseSchema(getPurchaseAllowedHosts()).safeParse(courseFormDataToObject(formData));
  if (!parsed.success) return { ...INVALID_FORM, fieldErrors: toFieldErrors(parsed.error) };

  let createdId: string | null = null;
  try {
    if (id) {
      await service.updateCourse(getDb(), id, parsed.data);
    } else {
      createdId = (await service.createCourse(getDb(), parsed.data)).id;
    }
  } catch (error) {
    return failure(error, "salvar o curso");
  }

  updateTag(TAGS.courses);
  if (createdId) redirect(`/admin/cursos/${createdId}?criado=1`);
  return {
    status: "success",
    message: parsed.data.isPublished ? "Curso salvo e publicado." : "Curso salvo como rascunho.",
  };
}

export async function toggleCoursePublishedAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = readId(formData);
  if (!id) return { status: "error", message: "Curso inválido." };
  const publish = formData.get("publish") === "true";
  try {
    await service.setCoursePublished(getDb(), id, publish);
  } catch (error) {
    return failure(error, "alterar a publicação");
  }
  updateTag(TAGS.courses);
  return { status: "success", message: publish ? "Curso publicado." : "Curso despublicado." };
}

export async function deleteCourseAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await isOwner())) return OWNER_ONLY;
  const id = readId(formData);
  if (!id) return { status: "error", message: "Curso inválido." };
  if (formData.get("confirm") !== "EXCLUIR") {
    return { status: "error", message: 'Digite EXCLUIR para confirmar.', fieldErrors: { confirm: ["Digite EXCLUIR para confirmar."] } };
  }
  try {
    await service.deleteCourse(getDb(), id);
  } catch (error) {
    return failure(error, "excluir o curso");
  }
  updateTag(TAGS.courses);
  updateTag(TAGS.testimonials);
  redirect("/admin/cursos?excluido=1");
}

/* ---------------------------- Categorias ---------------------------- */

export async function saveCategoryAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const rawId = formData.get("id");
  const id = rawId ? readId(formData) : null;
  if (rawId && !id) return { status: "error", message: "Categoria inválida." };
  const parsed = categorySchema.safeParse(categoryFormData(formData));
  if (!parsed.success) return { ...INVALID_FORM, fieldErrors: toFieldErrors(parsed.error) };
  try {
    if (id) await service.updateCategory(getDb(), id, parsed.data);
    else await service.createCategory(getDb(), parsed.data);
  } catch (error) {
    return failure(error, "salvar a categoria");
  }
  updateTag(TAGS.categories);
  updateTag(TAGS.courses);
  return { status: "success", message: id ? "Categoria atualizada." : "Categoria criada." };
}

export async function deleteCategoryAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await isOwner())) return OWNER_ONLY;
  const id = readId(formData);
  if (!id) return { status: "error", message: "Categoria inválida." };
  try {
    await service.deleteCategory(getDb(), id);
  } catch (error) {
    return failure(error, "excluir a categoria");
  }
  updateTag(TAGS.categories);
  updateTag(TAGS.courses);
  return { status: "success", message: "Categoria excluída. Os cursos vinculados ficaram sem categoria." };
}

/* ---------------------------- Depoimentos ---------------------------- */

export async function saveTestimonialAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const rawId = formData.get("id");
  const id = rawId ? readId(formData) : null;
  if (rawId && !id) return { status: "error", message: "Depoimento inválido." };
  const parsed = testimonialSchema.safeParse(testimonialFormData(formData));
  if (!parsed.success) return { ...INVALID_FORM, fieldErrors: toFieldErrors(parsed.error) };
  try {
    if (id) await service.updateTestimonial(getDb(), id, parsed.data);
    else await service.createTestimonial(getDb(), parsed.data);
  } catch (error) {
    return failure(error, "salvar o depoimento");
  }
  updateTag(TAGS.testimonials);
  return { status: "success", message: id ? "Depoimento atualizado." : "Depoimento cadastrado." };
}

export async function deleteTestimonialAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await isOwner())) return OWNER_ONLY;
  const id = readId(formData);
  if (!id) return { status: "error", message: "Depoimento inválido." };
  try {
    await service.deleteTestimonial(getDb(), id);
  } catch (error) {
    return failure(error, "excluir o depoimento");
  }
  updateTag(TAGS.testimonials);
  return { status: "success", message: "Depoimento excluído." };
}

/* --------------------------- Configurações --------------------------- */

async function saveSettings<T>(
  formData: FormData,
  schema: z.ZodType<T>,
  extract: (formData: FormData) => unknown,
  toPatch: (data: T) => Parameters<typeof service.upsertSettings>[1],
): Promise<ActionState> {
  await requireAdmin();
  const parsed = schema.safeParse(extract(formData));
  if (!parsed.success) return { ...INVALID_FORM, fieldErrors: toFieldErrors(parsed.error) };
  try {
    await service.upsertSettings(getDb(), toPatch(parsed.data));
  } catch (error) {
    return failure(error, "salvar as configurações");
  }
  updateTag(TAGS.settings);
  return { status: "success", message: "Alterações salvas e publicadas no site." };
}

export async function saveBrandSettingsAction(_prev: ActionState, formData: FormData) {
  return saveSettings(formData, brandSettingsSchema, brandSettingsFormData, (data) => data);
}

export async function saveHomeSettingsAction(_prev: ActionState, formData: FormData) {
  return saveSettings(formData, homeSettingsSchema, homeSettingsFormData, (data) => data);
}

export async function saveProfileSettingsAction(_prev: ActionState, formData: FormData) {
  return saveSettings(formData, profileSettingsSchema, profileSettingsFormData, (data) => data);
}

export async function saveLegalSettingsAction(_prev: ActionState, formData: FormData) {
  return saveSettings(formData, legalSettingsSchema, legalSettingsFormData, (legal) => ({ legal }));
}
