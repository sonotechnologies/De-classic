# De Classic Hotel — Design Brief

Oct 8, 2026 · @Sono Technologies

## Design goal and audience

Make De Classic Hotel look like what it is: a clean, modern, lively local hotel in Ikorodu with a good bar, and the easiest hotel in the area to book.

This replaces the earlier dark luxury direction, which oversold the hotel and looked like a template. De Classic is not a five-star Lekki hotel and the site should not pretend to be one.

- **Who it is for:** young guests with money to spend who want a good room and a good night out close to home. They will open the site on a phone.
- **Who must be impressed first:** the owner. They should recognise their own hotel in it at a glance, from the colours of the building to the lettering of the logo.
- **What the design must do:** look fresh and current, be honest about the rooms, and keep "Book now" one tap away.
- **The test:** if the logo and photos were swapped for another hotel's, the design should look wrong. Every signature element below comes from this hotel.
- **Scope:** public site (seven pages) and admin dashboard, as described in the build brief.

## Brand direction and mood

Modern, bright and bold, taken straight from the building: aqua and white lead, black is the ink, and gold appears only where the logo does.

The idea is **"the aqua building"**. Anyone in Agric knows the hotel by its paint, so the site is built from flat blocks of that same aqua and white, the way the walls are painted. The logo's black and gold then own one place only: the bar, where the page goes dark.

**It should feel**

- Fresh, clean and current
- Young and confident, a little playful
- Local and straightforward: this is your spot in Ikorodu

**It should not feel**

- Luxury, five-star or "Lekki": no black and gold pages, no serif headlines, no moody lighting
- Like a hotel chain or a booking site
- Like a template: no full-screen dark photo hero with centred text, no row of three identical cards, no glows, gradients or glass effects

**Five signature elements**

1. **The paint line.** A hard horizontal split between aqua and white, like the two-tone paint on the building. It runs behind the hero, breaks sections and closes the footer.
2. **Lowercase headlines.** Big, bold, all lowercase, echoing the lowercase "de classic" logo.
3. **Price stickers.** A round black sticker with the price sits on the corner of every room photo.
4. **Window frames.** Photos sit in large rounded frames that overlap the paint line, never edge to edge.
5. **Lights off.** The bar is the only dark part of the site: black background, gold accents, the logo's colours.

**Logo:** use the real black and gold "de classic" wordmark once the file is supplied, on white or aqua. Until then, set a placeholder wordmark in the heading typeface, lowercase, in black.

## Colour palette

Roughly half white, a third aqua, the rest black ink. Gold stays under 5% of any page except the bar.

| Token | Hex | Used for |
| --- | --- | --- |
| Aqua | `#B1ECEC` | The brand colour: hero block, section backgrounds, footer, large flat panels |
| Aqua tint | `#E8F9F9` | Soft card and form backgrounds |
| White | `#FFFFFF` | Main page background |
| Ink | `#111111` | Headlines, body text, primary buttons, price stickers |
| Deep teal | `#0B5C5C` | Links, icons, small labels, hover states |
| Slate | `#5B6B6B` | Secondary text |
| Line | `#D5E5E5` | Borders and dividers |
| Gold | `#C9A24B` | The logo, and accents inside the bar section only |
| Night | `#0E0E0F` | Background of the bar section only |

The aqua is the exact paint colour of the Ikorodu building. The gold is an estimate: sample the real value from the logo file.

**Rules**

- Colour is always flat. No gradients, glows, shadows under text or glass effects.
- Primary buttons are solid ink with white text. Secondary buttons are an ink outline. In the bar section, primary buttons are gold with ink text.
- Text on aqua is ink or deep teal. Never white text on aqua, and never gold or aqua text on white.
- Aqua is used in big confident blocks, not as thin accents. A page should read as aqua and white from across the room.
- Gold never appears outside the logo and the bar section.
- Error states use a plain red, success a plain green.

## Typography

Sans serif only: a bold, characterful grotesque for headlines and a friendly, readable sans for everything else. No serif anywhere.

| Role | Typeface | Notes |
| --- | --- | --- |
| Headlines | Bricolage Grotesque, bold | All lowercase, very large, tight line height and letter spacing |
| Body and UI | Figtree | Regular for text, semibold for buttons and labels |
| Small labels | Figtree, semibold | Lowercase, in deep teal, such as "the bar" or "from" |

Both are free on Google Fonts.

**Scale (mobile to desktop)**

- Hero headline: 48px to 120px
- Section headline: 34px to 72px
- Card title: 20px to 26px
- Body: 16px to 18px, line height 1.6
- Labels: 13px to 14px

