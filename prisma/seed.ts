import { PrismaClient, type RoleName } from "@prisma/client";
import bcrypt from "bcryptjs";
import { config as loadEnv } from "dotenv";

import { PERMISSIONS, ROLE_PERMISSION_MAP } from "../src/lib/rbac";
import { SITE_CONFIG, SITE_SETTING_KEYS } from "../src/lib/site-config";
import { slugify } from "../src/lib/utils";

loadEnv();

const prisma = new PrismaClient();

const LAUNCH_SERVICES = [
  {
    name: "Roofing",
    slug: "roofing",
    shortDescription:
      "Roof repair, replacement, inspections, and emergency coverage for Northern New York winters.",
    children: [
      "Roof repair",
      "Roof replacement",
      "Metal roofing",
      "Emergency roof repair",
      "Roof inspection",
    ],
  },
  {
    name: "Plumbing",
    slug: "plumbing",
    shortDescription:
      "Residential plumbing repair, drain service, water heaters, and emergency response.",
    children: [
      "Drain cleaning",
      "Water heater repair",
      "Emergency plumber",
      "Pipe repair",
    ],
  },
  {
    name: "Heating and HVAC",
    slug: "hvac",
    shortDescription:
      "Furnace repair, boiler service, heat pumps, and seasonal HVAC maintenance.",
    children: [
      "Furnace repair",
      "Boiler service",
      "Heat pump installation",
      "AC repair",
    ],
  },
  {
    name: "Electrical",
    slug: "electrical",
    shortDescription:
      "Licensed electrical repair, panel upgrades, and residential wiring.",
    children: [
      "Panel upgrade",
      "Outlet and switch repair",
      "Generator installation",
      "Emergency electrician",
    ],
  },
  {
    name: "Tree removal",
    slug: "tree-removal",
    shortDescription:
      "Tree removal, trimming, storm cleanup, and stump grinding.",
    children: ["Tree trimming", "Stump grinding", "Storm damage cleanup"],
  },
] as const;

const ADDITIONAL_SERVICES = [
  "Landscaping",
  "Lawn care",
  "Snow removal",
  "Excavation",
  "Septic service",
  "Well service",
  "Concrete",
  "Driveway paving",
  "General contracting",
  "Painting",
  "Pressure washing",
  "Gutter installation and cleaning",
  "Siding",
  "Windows and doors",
  "Insulation",
  "Basement waterproofing",
  "Pest control",
  "Junk removal",
  "Dumpster rental",
  "House cleaning",
  "Appliance repair",
  "Handyman services",
  "Garage-door repair",
  "Fence installation",
  "Deck construction and repair",
] as const;

type CitySeed = {
  name: string;
  lat: number;
  lng: number;
  population?: number;
};

type CountySeed = {
  name: string;
  cities: CitySeed[];
};

const COUNTIES: CountySeed[] = [
  {
    name: "St. Lawrence County",
    cities: [
      { name: "Potsdam", lat: 44.6698, lng: -74.9813, population: 14776 },
      { name: "Canton", lat: 44.5956, lng: -75.1691, population: 11638 },
      { name: "Massena", lat: 44.9281, lng: -74.8919, population: 10236 },
      { name: "Ogdensburg", lat: 44.6942, lng: -75.4863, population: 10064 },
    ],
  },
  {
    name: "Franklin County",
    cities: [
      { name: "Malone", lat: 44.8487, lng: -74.2727, population: 14545 },
      { name: "Saranac Lake", lat: 44.3295, lng: -74.1313, population: 4887 },
      { name: "Tupper Lake", lat: 44.2234, lng: -74.4641, population: 3282 },
    ],
  },
  {
    name: "Jefferson County",
    cities: [
      { name: "Watertown", lat: 43.9748, lng: -75.9107, population: 24685 },
      { name: "Carthage", lat: 43.9812, lng: -75.6066, population: 3513 },
      { name: "Clayton", lat: 44.2395, lng: -76.0858, population: 1705 },
    ],
  },
  {
    name: "Clinton County",
    cities: [
      { name: "Plattsburgh", lat: 44.6995, lng: -73.4529, population: 19841 },
      { name: "Peru", lat: 44.5784, lng: -73.5268, population: 6772 },
      { name: "Champlain", lat: 44.9864, lng: -73.4465, population: 5574 },
    ],
  },
];

