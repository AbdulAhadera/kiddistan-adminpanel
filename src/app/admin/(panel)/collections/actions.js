// src/app/admin/(panel)/collections/actions.js
"use server";


import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";


function cleanText(value) {
  return typeof value === "string" ? value.trim() : "";
}


function makeCollectionSlug(name) {
  const baseSlug = slugify(name);
  
  if (!baseSlug) {
    return "";
  }
  
  return baseSlug.slice(0, 100);
}


export async function createCollection(formData) {
  const supabase = await createClient();
  
  const name = cleanText(formData.get("name"));
  const description = cleanText(formData.get("description"));
  const isActive = formData.get("isActive") === "on";
  
  if (!name) {
    return {
      ok: false,
      error: "Collection name is required.",
    };
  }
  
  if (name.length > 100) {
    return {
      ok: false,
      error: "Collection name must be 100 characters or fewer.",
    };
  }
  
  const slug = makeCollectionSlug(name);
  
  if (!slug) {
    return {
      ok: false,
      error: "Could not generate a collection URL.",
    };
  }
  
  // Check if collection with same slug already exists
  const { data: existingCollection } = await supabase
    .from("collections")
    .select("id, slug")
    .eq("slug", slug)
    .single();
  
  if (existingCollection) {
    return {
      ok: false,
      error: "A collection with this name already exists. Please use a different name.",
    };
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
      return {
        ok: false,
        error: "A collection with this name already exists. Please use a different name.",
      };
    }
    
    return {
      ok: false,
      error: "Collection could not be created. Please try again.",
    };
  }
  
  revalidatePath("/admin/collections");
  
  return {
    ok: true,
    collectionId: collection.id,
    slug: collection.slug,
  };
}