"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";

function cleanText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function cleanOptionalNumber(value) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function cleanImages(images) {
  if (!Array.isArray(images)) {
    return [];
  }

  return images
    .filter((image) => typeof image === "string")
    .map((image) => image.trim())
    .filter(Boolean);
}

function cleanSizes(sizes) {
  if (!Array.isArray(sizes)) {
    return [];
  }

  const uniqueSizes = new Map();

  for (const item of sizes) {
    const sizeId = cleanText(item?.sizeId);

    if (!sizeId) {
      continue;
    }

    uniqueSizes.set(sizeId, {
      size_id: sizeId,
      stock_qty: cleanNumber(item?.stockQty),
    });
  }

  return [...uniqueSizes.values()];
}

function cleanCollectionIds(collectionIds) {
  if (!Array.isArray(collectionIds)) {
    return [];
  }

  return [
    ...new Set(
      collectionIds
        .map((collectionId) => cleanText(collectionId))
        .filter(Boolean)
    ),
  ];
}

function makeUniqueSuffix() {
  return `${Date.now().toString(36)}${Math.random()
    .toString(36)
    .slice(2, 7)}`.toUpperCase();
}

function makeProductSlug(name) {
  const baseSlug = slugify(name);

  if (!baseSlug) {
    return "";
  }

  return `${baseSlug}-${makeUniqueSuffix().toLowerCase()}`;
}

function makeProductSku(name) {
  const namePart =
    slugify(name)
      .split("-")
      .filter(Boolean)
      .map((part) => part.slice(0, 1))
      .join("")
      .slice(0, 5)
      .toUpperCase() || "PRD";

  return `${namePart}-${makeUniqueSuffix()}`;
}

function validatePayload(payload) {
  const name = cleanText(payload?.name);
  const categoryId = cleanText(payload?.categoryId);
  const status = cleanText(payload?.status) || "draft";
  const description = cleanText(payload?.description);
  const productType = cleanText(payload?.productType);
  const fabric = cleanText(payload?.fabric);
  const occasion = cleanText(payload?.occasion);
  const fit = cleanText(payload?.fit);
  const price = cleanOptionalNumber(payload?.price);
  const compareAtPrice = cleanOptionalNumber(payload?.compareAtPrice);
  const images = cleanImages(payload?.images);
  const sizes = cleanSizes(payload?.sizes);
  const collectionIds = cleanCollectionIds(payload?.collectionIds);

  if (!name) {
    return { ok: false, message: "Product name is required." };
  }

  if (!categoryId) {
    return { ok: false, message: "Please select a category." };
  }

  if (price === null || price <= 0) {
    return { ok: false, message: "Please enter a valid selling price." };
  }

  if (compareAtPrice !== null && compareAtPrice > 0 && compareAtPrice < price) {
    return {
      ok: false,
      message: "Old price must be higher than selling price.",
    };
  }

  if (!images.length) {
    return {
      ok: false,
      message: "Please upload at least one product image.",
    };
  }

  if (!sizes.length) {
    return {
      ok: false,
      message: "Please select at least one size.",
    };
  }

  const allowedStatuses = ["draft", "active", "archived"];

  if (!allowedStatuses.includes(status)) {
    return { ok: false, message: "Invalid product status." };
  }

  return {
    ok: true,
    data: {
      name,
      categoryId,
      status,
      description,
      productType,
      fabric,
      occasion,
      fit,
      price,
      compareAtPrice,
      images,
      sizes,
      collectionIds,
    },
  };
}

async function validateRelations(supabase, categoryId, sizes, collectionIds) {
  const { data: category, error: categoryError } = await supabase
    .from("categories")
    .select("id")
    .eq("id", categoryId)
    .eq("is_active", true)
    .single();

  if (categoryError || !category) {
    return {
      ok: false,
      message: "Selected category could not be found.",
    };
  }

  const selectedSizeIds = sizes.map((item) => item.size_id);

  const { data: validSizes, error: sizesError } = await supabase
    .from("sizes")
    .select("id")
    .in("id", selectedSizeIds);

  if (sizesError || validSizes?.length !== selectedSizeIds.length) {
    return {
      ok: false,
      message: "One or more selected sizes could not be found.",
    };
  }

  if (collectionIds.length) {
    const { data: validCollections, error: collectionsError } = await supabase
      .from("collections")
      .select("id")
      .in("id", collectionIds)
      .eq("is_active", true);

    if (collectionsError || validCollections?.length !== collectionIds.length) {
      return {
        ok: false,
        message:
          "One or more selected collections could not be found or are inactive.",
      };
    }
  }

  return { ok: true };
}

function revalidateProductPaths(productId) {
  revalidatePath("/admin/products");
  revalidatePath("/admin/collections");
  revalidatePath(`/admin/products/${productId}`);
  revalidatePath(`/admin/products/${productId}/edit`);
}