async function seedRolesAndPermissions() {
  const permissionRecords = await Promise.all(
    Object.values(PERMISSIONS).map((key) =>
      prisma.permission.upsert({
        where: { key },
        create: { key, description: key },
        update: {},
      }),
    ),
  );

  const permissionByKey = new Map(
    permissionRecords.map((p) => [p.key, p.id] as const),
  );

  for (const roleName of Object.keys(ROLE_PERMISSION_MAP) as RoleName[]) {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      create: {
        name: roleName,
        description: `${roleName} role`,
      },
      update: {},
    });

    for (const key of ROLE_PERMISSION_MAP[roleName]) {
      const permissionId = permissionByKey.get(key);
      if (!permissionId) continue;
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: { roleId: role.id, permissionId },
        },
        create: { roleId: role.id, permissionId },
        update: {},
      });
    }
  }
}

async function seedUsers() {
  const adminEmail =
    process.env.SEED_ADMIN_EMAIL?.toLowerCase() ?? "admin@example.com";
  const editorEmail =
    process.env.SEED_EDITOR_EMAIL?.toLowerCase() ?? "editor@example.com";
  const adminPassword =
    process.env.SEED_ADMIN_PASSWORD ?? "ChangeMeNow!123";
  const editorPassword =
    process.env.SEED_EDITOR_PASSWORD ?? "ChangeMeNow!123";

  const adminRole = await prisma.role.findUniqueOrThrow({
    where: { name: "ADMINISTRATOR" },
  });
  const editorRole = await prisma.role.findUniqueOrThrow({
    where: { name: "EDITOR" },
  });
  const homeownerRole = await prisma.role.findUniqueOrThrow({
    where: { name: "HOMEOWNER" },
  });

  async function upsertUser(
    email: string,
    name: string,
    password: string,
    roleId: string,
  ) {
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.upsert({
      where: { email },
      create: {
        email,
        name,
        passwordHash,
        emailVerified: new Date(),
        profile: { create: { displayName: name } },
        roles: { create: { roleId } },
      },
      update: {
        name,
        passwordHash,
      },
    });

    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId } },
      create: { userId: user.id, roleId },
      update: {},
    });

    return user;
  }

  await upsertUser(adminEmail, "Platform Admin", adminPassword, adminRole.id);
  await upsertUser(editorEmail, "Content Editor", editorPassword, editorRole.id);
  await upsertUser(
    "homeowner@example.com",
    "Sample Homeowner",
    "ChangeMeNow!123",
    homeownerRole.id,
  );
}

async function seedSettingsAndFlags() {
  await prisma.siteSetting.upsert({
    where: { key: SITE_SETTING_KEYS.SITE_NAME },
    create: {
      key: SITE_SETTING_KEYS.SITE_NAME,
      value: SITE_CONFIG.name,
      description: "Public site name",
    },
    update: { value: SITE_CONFIG.name },
  });
  await prisma.siteSetting.upsert({
    where: { key: SITE_SETTING_KEYS.SITE_TAGLINE },
    create: {
      key: SITE_SETTING_KEYS.SITE_TAGLINE,
      value: SITE_CONFIG.tagline,
      description: "Public tagline",
    },
    update: { value: SITE_CONFIG.tagline },
  });
  await prisma.siteSetting.upsert({
    where: { key: SITE_SETTING_KEYS.SUPPORT_EMAIL },
    create: {
      key: SITE_SETTING_KEYS.SUPPORT_EMAIL,
      value: SITE_CONFIG.supportEmail,
      description: "Support email",
    },
    update: {},
  });
  await prisma.siteSetting.upsert({
    where: { key: SITE_SETTING_KEYS.REVIEWS_ENABLED },
    create: {
      key: SITE_SETTING_KEYS.REVIEWS_ENABLED,
      value: false,
      description: "Reviews feature flag mirror",
    },
    update: { value: false },
  });
  await prisma.siteSetting.upsert({
    where: { key: SITE_SETTING_KEYS.LOCAL_PAGE_MIN_QUALITY_SCORE },
    create: {
      key: SITE_SETTING_KEYS.LOCAL_PAGE_MIN_QUALITY_SCORE,
      value: 70,
      description: "Minimum quality score for indexable local pages",
    },
    update: {},
  });
  await prisma.siteSetting.upsert({
    where: { key: SITE_SETTING_KEYS.LOCAL_PAGE_MIN_CONTENT_CHARS },
    create: {
      key: SITE_SETTING_KEYS.LOCAL_PAGE_MIN_CONTENT_CHARS,
      value: 600,
      description: "Minimum original content characters for local pages",
    },
    update: {},
  });
  await prisma.siteSetting.upsert({
    where: { key: SITE_SETTING_KEYS.LEAD_CONSENT_VERSION },
    create: {
      key: SITE_SETTING_KEYS.LEAD_CONSENT_VERSION,
      value: "2026-07-01",
      description: "Lead consent text version",
    },
    update: {},
  });
  await prisma.siteSetting.upsert({
    where: { key: SITE_SETTING_KEYS.LEAD_CONSENT_TEXT },
    create: {
      key: SITE_SETTING_KEYS.LEAD_CONSENT_TEXT,
      value:
        "DRAFT: By submitting this form you consent to be contacted about your project by matching service professionals. Attorney review required.",
      description: "Lead consent disclosure text",
    },
    update: {},
  });

  await prisma.featureFlag.upsert({
    where: { key: "reviews.enabled" },
    create: {
      key: "reviews.enabled",
      enabled: false,
      description: "Public reviews",
    },
    update: { enabled: false },
  });
  await prisma.featureFlag.upsert({
    where: { key: "ai.bulkGeneration" },
    create: {
      key: "ai.bulkGeneration",
      enabled: false,
      description: "AI bulk draft queue",
    },
    update: {},
  });
}

