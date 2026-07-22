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

async function seedSampleBusinesses() {
  const freePlan = await prisma.subscriptionPlan.findUnique({
    where: { slug: "free" },
  });
  const standardPlan = await prisma.subscriptionPlan.findUnique({
    where: { slug: "standard" },
  });

  const roofing = await prisma.service.findUnique({ where: { slug: "roofing" } });
  const plumbing = await prisma.service.findUnique({
    where: { slug: "plumbing" },
  });
  const hvac = await prisma.service.findUnique({ where: { slug: "hvac" } });
  const electrical = await prisma.service.findUnique({
    where: { slug: "electrical" },
  });
  const treeRemoval = await prisma.service.findUnique({
    where: { slug: "tree-removal" },
  });

  const city = async (slug: string) =>
    prisma.location.findFirst({ where: { slug, type: "CITY" } });

  const potsdam = await city("potsdam");
  const canton = await city("canton");
  const massena = await city("massena");
  const ogdensburg = await city("ogdensburg");
  const malone = await city("malone");
  const watertown = await city("watertown");
  const plattsburgh = await city("plattsburgh");

  if (!roofing || !plumbing || !hvac || !electrical || !treeRemoval) {
    console.warn("Skipping business seed — services missing");
    return;
  }

  const samples: Array<{
    name: string;
    slug: string;
    description: string;
    city: string;
    stateCode: string;
    postalCode: string;
    phone: string;
    website?: string;
    addressLine1?: string;
    isServiceAreaBusiness: boolean;
    offersEmergency: boolean;
    offersFreeEstimate: boolean;
    offersFinancing?: boolean;
    yearEstablished: number;
    licenseDetails?: string;
    insuranceDetails?: string;
    verificationStatus: "UNVERIFIED" | "BUSINESS_VERIFIED" | "PLATFORM_VERIFIED";
    claimStatus: "UNCLAIMED";
    isFeatured: boolean;
    planId?: string;
    serviceIds: string[];
    locationIds: string[];
  }> = [
    {
      name: "Sample North Country Roofing",
      slug: "sample-north-country-roofing",
      description:
        "SAMPLE DATA: Fictional roofing contractor used for development. Specializes in asphalt and metal roofs suited to heavy snow loads.",
      city: "Potsdam",
      stateCode: "NY",
      postalCode: "13676",
      phone: "(315) 555-0101",
      website: "https://example.com/sample-roofing",
      isServiceAreaBusiness: true,
      offersEmergency: true,
      offersFreeEstimate: true,
      yearEstablished: 2008,
      licenseDetails: "Self-reported sample license #NY-ROOF-0000 (not real)",
      insuranceDetails: "Self-reported general liability (sample only)",
      verificationStatus: "UNVERIFIED",
      claimStatus: "UNCLAIMED",
      isFeatured: true,
      planId: standardPlan?.id ?? freePlan?.id,
      serviceIds: [roofing.id],
      locationIds: [potsdam?.id, canton?.id, massena?.id].filter(
        (id): id is string => Boolean(id),
      ),
    },
    {
      name: "Sample Seaway Plumbing Co.",
      slug: "sample-seaway-plumbing",
      description:
        "SAMPLE DATA: Fictional plumber serving St. Lawrence County. Listed for UI and lead-routing tests only.",
      city: "Canton",
      stateCode: "NY",
      postalCode: "13617",
      phone: "(315) 555-0142",
      isServiceAreaBusiness: true,
      offersEmergency: true,
      offersFreeEstimate: true,
      offersFinancing: false,
      yearEstablished: 2015,
      verificationStatus: "BUSINESS_VERIFIED",
      claimStatus: "UNCLAIMED",
      isFeatured: false,
      planId: freePlan?.id,
      serviceIds: [plumbing.id],
      locationIds: [canton?.id, potsdam?.id, ogdensburg?.id].filter(
        (id): id is string => Boolean(id),
      ),
    },
    {
      name: "Sample Adirondack HVAC",
      slug: "sample-adirondack-hvac",
      description:
        "SAMPLE DATA: Fictional heating and cooling company for Malone and nearby towns.",
      city: "Malone",
      stateCode: "NY",
      postalCode: "12953",
      phone: "(518) 555-0188",
      isServiceAreaBusiness: true,
      offersEmergency: true,
      offersFreeEstimate: true,
      yearEstablished: 2011,
      verificationStatus: "UNVERIFIED",
      claimStatus: "UNCLAIMED",
      isFeatured: true,
      planId: standardPlan?.id ?? freePlan?.id,
      serviceIds: [hvac.id],
      locationIds: [malone?.id].filter((id): id is string => Boolean(id)),
    },
    {
      name: "Sample River Electric",
      slug: "sample-river-electric",
      description:
        "SAMPLE DATA: Fictional electrician covering Watertown-area residential work.",
      city: "Watertown",
      stateCode: "NY",
      postalCode: "13601",
      phone: "(315) 555-0199",
      isServiceAreaBusiness: false,
      addressLine1: "100 Sample Street",
      offersEmergency: false,
      offersFreeEstimate: true,
      yearEstablished: 2001,
      verificationStatus: "PLATFORM_VERIFIED",
      claimStatus: "UNCLAIMED",
      isFeatured: false,
      planId: standardPlan?.id ?? freePlan?.id,
      serviceIds: [electrical.id],
      locationIds: [watertown?.id].filter((id): id is string => Boolean(id)),
    },
    {
      name: "Sample Northwoods Tree Care",
      slug: "sample-northwoods-tree-care",
      description:
        "SAMPLE DATA: Fictional tree removal and storm cleanup crew for Clinton County.",
      city: "Plattsburgh",
      stateCode: "NY",
      postalCode: "12901",
      phone: "(518) 555-0160",
      isServiceAreaBusiness: true,
      offersEmergency: true,
      offersFreeEstimate: true,
      yearEstablished: 2018,
      verificationStatus: "UNVERIFIED",
      claimStatus: "UNCLAIMED",
      isFeatured: false,
      planId: freePlan?.id,
      serviceIds: [treeRemoval.id],
      locationIds: [plattsburgh?.id].filter((id): id is string => Boolean(id)),
    },
  ];

  for (const sample of samples) {
    const business = await prisma.business.upsert({
      where: { slug: sample.slug },
      create: {
        name: sample.name,
        slug: sample.slug,
        description: sample.description,
        city: sample.city,
        stateCode: sample.stateCode,
        postalCode: sample.postalCode,
        phone: sample.phone,
        website: sample.website,
        addressLine1: sample.addressLine1,
        isServiceAreaBusiness: sample.isServiceAreaBusiness,
        offersEmergency: sample.offersEmergency,
        offersFreeEstimate: sample.offersFreeEstimate,
        offersFinancing: sample.offersFinancing ?? false,
        yearEstablished: sample.yearEstablished,
        licenseDetails: sample.licenseDetails,
        insuranceDetails: sample.insuranceDetails,
        verificationStatus: sample.verificationStatus,
        claimStatus: sample.claimStatus,
        publishStatus: "PUBLISHED",
        isFeatured: sample.isFeatured,
        isSponsored: false,
        isSampleData: true,
        subscriptionPlanId: sample.planId,
        servesResidential: true,
        profileCompleteness: 70,
      },
      update: {
        description: sample.description,
        publishStatus: "PUBLISHED",
        isSampleData: true,
        isFeatured: sample.isFeatured,
        verificationStatus: sample.verificationStatus,
      },
    });

    for (const serviceId of sample.serviceIds) {
      await prisma.businessService.upsert({
        where: {
          businessId_serviceId: { businessId: business.id, serviceId },
        },
        create: { businessId: business.id, serviceId },
        update: {},
      });
    }

    for (const locationId of sample.locationIds) {
      await prisma.businessServiceArea.upsert({
        where: {
          businessId_locationId: { businessId: business.id, locationId },
        },
        create: { businessId: business.id, locationId },
        update: {},
      });
    }

    await prisma.businessLeadPreference.upsert({
      where: { businessId: business.id },
      create: {
        businessId: business.id,
        acceptsLeads: true,
        pauseLeads: false,
        notifyEmail: true,
      },
      update: {},
    });
  }
}