**Rules**

- Headlines are lowercase, short and plain-spoken, for example "your room in ikorodu is ready" or "the bar opens at six".
- Headlines are big enough to act as the main visual. Let one run across the paint line so it sits half on aqua, half on white.
- Prices are bold ink in the heading face, with "per night" in small sans.
- Body text is ink or slate. Sentence case for everything that is not a headline.

## Layout and components

Flat colour blocks, huge type and rounded photo frames carry the design. Depth comes from overlap, not from shadows.

**Layout**

- Mobile first, designed at 390px, then 768px and 1440px.
- 12-column grid on desktop with a 1240px content width.
- Sections are full-width colour blocks: white, aqua or aqua tint, with hard straight edges between them.
- Photos have 24px rounded corners and overlap the edge between two blocks. Buttons and tags are full pills.
- No drop shadows. No borders on photos. Cards are flat fills.
- Vary the layout from section to section: one wide photo and a list, then two uneven columns, then a horizontal scroll. Never three equal cards in a row.

**Components**

| Component | Notes |
| --- | --- |
| Header | White, with the logo left, plain links, and an ink pill "Book now" right; full-screen aqua menu on mobile with large lowercase links |
| Booking bar | A white pill-shaped bar with dates, room type and an ink button, sitting across the paint line under the hero; sticky bottom bar on mobile |
| Room card | Rounded photo with the black price sticker on its corner, lowercase room name below, three amenities as plain text, an arrow link |
| Price sticker | Black circle, white bold price, tilted a few degrees; the one playful shape on the site |
| Offer card | Solid aqua block with an ink headline and an ink pill button; the end date in a white tag |
| Menu list | Bar section only: gold category names, white items, prices right-aligned |
| Gallery grid | Rounded photos of mixed sizes on white, with a full-screen viewer |
| Form fields | White with a line border, ink border on focus, labels always visible above the field |
| Buttons | Primary ink pill, secondary ink outline pill, text link in deep teal with an arrow |
| WhatsApp button | Fixed bottom right, ink circle with a white icon |
| Footer | Solid aqua block, with a very large lowercase "de classic" across it, then addresses, phone and WhatsApp in ink |

Icons are simple line icons from one set, in ink or deep teal. Use them sparingly; plain words are often clearer.

## Page-by-page notes

Each page has one job and one main action, which is always a route into the reservation form.

| Page | Main job | Design notes |
| --- | --- | --- |
| Home | Show the hotel and start a booking | Hero is the paint line: aqua above, white below, a huge lowercase headline, and one rounded photo overlapping the line. Booking bar sits on the line. Then: rooms in a horizontal scroll with price stickers, the bar teaser as the one black block, offers as aqua blocks, a gallery strip, location, and the aqua footer |
| Rooms | Compare rooms quickly | Large stacked cards on mobile, two uneven columns on desktop, price sticker on every photo |
| Room detail | Sell one room | Swipeable rounded photos, amenities as a plain two-column list, sticky white bar with price and an ink "request this room" button |
| Bar | Sell the night | Lights off: black background, gold lowercase headline, opening hours large, menu by category. The only dark page |
| Gallery | Let photos do the talking | Filter pills for rooms, bar, exterior; almost no text |
| Offers | Create urgency | Stacked aqua offer blocks with end dates in white tags; an empty state pointing to rooms when there are none |
| Locations | Get guests to the door | Aqua page with the address set very large, a rounded map, nearby landmarks as a list, and "get directions" and call buttons |
| Book | Finish the request | One calm white column, two short steps (stay, then contact), a summary card in aqua tint |
| Confirmation | Reassure | Full aqua screen, reference code huge in ink, summary, "send on WhatsApp" button, a note that the hotel will confirm shortly |

Design the 404 page and empty states in the same voice: lowercase headline, aqua block, one clear button.

## Imagery and placeholders

Photos should be bright, daylight and honest, showing the kind of room a guest will really get. The pitch uses placeholders, so every slot must be simple to replace with real photos.

**Placeholder approach**

- Use free-licence photos (Unsplash or Pexels) of ordinary, clean, modern hotel rooms: a made bed, a tiled floor, a window, an air conditioner. Nothing grand.
- Avoid luxury suites, chandeliers, marble lobbies, infinity pools, beaches and skylines. If a photo looks more expensive than the hotel, do not use it.
- Do not present placeholder photos as the real De Classic Hotel. In the pitch, say they are stand-ins.
- For the exterior, use a flat illustration of a building in aqua and white instead of a photo of another hotel.
- Keep fixed aspect ratios per slot so real photos drop in without breaking layouts.

