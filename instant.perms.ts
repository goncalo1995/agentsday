// Docs: https://www.instantdb.com/docs/permissions

import type { InstantRules } from "@instantdb/react";

const isOwner = "auth.id != null && auth.id == data.userId";
const createsOwnRow = "auth.id != null && auth.id == newData.userId";

const rules = {
  attrs: {
    allow: {
      create: "false",
    },
  },
  $users: {
    allow: {
      view: "auth.id == data.id",
      create: "true",
      update: "auth.id == data.id",
    },
  },
  affiliate_links: {
    allow: {
      view: isOwner,
      create: createsOwnRow,
      update: isOwner,
      delete: isOwner,
    },
  },
  creator_posts: {
    allow: {
      view: isOwner,
      create: createsOwnRow,
      update: isOwner,
      delete: isOwner,
    },
  },
  post_slots: {
    allow: {
      view: isOwner,
      create: createsOwnRow,
      update: isOwner,
      delete: isOwner,
    },
  },
  click_logs: {
    allow: {
      view: isOwner,
      create: createsOwnRow,
      update: "false",
      delete: "false",
    },
  },
  saved_deals: {
    allow: {
      view: isOwner,
      create: createsOwnRow,
      update: isOwner,
      delete: isOwner,
    },
  },
} as InstantRules;

export default rules;
