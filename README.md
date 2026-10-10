# De Classic Hotel

The website and admin dashboard for De Classic Hotel, Oriokuta, Agric, Ikorodu. Guests send reservation requests and the hotel confirms them by call or WhatsApp. Staff manage requests, rooms, prices, the bar menu, photos, offers and branches from `/admin`.

The design is the Claude Design handoff in [`design/`](design/). The home page follows **Home A (the paint line)**, and the System sheet (`design/project/De Classic System.dc.html`) supplies the tokens and components.

## Stack

| Layer | Choice |
| --- | --- |
| App | Next.js 16 (App Router) + TypeScript, one app for the site, admin and server actions |
| Styling | Tailwind CSS v4, with design tokens in `src/app/globals.css` |
| Database | Postgres (Neon in production) via Drizzle ORM |
| Admin login | Auth.js v5, email + password, JWT sessions that expire after 12 hours |
| Images | Cloudinary (signed direct uploads) served through `next/image` as AVIF/WebP |
| Email alerts | Resend |
| WhatsApp | `wa.me` click-to-chat links |
| Map | Google Maps embed + directions link (no API key) |
| Validation | Zod, with the same rules on the Book form and the server |

## Run it locally

You need Node 20.9+ and a Postgres database.

```bash
npm install
cp .env.example .env.local      # then fill in DATABASE_URL, AUTH_SECRET and the seed owner
npm run db:migrate              # create the tables
npm run db:seed                 # Ikorodu branch, 4 rooms, offers, bar menu, gallery, owner account
npm run dev
```

- Site: http://localhost:3000
- Admin: http://localhost:3000/admin. Sign in with `SEED_OWNER_EMAIL` / `SEED_OWNER_PASSWORD`.

Cloudinary and Resend are optional in development:

- **Without Cloudinary**, uploaded photos are saved to `public/uploads`.
- **Without Resend**, alert emails are printed to the server console, and the reservation history records "Email alert not sent".

`npm run db:seed -- --reset` wipes the database and seeds it again. It refuses to run when `NODE_ENV=production`.

## Deploy (Vercel + Neon)

1. Create a Neon project and copy the **pooled** connection string.
2. Import the repo into Vercel and set the environment variables from `.env.example`:
   - `DATABASE_URL`, `AUTH_SECRET` (`npx auth secret`), `NEXT_PUBLIC_SITE_URL`
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
   - `RESEND_API_KEY`, `EMAIL_FROM` (a sender on a domain verified in Resend)
3. Deploy. Vercel runs the `vercel-build` script, which applies migrations, seeds the database if it is empty, then builds. The seed never touches a database that already has data. The seeded owner must choose a new password at first sign-in.

After launch:

- Replace everything tagged **Sample** in the admin. The Overview lists what is left.
- Claim a Google Business Profile for the hotel and link it to the site.

## How it fits together

- **Branches.** Rooms, prices, offers, the bar menu and the gallery all belong to a branch.
  - Public pages live at `src/app/(site)/b/[branch]/…`. `src/proxy.ts` rewrites `/`, `/rooms`, `/bar`, `/gallery` and `/offers` to the branch in the `dc_branch` cookie, or to the first published branch.
  - Each branch's pages are statically rendered.
  - When a second branch is published, a switcher appears in the header and the booking bar.
- **Changes go live straight away.** Every admin save calls `revalidatePath("/", "layout")`. Pages also revalidate hourly, so offers past their end date drop off on their own.
  - Create actions return `redirectTo` instead of calling `redirect()`. In Next 16, a redirect from a server action skips the revalidation.
- **Reservations.** `src/app/(site)/book/actions.ts` handles each request:
  - Validates it with the shared Zod schema and checks the branch, room, short stay and offer.
  - Rate-limits to 3 requests an hour per phone and 8 per IP (the IP is stored as a salted hash), and catches bots with a honeypot field.
  - Stores the request with a `DC-1234` reference, then emails the hotel after the response is sent.
  - The confirmation page builds the pre-written WhatsApp message.
- **Roles.** These are checked on the server in every admin page and action (`src/lib/authz.ts`). The user is re-read from the database on each request, so deactivation takes effect immediately.

  | Role | Can do |
  | --- | --- |
  | Owner | Everything, every branch |
  | Branch manager | Everything for their own branch |
  | Front desk | Reservations for their own branch only |

  New staff get a temporary password and must replace it before anything else in the admin opens. Five wrong passwords lock an account for 15 minutes.
- **Audit trail.** Every status change and note is written to `reservation_events` with who made it and when.
- **Over-booking.** If requests holding a room type on any night add up to more than its `units`, the admin shows a warning. Requests are never blocked.
- **Money** is stored in kobo (integers) and shown in naira.

## Checks

```bash
npm run typecheck   # route types + tsc
npm run lint
npm test            # unit tests (Vitest)
npm run test:e2e    # acceptance checklist (Playwright)
```

The end-to-end suite builds the app and runs it against `E2E_DATABASE_URL` (default `postgres://postgres@127.0.0.1:5433/declassic_test`). It **wipes that database** first, so never point it at real data. It covers:

- A phone request in under a minute, with plain-words errors.
- The request showing up in the admin, with the email attempt and status changes logged.
- The WhatsApp message.
- A price change reaching the public site without a redeploy.
- Expired offers dropping off.
- Sample tags on all placeholder content.
- Front desk limits, including another branch's reservation.
- The branch switcher appearing when a second branch is published.
- Login errors.

## Not in this build

These are left out on purpose, as the brief describes. The schema doesn't block any of them:

- Paystack deposits
- Live availability
- Guest reviews (the `reviews` table already exists)
- Automatic WhatsApp or SMS messages
- An Instagram feed