| Slot | Ratio | Notes |
| --- | --- | --- |
| Hero | 4:5 | One rounded photo, not full screen |
| Room card | 4:5 | Bed as the subject, room for the price sticker in a corner |
| Room gallery | 3:2 | Five to eight per room |
| Bar | 16:9 and 1:1 | The only dark, evening photos on the site |
| Gallery | Mixed | Grid handles any ratio |
| Exterior | 3:2 | Shown on the Locations page |

**Treatment**

- Natural colour, bright and clean. No dark grade, no filters, no overlays on photos.
- Text never sits on top of a photo. Headlines live on the colour blocks beside or behind it.

**Shot list for the owner**

When real photos are taken: each room type in daylight from the doorway and from the bed, the bathroom, the bar at night with lights on, the exterior in daylight showing the aqua and white paint, the reception, and the entrance from the road.

## Motion and interaction

Motion is quick and crisp, like a fresh coat of paint going on. It adds energy and never delays a booking.

- **Page load:** the aqua block wipes in from the top to the paint line, the headline slides up word by word, then the photo and booking bar settle into place.
- **Scroll:** each colour block slides over the one before it. Photos move up slightly faster than the block behind them.
- **Price stickers:** pop in with a small spin as the card appears, and tilt a little further on hover.
- **Buttons and links:** pills fill from ink to deep teal on hover; arrow links nudge the arrow right.
- **Lights off:** when the bar section scrolls into view on the home page, the background switches from white to black in one quick cut.
- **Form:** steps slide sideways; the confirmation screen fills with aqua, then the reference code appears.

**Limits**

- Durations between 150ms and 400ms. Sharp ease-out curves.
- No parallax on photos, no cursor effects, no fades from black, no autoplaying video or sound.
- Nothing may block tapping "Book now".
- On mobile, keep the wipes and the stickers and drop the rest.
- Everything reduces to simple fades when the device asks for reduced motion.

## Admin dashboard design

The admin is a working tool, so it is light, plain and fast to read, using the same white and aqua as the public site with none of its big type or motion.

- **Colours:** white background, ink text, aqua for highlights and selected states, ink for primary buttons, deep teal for links, gold only in the logo.
- **Type:** Figtree throughout, at normal sizes and in sentence case.
- **Layout:** sidebar on desktop, bottom tab bar on mobile with Overview, Reservations, Rooms and More.
- **Reservations list:** cards on mobile, table on desktop. Each shows guest name, dates, room type, reference and a coloured status tag.
- **Status tags:** New in aqua, Confirmed in green, Checked in in teal, Completed in grey, Declined, Cancelled and No-show in muted red.
- **Reservation detail:** large call and WhatsApp buttons at the top, status control, notes and history below.
- **Forms:** one column, large tap targets, clear save and cancel, confirmation before deleting anything.
- **Sample content:** a small "Sample" tag on placeholder rooms, menu items and photos.
- **Overview:** number tiles (new requests, today's arrivals, requests this week, plus per-branch totals for the owner) and the latest requests. No charts at launch.

No animation beyond simple fades. Staff should be able to learn it in five minutes.

## Mobile, accessibility and deliverables

Design every screen for a phone first, since that is where nearly all guests and staff will use it.

**Mobile**

- Sticky bottom bar on public pages with "Book now" and the price where relevant.
- Tap targets at least 44px. Phone numbers and WhatsApp are always one tap.
- Date pickers and selects use native phone controls.
- Test layouts at 360px wide.

**Accessibility**

- Body text contrast of at least 4.5:1. Ink and deep teal pass on both white and aqua; gold, aqua and white text on light backgrounds do not.
- Visible ink focus ring on every interactive element.
- Alt text on all images, labels on all form fields, errors written in plain words beside the field.
- Colour is never the only signal: status tags carry a word as well.

**Deliverables**

- [ ] Design tokens: colours, type scale, spacing, radius
- [ ] Component set: header, footer, buttons, form fields, room card, price sticker, offer card, menu list, gallery, booking bar, WhatsApp button
- [ ] Public screens at mobile and desktop: Home, Rooms, Room detail, Bar, Gallery, Offers, Locations, Book, Confirmation, 404
- [ ] Admin screens at mobile and desktop: Login, Overview, Reservations list, Reservation detail, Rooms, Room edit, Bar menu, Gallery, Offers, Branches, Staff, Settings
- [ ] States: empty, loading, error and success for forms and lists
- [ ] A short motion note per page so the build matches the intent
