"use client";

import { init } from "@instantdb/react";
import schema from "../../instant.schema";

export const INSTANT_APP_ID =
  process.env.NEXT_PUBLIC_INSTANT_APP_ID ?? process.env.NEXT_PUBLIC_INSTANTDB_APP_ID ?? "";

export const db = init({
  appId: INSTANT_APP_ID || "missing-instant-app-id",
  schema,
});