async function seedServices() {
  const category = await prisma.serviceCategory.upsert({
    where: { slug: "home-services" },
    create: {
      name: "Home Services",
      slug: "home-services",
      description: "Primary home service categories",
      status: "PUBLISHED",
      isActive: true,
      sortOrder: 1,
    },
    update: { status: "PUBLISHED", isActive: true },
  });

  let sortOrder = 1;
  for (const service of LAUNCH_SERVICES) {
    const parent = await prisma.service.upsert({
      where: { slug: service.slug },
      create: {
        categoryId: category.id,
        name: service.name,
        slug: service.slug,
        shortDescription: service.shortDescription,
        description: service.shortDescription,
        isLaunchFocus: true,
        isActive: true,
        status: "PUBLISHED",
        sortOrder,
        seoTitle: `${service.name} in Northern New York`,
        seoDescription: service.shortDescription,
      },
      update: {
        shortDescription: service.shortDescription,
        isLaunchFocus: true,
        isActive: true,
        status: "PUBLISHED",
        sortOrder,
      },
    });

    let childOrder = 1;
    for (const childName of service.children) {
      const childSlug = slugify(childName);
      await prisma.service.upsert({
        where: { slug: childSlug },
        create: {
          categoryId: category.id,
          parentId: parent.id,
          name: childName,
          slug: childSlug,
          shortDescription: `${childName} services.`,
          isLaunchFocus: true,
          isActive: true,
          status: "PUBLISHED",
          sortOrder: childOrder,
        },
        update: {
          parentId: parent.id,
          isActive: true,
          status: "PUBLISHED",
          sortOrder: childOrder,
        },
      });
      childOrder += 1;
    }
    sortOrder += 1;
  }

  for (const name of ADDITIONAL_SERVICES) {
    const slug = slugify(name);
    await prisma.service.upsert({
      where: { slug },
      create: {
        categoryId: category.id,
        name,
        slug,
        shortDescription: `${name} professionals in our coverage area.`,
        isLaunchFocus: false,
        isActive: true,
        status: "DRAFT",
        sortOrder: sortOrder++,
      },
      update: {
        name,
        isActive: true,
      },
    });
  }
}

