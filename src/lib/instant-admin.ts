import { init } from "@instantdb/admin";
import schema from "../../instant.schema";

const appId =
  process.env.INSTANT_APP_ID ??
  process.env.NEXT_PUBLIC_INSTANT_APP_ID ??
  process.env.NEXT_PUBLIC_INSTANTDB_APP_ID ??
  "";

const adminToken =
  process.env.INSTANT_ADMIN_TOKEN ?? process.env.INSTANT_APP_ADMIN_TOKEN ?? "";

export const adminDb =
  appId && adminToken
    ? init({
        appId,
        adminToken,
        schema,
      })
    : null;