async function seedLocalServicePages() {
  const combos = [
    {
      serviceSlug: "roofing",
      citySlug: "potsdam",
      h1: "Roofing in Potsdam, NY",
      introduction:
        "Potsdam homeowners deal with heavy lake-effect snow, ice dams, and freeze-thaw cycles that stress asphalt and metal roofs. This page helps you understand local roofing needs and find professionals who list Potsdam in their service area.",
      serviceExplanation:
        "Roofing work in the North Country often includes repair of storm damage, full replacements, ice-and-water shield upgrades, and ventilation improvements that reduce ice dam risk.",
      localProblems:
        "Common local issues include ice dams along eaves, wind-driven snow infiltration, aging three-tab shingles, and moisture problems in attics after long winters.",
      seasonalNotes:
        "Emergency tarp and repair demand rises after winter storms. Full replacements are most practical from late spring through early fall when temperatures support proper shingle sealing.",
      projectFactors:
        "Project scope depends on roof pitch, layers to tear off, chimney flashing condition, ventilation, and material choice (asphalt vs. metal for snow shedding).",
      priceRangeLow: 9000,
      priceRangeHigh: 28000,
      publish: true,
    },
    {
      serviceSlug: "plumbing",
      citySlug: "canton",
      h1: "Plumbing in Canton, NY",
      introduction:
        "Canton’s cold winters increase the risk of frozen pipes, water heater failures, and urgent drain issues. Use this page to learn what local plumbing projects typically involve and which listed businesses serve Canton.",
      serviceExplanation:
        "Residential plumbing covers leak repair, drain clearing, fixture replacement, water heaters, and emergency shutoff response when pipes freeze.",
      localProblems:
        "Homeowners often call for frozen supply lines, aging galvanized piping, sump pump failures during spring thaw, and water heaters struggling in older homes.",
      seasonalNotes:
        "Freeze protection and outdoor faucet shutdown matter each fall. Mid-winter emergencies should prioritize thawing and leak containment before cosmetic repairs.",
      projectFactors:
        "Costs vary with access to pipes, whether walls or floors must be opened, water quality, and whether a repair or full line replacement is needed.",
      priceRangeLow: 150,
      priceRangeHigh: 4500,
      publish: true,
    },
    {
      serviceSlug: "hvac",
      citySlug: "malone",
      h1: "Heating and HVAC in Malone, NY",
      introduction:
        "Malone winters put continuous demand on furnaces, boilers, and heat pumps. This guide covers local heating considerations and connects you to HVAC businesses that list Malone as a service area.",
      serviceExplanation:
        "HVAC service includes furnace repair, boiler maintenance, filter changes, thermostat upgrades, and seasonal tune-ups that help systems survive long heating seasons.",
      localProblems:
        "Typical issues include ignition failures on cold mornings, uneven heat in older farmhouses, and systems oversized or undersized for poorly insulated homes.",
      seasonalNotes:
        "Schedule maintenance before heating season. Mid-winter no-heat calls are common; keep furnace filters accessible and know your emergency shutoffs.",
      projectFactors:
        "Fuel type, duct condition, insulation, and home square footage strongly influence repair versus replacement decisions.",
      priceRangeLow: 200,
      priceRangeHigh: 12000,
      publish: true,
    },
    {
      serviceSlug: "electrical",
      citySlug: "watertown",
      h1: "Electrical services in Watertown, NY",
      introduction:
        "Watertown homes range from older downtown properties to newer builds — electrical needs vary accordingly. This page explains common projects and lists electricians serving the area.",
      serviceExplanation:
        "Electrical work may include panel upgrades, outlet additions, generator interlocks, lighting, and troubleshooting intermittent breaker trips.",
      localProblems:
        "Homeowners often need panel capacity upgrades, GFCI protection in wet areas, and safer wiring replacements in mid-century homes.",
      seasonalNotes:
        "Generator interest rises before winter storms. Indoor projects can proceed year-round; outdoor lighting and service mast work may wait for milder weather.",
      projectFactors:
        "Age of wiring, panel amperage, permitting, and whether the home has aluminum branch circuits all affect scope.",
      priceRangeLow: 150,
      priceRangeHigh: 8000,
      publish: false,
    },
    {
      serviceSlug: "tree-removal",
      citySlug: "plattsburgh",
      h1: "Tree removal in Plattsburgh, NY",
      introduction:
        "Plattsburgh’s mix of residential lots and wind exposure means storm-damaged and hazardous trees need careful removal. Learn what affects tree work locally and which sample crews list this area.",
      serviceExplanation:
        "Tree services include removal, pruning, stump grinding, and storm cleanup. Crews should plan drop zones carefully near homes and power lines.",
      localProblems:
        "Ice and wind damage, trees planted too close to foundations, and dead ash or softwood species are frequent concerns.",
      seasonalNotes:
        "Storm cleanup spikes after high-wind events. Frozen ground can help protect lawns during winter removals, while leaf-off season improves visibility.",
      projectFactors:
        "Tree height, proximity to structures, access for chippers, and whether the stump is ground afterward drive cost and scheduling.",
      priceRangeLow: 400,
      priceRangeHigh: 3500,
      publish: true,
    },
  ];

  for (const combo of combos) {
    const service = await prisma.service.findUnique({
      where: { slug: combo.serviceSlug },
    });
    const location = await prisma.location.findFirst({
      where: { slug: combo.citySlug, type: "CITY" },
    });
    if (!service || !location) continue;

    const slugPath = `new-york/${combo.citySlug}/${combo.serviceSlug}`;
    const contentChars = [
      combo.introduction,
      combo.serviceExplanation,
      combo.localProblems,
      combo.seasonalNotes,
      combo.projectFactors,
    ].join(" ").length;

    const businessCount = await prisma.business.count({
      where: {
        publishStatus: "PUBLISHED",
        deletedAt: null,
        services: { some: { serviceId: service.id } },
        serviceAreas: { some: { locationId: location.id } },
      },
    });

    const qualityScore = Math.min(
      100,
      40 + Math.floor(contentChars / 40) + (businessCount > 0 ? 20 : 0),
    );
    const isIndexable =
      combo.publish && qualityScore >= 70 && businessCount > 0;

    const page = await prisma.localServicePage.upsert({
      where: { slugPath },
      create: {
        serviceId: service.id,
        locationId: location.id,
        slugPath,
        h1: combo.h1,
        introduction: combo.introduction,
        serviceExplanation: combo.serviceExplanation,
        localProblems: combo.localProblems,
        seasonalNotes: combo.seasonalNotes,
        projectFactors: combo.projectFactors,
        priceRangeLow: combo.priceRangeLow,
        priceRangeHigh: combo.priceRangeHigh,
        priceDisclaimer:
          "Estimates only. Actual prices vary. Not a bid or professional appraisal.",
        status: combo.publish ? "PUBLISHED" : "DRAFT",
        qualityScore,
        isIndexable,
        indexDirective: isIndexable ? "INDEX" : "NOINDEX",
        seoTitle: `${combo.h1} | Local professionals`,
        seoDescription: combo.introduction.slice(0, 155),
        canonicalPath: `/${slugPath}`,
        lastReviewedAt: combo.publish ? new Date() : null,
        reviewedByName: combo.publish ? "Seed Editor" : null,
        publishedAt: combo.publish ? new Date() : null,
      },
      update: {
        introduction: combo.introduction,
        serviceExplanation: combo.serviceExplanation,
        localProblems: combo.localProblems,
        seasonalNotes: combo.seasonalNotes,
        projectFactors: combo.projectFactors,
        qualityScore,
        isIndexable,
        indexDirective: isIndexable ? "INDEX" : "NOINDEX",
        status: combo.publish ? "PUBLISHED" : "DRAFT",
      },
    });

    await prisma.fAQ.deleteMany({ where: { localServicePageId: page.id } });
    await prisma.fAQ.createMany({
      data: [
        {
          question: `How do I choose a ${service.name.toLowerCase()} professional in ${location.name}?`,
          answer:
            "Compare published profiles, confirm they list your town in their service area, ask about insurance and licensing documentation, and request written estimates. This platform does not invent ratings.",
          sortOrder: 1,
          serviceId: service.id,
          locationId: location.id,
          localServicePageId: page.id,
          isActive: true,
        },
        {
          question: "Are the prices on this page guarantees?",
          answer:
            "No. Ranges are educational estimates only. Final pricing depends on an on-site assessment by a contractor.",
          sortOrder: 2,
          serviceId: service.id,
          locationId: location.id,
          localServicePageId: page.id,
          isActive: true,
        },
      ],
    });
  }
}

