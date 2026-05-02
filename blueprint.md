✅ Pre‑build (Foundation) Creator authentication (email/password or Google
OAuth)

Viator Partner API sandbox integration (search activities, get affiliate links)

Manual search → select activity → generate affiliate link

Short URL service (/l/{shortCode}) with redirect

Basic click logging (creator_id, link_id, timestamp, IP, user_agent)

“Save to My Deals” button with database storage (saved_deals table)

✅ MVP (AI Intent + Basic Dashboard) AI intent search using OpenRouter

Free text input → JSON extraction (destination, budget, keywords, group type)

Calls Viator search with extracted parameters

“Deal score” ranking (high rating + low price)

Dashboard (basic)

Total clicks (all time, last 30 days)

Clicks per saved deal

Estimated commission (8% fixed)

Saved Deals page

Edit notes, toggle link active/inactive, per‑deal click graph (simple bar)

Bot filtering – exclude user agents containing “bot” or “crawler” from click
counts

✅ V2 (Alternatives + Link‑in‑Bio + Brand Report) Posts with alternative slots

creator_posts and post_slots tables

Each post has 2–5 slots, each slot has its own short URL

“Generate Alternatives” button – given one Viator product, AI finds 2 similar
alternatives

Link‑in‑Bio pages (public, no login)

/@{username} – list of creator’s public posts

/@{username}/{postSlug} – landing page with all slots and their short URLs

Post dashboard

Clicks per slot, total clicks per post, estimated commission per slot

“Best vs Budget” comparison generator (AI picks highest rating vs lowest price)

Brand Report – printable HTML report (browser print → PDF) with date range,
clicks, top slot, location summary (from IP)

Copy post – duplicate post and slots with fresh short URLs

Bot‑filtered analytics – dashboard shows both raw and filtered clicks

✅ V3 (Campaign + AI Content Workspace) Campaign layer campaigns table (title,
niche, status: draft/active/archived, startDate, endDate, scheduledDate)

campaign_content table (script, caption, story_text, image prompts per platform)

creator_posts now has optional campaignId

/campaigns list page with status filter, post count, preview

/campaigns/[campaignId] detail page with:

Setup checklist (add post, generate content, schedule, copy short URL)

Scheduled date picker

Linked posts list

AI content generation per platform (Instagram/TikTok/YouTube)

Script, caption, story text, 3 image prompt ideas (text only)

Copy buttons for each, regenerate button

Niche suggestions /suggest-niches page

POST /api/ai/suggest-niches – aggregates creator’s click data (bot‑filtered) to
suggest 3 niches with reason + example product

One‑click “Create campaign from this niche” (pre‑fills campaign form)

APIs added PATCH /api/campaigns/[id] – update status, scheduledDate

POST /api/campaigns/generate-content – OpenRouter call, stores row‑per‑content

POST /api/ai/suggest-niches

✅ V3.5 (Integration Cleanup – implemented) Dashboard (/dashboard) becomes the
authenticated home

Metric cards: total campaigns, total posts, 30‑day filtered clicks, estimated
commission

Upcoming scheduled posts (next 7 days) – simple list

“Needs attention” list (no content, no date, no linked post) with action buttons

Top niches chips (from click data, clickable to filter campaigns)

Recent clicks (5 rows)

Quick actions: New Campaign, New Post, Niche Suggestions

Navigation streamlined to 5 items: Dashboard, Campaigns, Posts, Niche
Suggestions, Discover

Removed “Saved Deals” from primary nav (now part of Posts)

Cross‑linking

Campaigns list has “View Posts” button (/posts?campaignId=...)

Posts list shows campaign name (linked) when applicable

After creating a post from /posts/new?campaignId=..., redirect with success
prompt to generate content

Campaign detail checklist now has contextual actions (add post, generate
content, schedule, copy short URL) that link/focus correctly

Niche suggestions – “Use this niche” opens inline campaign draft form (no page
reload)
