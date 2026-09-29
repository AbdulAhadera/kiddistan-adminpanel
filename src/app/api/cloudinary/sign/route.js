import { v2 as cloudinary } from "cloudinary";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST() {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json(
      { message: "Cloudinary environment variables are missing." },
      { status: 500 }
    );
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json(
      { message: "You must be signed in." },
      { status: 401 }
    );
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || profile?.role !== "admin") {
    return NextResponse.json(
      { message: "You are not authorized to upload product images." },
      { status: 403 }
    );
  }

  const timestamp = Math.floor(Date.now() / 1000);

  // Only sign fields that are also sent in the browser upload request.
  const paramsToSign = {
    folder: "kiddistan/products",
    timestamp,
  };

  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    apiSecret
  );

  return NextResponse.json({
    cloudName,
    apiKey,
    timestamp,
    folder: paramsToSign.folder,
    signature,
  });
}   