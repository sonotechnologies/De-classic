/**
 * Seeds the Ikorodu branch and all placeholder content. Every placeholder is flagged `isSample`
 * so it shows a "Sample" tag in the admin until the owner replaces it.
 *
 *   npm run db:seed            # only seeds an empty database
 *   npm run db:seed -- --reset # wipes all data first (development only)
 */
import { config } from "dotenv";

config({ path: [".env.local", ".env"] });

const PHOTO = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1600&q=80`;

function lastDayOfMonth(today: string) {
  const d = new Date(today + "T00:00:00Z");
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).toISOString().slice(0, 10);
}

async function main() {
  const { sql } = await import("drizzle-orm");
  const { db } = await import("./index");
  const s = await import("./schema");
  const bcrypt = (await import("bcryptjs")).default;
  const { todayInLagos, addDays } = await import("../lib/format");

  const reset = process.argv.includes("--reset");
  if (reset) {
    if (process.env.NODE_ENV === "production") throw new Error("Refusing to reset in production.");
    await db.execute(
      sql`truncate table reservation_events, reservations, offer_room_types, offers, room_images, room_types, menu_items, menu_categories, gallery_images, reviews, users, settings, branches restart identity cascade`,
    );
    console.log("Wiped all data.");
  }

  const existing = await db.select({ id: s.branches.id }).from(s.branches).limit(1);
  if (existing.length) {
    console.log("Database already has data. Run with --reset to start again (development only).");
    process.exit(0);
  }

  const today = todayInLagos();

  const [branch] = await db
    .insert(s.branches)
    .values({
      name: "Ikorodu",
      slug: "ikorodu",
      area: "agric, ikorodu",
      address: "12 Example Street, Oriokuta, Agric, Ikorodu, Lagos",
      mapUrl: "https://www.google.com/maps/search/?api=1&query=Oriokuta%2C%20Agric%2C%20Ikorodu%2C%20Lagos",
      mapEmbedUrl: "",
      phone: "08000000000",
      whatsapp: "08000000000",
      email: "",
      hours: "Reception is open 24 hours. Free parking on site.",
      barHours: [
        { days: "Mon to Thu", time: "6pm – 1am" },
        { days: "Fri and Sat", time: "6pm – 3am" },
        { days: "Sunday", time: "5pm – 12am" },
      ],
      barIntro: "Every day. Cocktails, cold beer, suya and small chops. Music from Thursday to Sunday.",
      landmarks: [
        { place: "Agric junction", time: "5 min drive" },
        { place: "Ikorodu garage", time: "15 min drive" },
        { place: "Ikorodu ferry terminal", time: "20 min drive" },
        { place: "Lagos State University of Science and Technology", time: "20 min drive" },
      ],
      checkInTime: "14:00",
      checkOutTime: "12:00",
      allowsShortStay: true,
      isPublished: true,
      isSample: true,
      sortOrder: 0,
    })
    .returning();

  const roomSeed = [
    {
      name: "Standard room",
      slug: "standard",
      tagline: "a good bed and a cool room",
      description:
        "A clean, quiet room with a double bed, air conditioning and a smart TV. Everything you need for a night in Ikorodu, at the best price in the house.",
      price: 25_000,
      short: 12_000,
      capacity: 2,
      amenities: ["Double bed", "Air conditioning", "Smart TV", "Fast Wi-Fi", "Hot shower", "Wardrobe", "Daily cleaning"],
      photos: [
        ["1522771739844-6a9f6d5f14af", "a made double bed beside a window"],
        ["1505693416388-ac5ce068fe85", "bedside"],
        ["1552321554-5fefe8c9ef14", "the bathroom"],
        ["1566665797739-1674de7a421a", "from the doorway"],
        ["1540518614846-7eded433c457", "bed and seating"],
      ],
    },
    {
      name: "Deluxe room",
      slug: "deluxe",
      tagline: "room for two, and a desk",
      description:
        "A bright room on the first floor with a queen bed, a proper work desk and a window over the street. Good for a couple, or for work trips when you need quiet and fast Wi-Fi.",
      price: 35_000,
      short: 15_000,
      capacity: 2,
      amenities: ["Queen bed", "Work desk", "Fast Wi-Fi", "Air conditioning", "Smart TV", "Hot shower", "Fridge", "Kettle", "Wardrobe", "Daily cleaning"],
      photos: [
        ["1631049307264-da0ec9d70304", "the bed"],
        ["1540518614846-7eded433c457", "bed and seating"],
        ["1552321554-5fefe8c9ef14", "the bathroom"],
        ["1505693416388-ac5ce068fe85", "bedside"],
        ["1566665797739-1674de7a421a", "from the doorway"],
      ],
    },
    {
      name: "Executive room",
      slug: "executive",
      tagline: "more space, a bigger bed",
      description:
        "A king bed, a sitting area and a mini fridge, on a quieter floor. For guests who want to spread out after a night downstairs.",
      price: 50_000,
      short: 20_000,
      capacity: 2,
      amenities: ["King bed", "Sitting area", "Mini fridge", "Air conditioning", "Smart TV", "Fast Wi-Fi", "Hot shower", "Kettle", "Daily cleaning"],
      photos: [
        ["1618773928121-c32242e63f39", "executive room"],
        ["1540518614846-7eded433c457", "the sitting area"],
        ["1552321554-5fefe8c9ef14", "the bathroom"],
        ["1505693416388-ac5ce068fe85", "bedside"],
        ["1566665797739-1674de7a421a", "from the doorway"],
      ],
    },
    {
      name: "Suite",
      slug: "suite",
      tagline: "the best room in the building",
      description:
        "A separate lounge, a king bed and the biggest bathroom in the hotel. Good for a birthday, an anniversary, or a weekend you want to remember.",
      price: 75_000,
      short: 30_000,
      capacity: 3,
      amenities: ["King bed", "Separate lounge", "Large bathroom", "Air conditioning", "Two smart TVs", "Fast Wi-Fi", "Mini fridge", "Kettle", "Daily cleaning"],
      photos: [
        ["1566665797739-1674de7a421a", "the suite"],
        ["1540518614846-7eded433c457", "the lounge"],
        ["1631049307264-da0ec9d70304", "the bed"],
        ["1552321554-5fefe8c9ef14", "the bathroom"],
        ["1505693416388-ac5ce068fe85", "bedside"],
      ],
    },
  ];

  const insertedRooms = [];
  for (const [i, r] of roomSeed.entries()) {
    const [room] = await db
      .insert(s.roomTypes)
      .values({
        branchId: branch.id,
        name: r.name,
        slug: r.slug,
        tagline: r.tagline,
        description: r.description,
        pricePerNight: r.price * 100,
        shortStayPrice: r.short * 100,
        capacity: r.capacity,
        amenities: r.amenities,
        units: 5,
        isVisible: true,
        isSample: true,
        sortOrder: i,
      })
      .returning();
    await db.insert(s.roomImages).values(
      r.photos.map(([id, alt], j) => ({
        roomTypeId: room.id,
        url: PHOTO(id),
        alt: `Stand-in photo: ${alt}`,
        sortOrder: j,
      })),
    );
    insertedRooms.push(room);
  }

  const [weekend] = await db
    .insert(s.offers)
    .values([
      {
        branchId: branch.id,
        title: "two nights, ₦10k off",
        description: "Book any room for Friday and Saturday and we take ₦10,000 off the total. Mention the offer in your request.",
        terms: "Friday and Saturday nights only. One discount per booking. Cannot be combined with other offers.",
        ctaLabel: "Book the weekend",
        startsOn: today,
        endsOn: lastDayOfMonth(today) < addDays(today, 7) ? addDays(today, 21) : lastDayOfMonth(today),
        isSample: true,
      },
      {
        branchId: branch.id,
        title: "two cocktails for one",
        description: "At the bar from 6pm to 9pm. Any cocktail on the menu.",
        terms: "Thursdays only, 6pm to 9pm. Cocktails only.",
        badge: "every thursday",
        ctaLabel: "Book a room",
        startsOn: today,
        endsOn: null,
        isSample: true,
      },
      {
        branchId: branch.id,
        title: "birthday? the cake is on us",
        description: "Book a room for your birthday night and we bring a cake to your table at the bar.",
        terms: "Tell us the date in your request. ID may be checked at check in.",
        ctaLabel: "Tell us the date",
        startsOn: today,
        endsOn: addDays(today, 60),
        isSample: true,
      },
    ])
    .returning();
  await db.insert(s.offerRoomTypes).values(insertedRooms.map((r) => ({ offerId: weekend.id, roomTypeId: r.id })));

  const menu: [string, [string, number][]][] = [
    ["cocktails", [["Chapman", 3500], ["De Classic sunset", 5000], ["Mojito", 5000], ["Long Island", 6500]]],
    ["beer and stout", [["Star", 1500], ["Guinness", 1800], ["Heineken", 2000], ["Desperados", 2500]]],
    ["spirits", [["Hennessy VS, glass", 4000], ["Jameson, glass", 3000], ["Hennessy VS, bottle", 75000], ["Jameson, bottle", 45000]]],
    ["small chops", [["Peppered gizzard", 4000], ["Suya platter", 6000], ["Asun", 5000], ["Small chops tray", 7500]]],
  ];
  for (const [i, [cat, items]] of menu.entries()) {
    const [c] = await db.insert(s.menuCategories).values({ branchId: branch.id, name: cat, sortOrder: i }).returning();
    await db.insert(s.menuItems).values(
      items.map(([name, price], j) => ({ categoryId: c.id, name, price: price * 100, isSample: true, sortOrder: j })),
    );
  }

  const dims = { "4/5": [960, 1200], "1/1": [1000, 1000], "3/2": [1200, 800] } as const;
  const gallery: [string, "rooms" | "bar", keyof typeof dims, string][] = [
    ["1522771739844-6a9f6d5f14af", "rooms", "4/5", "standard room"],
    ["1514362545857-3bc16c4c7d1b", "bar", "1/1", "a cocktail"],
    ["1595576508898-0ad5c879a061", "rooms", "3/2", "twin beds and a tiled floor"],
    ["1552321554-5fefe8c9ef14", "rooms", "4/5", "bathroom"],
    ["1572116469696-31de0f17cc34", "bar", "3/2", "the bar counter"],
    ["1631049307264-da0ec9d70304", "rooms", "1/1", "deluxe room"],
    ["1551024709-8f23befc6f87", "bar", "4/5", "drinks"],
    ["1618773928121-c32242e63f39", "rooms", "3/2", "executive room"],
    ["1505693416388-ac5ce068fe85", "rooms", "4/5", "bedside"],
    ["1470337458703-46ad1756a187", "bar", "1/1", "a drink being poured"],
  ];
  await db.insert(s.galleryImages).values(
    gallery.map(([id, tag, ratio, alt], i) => ({
      branchId: branch.id,
      url: PHOTO(id),
      alt: `Stand-in photo: ${alt}`,
      tag,
      width: dims[ratio][0],
      height: dims[ratio][1],
      isSample: true,
      sortOrder: i,
    })),
  );

  const ownerEmail = (process.env.SEED_OWNER_EMAIL || "owner@declassic.ng").toLowerCase();
  const ownerPassword = process.env.SEED_OWNER_PASSWORD;
  if (!ownerPassword || ownerPassword.length < 8) throw new Error("Set SEED_OWNER_PASSWORD (8+ characters) before seeding.");
  await db.insert(s.users).values({
    name: process.env.SEED_OWNER_NAME || "Hotel owner",
    email: ownerEmail,
    passwordHash: await bcrypt.hash(ownerPassword, 12),
    role: "owner",
    branchId: null,
    mustChangePassword: process.env.NODE_ENV === "production",
  });

  await db.insert(s.settings).values([
    { key: "notificationEmail", value: ownerEmail },
    { key: "contactIsSample", value: true },
  ]);

  console.log(`Seeded the Ikorodu branch, ${insertedRooms.length} rooms, 3 offers, the bar menu, 10 gallery photos and the owner ${ownerEmail}.`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