async function seedLeadRouting() {
  const roofing = await prisma.service.findUnique({ where: { slug: "roofing" } });
  const plumbing = await prisma.service.findUnique({
    where: { slug: "plumbing" },
  });

  await prisma.leadRoutingRule.deleteMany({
    where: { name: { in: ["Default shared", "Roofing shared", "Plumbing shared"] } },
  });

  await prisma.leadRoutingRule.createMany({
    data: [
      {
        name: "Default shared",
        isActive: true,
        priority: 100,
        mode: "SHARED",
        maxRecipients: 3,
        acceptanceMins: 120,
      },
      {
        name: "Roofing shared",
        isActive: true,
        priority: 10,
        mode: "SHARED",
        serviceId: roofing?.id,
        maxRecipients: 3,
        acceptanceMins: 90,
      },
      {
        name: "Plumbing shared",
        isActive: true,
        priority: 10,
        mode: "SHARED",
        serviceId: plumbing?.id,
        maxRecipients: 2,
        acceptanceMins: 60,
      },
    ],
  });

  await prisma.leadPricingRule.deleteMany({
    where: { name: { in: ["Shared default", "Exclusive default"] } },
  });

  await prisma.leadPricingRule.createMany({
    data: [
      {
        name: "Shared default",
        mode: "SHARED",
        priceCents: 2500,
        isActive: true,
      },
      {
        name: "Exclusive default",
        mode: "EXCLUSIVE",
        priceCents: 7500,
        isActive: true,
      },
    ],
  });
}