async function seedLocations() {
  const usa = await prisma.location.upsert({
    where: { fullSlug: "united-states" },
    create: {
      type: "COUNTRY",
      name: "United States",
      slug: "united-states",
      fullSlug: "united-states",
      timezone: "America/New_York",
      isActive: true,
      status: "PUBLISHED",
      shortDescription: "United States coverage root.",
    },
    update: { isActive: true, status: "PUBLISHED" },
  });

  const ny = await prisma.location.upsert({
    where: { fullSlug: "new-york" },
    create: {
      parentId: usa.id,
      type: "STATE",
      name: "New York",
      slug: "new-york",
      fullSlug: "new-york",
      stateCode: "NY",
      timezone: "America/New_York",
      isActive: true,
      status: "PUBLISHED",
      shortDescription:
        "New York State — initial focus on the North Country counties.",
      climateNotes:
        "Cold winters with heavy snow inland; freeze-thaw cycles affect roofs, pipes, and driveways.",
      seoTitle: "Home services in New York",
      seoDescription:
        "Find local home service professionals across New York State.",
    },
    update: {
      parentId: usa.id,
      isActive: true,
      status: "PUBLISHED",
    },
  });

  for (const county of COUNTIES) {
    const countySlug = slugify(county.name.replace(/ County$/i, "") + "-county");
    const countyFullSlug = `new-york/${countySlug}`;
    const countyRow = await prisma.location.upsert({
      where: { fullSlug: countyFullSlug },
      create: {
        parentId: ny.id,
        type: "COUNTY",
        name: county.name,
        slug: countySlug,
        fullSlug: countyFullSlug,
        stateCode: "NY",
        countyName: county.name,
        timezone: "America/New_York",
        isActive: true,
        status: "PUBLISHED",
        shortDescription: `${county.name}, New York — part of the initial North Country market.`,
        climateNotes:
          "Expect heavy snowfall, ice dams, and cold-weather HVAC demand from November through March.",
      },
      update: {
        parentId: ny.id,
        isActive: true,
        status: "PUBLISHED",
      },
    });

    for (const city of county.cities) {
      const citySlug = slugify(city.name);
      const cityFullSlug = `new-york/${countySlug}/${citySlug}`;
      await prisma.location.upsert({
        where: { fullSlug: cityFullSlug },
        create: {
          parentId: countyRow.id,
          type: "CITY",
          name: city.name,
          slug: citySlug,
          fullSlug: cityFullSlug,
          stateCode: "NY",
          countyName: county.name,
          latitude: city.lat,
          longitude: city.lng,
          population: city.population,
          timezone: "America/New_York",
          isActive: true,
          status: "PUBLISHED",
          shortDescription: `${city.name}, NY in ${county.name}.`,
          climateNotes:
            "Northern New York winters: snow load, frozen pipes, and heating reliability are common homeowner concerns.",
          seoTitle: `Home services in ${city.name}, NY`,
          seoDescription: `Find local home service professionals in ${city.name}, New York.`,
        },
        update: {
          parentId: countyRow.id,
          latitude: city.lat,
          longitude: city.lng,
          population: city.population,
          isActive: true,
          status: "PUBLISHED",
        },
      });
    }
  }
}

async function seedPlans() {
  const plans = [
    {
      name: "Free",
      slug: "free",
      priceCents: 0,
      entitlements: {
        leadEligible: false,
        maxPhotos: 3,
        featured: false,
      },
      sortOrder: 1,
    },
    {
      name: "Standard",
      slug: "standard",
      priceCents: 9900,
      entitlements: {
        leadEligible: true,
        maxPhotos: 20,
        featured: false,
        analytics: true,
      },
      sortOrder: 2,
    },
    {
      name: "Premium",
      slug: "premium",
      priceCents: 24900,
      entitlements: {
        leadEligible: true,
        maxPhotos: 50,
        featured: true,
        analytics: true,
        priorityLeads: true,
      },
      sortOrder: 3,
    },
    {
      name: "Exclusive Territory",
      slug: "exclusive-territory",
      priceCents: 49900,
      entitlements: {
        leadEligible: true,
        exclusiveEligible: true,
        featured: true,
        analytics: true,
      },
      sortOrder: 4,
    },
  ];

  for (const plan of plans) {
    await prisma.subscriptionPlan.upsert({
      where: { slug: plan.slug },
      create: {
        name: plan.name,
        slug: plan.slug,
        priceCents: plan.priceCents,
        entitlements: plan.entitlements,
        sortOrder: plan.sortOrder,
        isActive: true,
        description: `${plan.name} contractor plan`,
      },
      update: {
        priceCents: plan.priceCents,
        entitlements: plan.entitlements,
        isActive: true,
      },
    });
  }
}

async function main() {
  console.info("Seeding North Country Home Services…");
  await seedRolesAndPermissions();
  await seedUsers();
  await seedSettingsAndFlags();
  await seedServices();
  await seedLocations();
  await seedPlans();
  await prisma.auditLog.create({
    data: {
      action: "seed.completed",
      entityType: "System",
      metadata: { phase: 1 },
    },
  });
  console.info("Seed complete.");
  console.info(
    `Admin: ${process.env.SEED_ADMIN_EMAIL ?? "admin@example.com"} / (SEED_ADMIN_PASSWORD)`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
