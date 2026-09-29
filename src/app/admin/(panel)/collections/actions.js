"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";

function cleanText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function makeUniqueSuffix() {
  return `${Date.now().toString(36)}${Math.random()
    .toString(36)
    .slice(2, 7)}`.toLowerCase();
}

function makeCollectionSlug(name) {
  const baseSlug = slugify(name);

  if (!baseSlug) {
    return "";
  }

  return `${baseSlug}-${makeUniqueSuffix()}`.slice(0, 100);
}

export async function createCollection(formData) {
  const supabase = await createClient();

  const name = cleanText(formData.get("name"));
  const description = cleanText(formData.get("description"));
  const isActive = formData.get("isActive") === "on";

  if (!name) {
    throw new Error("Collection name is required.");
  }

  if (name.length > 100) {
    throw new Error("Collection name must be 100 characters or fewer.");
  }

  const slug = makeCollectionSlug(name);

  if (!slug) {
    throw new Error("Could not generate a collection URL.");
  }

  const { data: collection, error } = await supabase
    .from("collections")
    .insert({
      name,
      slug,
      description: description || null,
      is_active: isActive,
    })
    .select("id, name, slug")
    .single();

  if (error || !collection) {
    console.error("createCollection insert error:", error);

    if (error?.code === "23505") {
      throw new Error(
        "A collection with this URL already exists. Please use a different name."
      );
    }

    throw new Error("Collection could not be created. Please try again.");
  }

  revalidatePath("/admin/collections");

  return {
    ok: true,
    collectionId: collection.id,
    slug: collection.slug,
  };
}