async function seedBusinessOwnerAccess() {
  const businessOwnerRole = await prisma.role.findUniqueOrThrow({
    where: { name: "BUSINESS_OWNER" },
  });
  const passwordHash = await bcrypt.hash("ChangeMeNow!123", 12);

  const owner = await prisma.user.upsert({
    where: { email: "business@example.com" },
    create: {
      email: "business@example.com",
      name: "Sample Business Owner",
      passwordHash,
      emailVerified: new Date(),
      profile: { create: { displayName: "Sample Business Owner" } },
      roles: { create: { roleId: businessOwnerRole.id } },
    },
    update: { passwordHash, name: "Sample Business Owner" },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: { userId: owner.id, roleId: businessOwnerRole.id },
    },
    create: { userId: owner.id, roleId: businessOwnerRole.id },
    update: {},
  });

  const businesses = await prisma.business.findMany({
    where: { isSampleData: true },
    select: { id: true },
  });

  for (const business of businesses) {
    await prisma.businessMember.upsert({
      where: {
        businessId_userId: { businessId: business.id, userId: owner.id },
      },
      create: {
        businessId: business.id,
        userId: owner.id,
        title: "Owner",
        isPrimary: true,
      },
      update: { isPrimary: true },
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
  await seedSampleBusinesses();
  await seedLocalServicePages();
  await seedLeadRouting();
  await seedBusinessOwnerAccess();
  await prisma.auditLog.create({
    data: {
      action: "seed.completed",
      entityType: "System",
      metadata: { phase: 3 },
    },
  });
  console.info("Seed complete.");
  console.info(
    `Admin: ${process.env.SEED_ADMIN_EMAIL ?? "admin@example.com"} / (SEED_ADMIN_PASSWORD)`,
  );
  console.info("Business owner: business@example.com / ChangeMeNow!123");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