export async function createProduct(payload) {
  const validated = validatePayload(payload);

  if (!validated.ok) {
    return validated;
  }

  const {
    name,
    categoryId,
    status,
    description,
    productType,
    fabric,
    occasion,
    fit,
    price,
    compareAtPrice,
    images,
    sizes,
    collectionIds,
  } = validated.data;

  const supabase = await createClient();

  const relations = await validateRelations(
    supabase,
    categoryId,
    sizes,
    collectionIds
  );

  if (!relations.ok) {
    return relations;
  }

  const slug = makeProductSlug(name);
  const sku = makeProductSku(name);

  const { data: product, error: productError } = await supabase
    .from("products")
    .insert({
      category_id: categoryId,
      name,
      slug,
      description: description || null,
      product_type: productType || null,
      price,
      compare_at_price: compareAtPrice,
      currency: "PKR",
      status,
      attr_fabric: fabric || null,
      attr_occasion: occasion || null,
      attr_fit: fit || null,
      primary_image: images[0],
      sku,
    })
    .select("id, slug, sku")
    .single();

  if (productError || !product) {
    console.error("createProduct product error:", productError);

    return {
      ok: false,
      message: "Product could not be created. Please try again.",
    };
  }

  const { error: imagesError } = await supabase
    .from("product_images")
    .insert(
      images.map((imageUrl, index) => ({
        product_id: product.id,
        image_url: imageUrl,
        is_primary: index === 0,
        sort_order: index,
      }))
    );

  if (imagesError) {
    console.error("createProduct images error:", imagesError);

    return {
      ok: false,
      productId: product.id,
      message: "Product was created, but images could not be saved.",
    };
  }

  const { error: sizesError } = await supabase
    .from("product_sizes")
    .insert(
      sizes.map((size) => ({
        product_id: product.id,
        size_id: size.size_id,
        stock_qty: size.stock_qty,
      }))
    );

  if (sizesError) {
    console.error("createProduct sizes error:", sizesError);

    return {
      ok: false,
      productId: product.id,
      message: "Product was created, but sizes could not be saved.",
    };
  }

  if (collectionIds.length) {
    const { error: collectionsError } = await supabase
      .from("product_collections")
      .insert(
        collectionIds.map((collectionId) => ({
          product_id: product.id,
          collection_id: collectionId,
        }))
      );

    if (collectionsError) {
      console.error("createProduct collections error:", collectionsError);

      return {
        ok: false,
        productId: product.id,
        message: "Product was created, but collections could not be saved.",
      };
    }
  }

  revalidateProductPaths(product.id);

  return {
    ok: true,
    productId: product.id,
    slug: product.slug,
    sku: product.sku,
  };
}

export async function updateProduct(productId, payload) {
  const id = cleanText(productId);

  if (!id) {
    return {
      ok: false,
      message: "Product ID is missing.",
    };
  }

  const validated = validatePayload(payload);

  if (!validated.ok) {
    return validated;
  }

  const {
    name,
    categoryId,
    status,
    description,
    productType,
    fabric,
    occasion,
    fit,
    price,
    compareAtPrice,
    images,
    sizes,
    collectionIds,
  } = validated.data;

  const supabase = await createClient();

  const relations = await validateRelations(
    supabase,
    categoryId,
    sizes,
    collectionIds
  );

  if (!relations.ok) {
    return relations;
  }

  const { data: existingProduct, error: existingProductError } = await supabase
    .from("products")
    .select("id, slug, sku")
    .eq("id", id)
    .single();

  if (existingProductError || !existingProduct) {
    return {
      ok: false,
      message: "Product could not be found.",
    };
  }

  const { error: updateError } = await supabase
    .from("products")
    .update({
      category_id: categoryId,
      name,
      description: description || null,
      product_type: productType || null,
      price,
      compare_at_price: compareAtPrice,
      status,
      attr_fabric: fabric || null,
      attr_occasion: occasion || null,
      attr_fit: fit || null,
      primary_image: images[0],
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (updateError) {
    console.error("updateProduct product error:", updateError);

    return {
      ok: false,
      message: "Product details could not be updated.",
    };
  }

  const { error: deleteImagesError } = await supabase
    .from("product_images")
    .delete()
    .eq("product_id", id);

  if (deleteImagesError) {
    console.error("updateProduct delete images error:", deleteImagesError);

    return {
      ok: false,
      message: "Product was updated, but old images could not be replaced.",
    };
  }

  const { error: insertImagesError } = await supabase
    .from("product_images")
    .insert(
      images.map((imageUrl, index) => ({
        product_id: id,
        image_url: imageUrl,
        is_primary: index === 0,
        sort_order: index,
      }))
    );

  if (insertImagesError) {
    console.error("updateProduct insert images error:", insertImagesError);

    return {
      ok: false,
      message: "Product was updated, but images could not be saved.",
    };
  }

  const { error: deleteSizesError } = await supabase
    .from("product_sizes")
    .delete()
    .eq("product_id", id);

  if (deleteSizesError) {
    console.error("updateProduct delete sizes error:", deleteSizesError);

    return {
      ok: false,
      message: "Product was updated, but sizes could not be replaced.",
    };
  }

  const { error: insertSizesError } = await supabase
    .from("product_sizes")
    .insert(
      sizes.map((size) => ({
        product_id: id,
        size_id: size.size_id,
        stock_qty: size.stock_qty,
      }))
    );

  if (insertSizesError) {
    console.error("updateProduct insert sizes error:", insertSizesError);

    return {
      ok: false,
      message: "Product was updated, but sizes could not be saved.",
    };
  }

  const { error: deleteCollectionsError } = await supabase
    .from("product_collections")
    .delete()
    .eq("product_id", id);

  if (deleteCollectionsError) {
    console.error(
      "updateProduct delete collections error:",
      deleteCollectionsError
    );

    return {
      ok: false,
      message: "Product was updated, but old collections could not be replaced.",
    };
  }

  if (collectionIds.length) {
    const { error: insertCollectionsError } = await supabase
      .from("product_collections")
      .insert(
        collectionIds.map((collectionId) => ({
          product_id: id,
          collection_id: collectionId,
        }))
      );

    if (insertCollectionsError) {
      console.error(
        "updateProduct insert collections error:",
        insertCollectionsError
      );

      return {
        ok: false,
        message: "Product was updated, but collections could not be saved.",
      };
    }
  }

  revalidateProductPaths(id);

  return {
    ok: true,
    productId: id,
    slug: existingProduct.slug,
    sku: existingProduct.sku,
  };
}