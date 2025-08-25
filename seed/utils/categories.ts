import type { SeedClient, service_categoriesScalars } from "@snaplet/seed";

/**
 * Creates main service categories for the platform
 * These are the top-level categories that organize all services
 */
export async function createMainServiceCategories(seed: SeedClient) {
  console.log("-- Creating main service categories...");

  const { service_categories: mainCategories } = await seed.service_categories([
    {
      name: "Hår",
      description: "Hårtjenester inkludert klipp, farge og styling",
    },
    {
      name: "Negler",
      description: "Manikyr, pedikyr og negledesign",
    },
    {
      name: "Makeup",
      description: "Profesjonell makeup for alle anledninger",
    },
    {
      name: "Bryn & Vipper",
      description: "Forming av bryn og vippeextensions",
    },
    {
      name: "Bryllup",
      description: "Spesialtjenester for bryllup",
    },
  ]);

  return mainCategories;
}

/**
 * Creates subcategories that provide more specific service categorization
 * Each subcategory belongs to a main category
 */
export async function createServiceSubcategories(
  seed: SeedClient,
  mainCategories: service_categoriesScalars[],
) {
  console.log("-- Creating service subcategories...");

  await seed.service_categories([
    {
      name: "Herreklipp",
      description: "Klipp og styling for menn",
      parent_category_id: mainCategories[0].id,
    },
    {
      name: "Dameklipp",
      description: "Klipp og styling for damer",
      parent_category_id: mainCategories[0].id,
    },
    {
      name: "Farge & Striper",
      description: "Hårfarge, striper og balayage",
      parent_category_id: mainCategories[0].id,
    },
    {
      name: "Gellack",
      description: "Holdbar gellakk manikyr",
      parent_category_id: mainCategories[1].id,
    },
    {
      name: "Negleextensions",
      description: "Forlengelse av negler",
      parent_category_id: mainCategories[1].id,
    },
    {
      name: "Dagsmakeup",
      description: "Naturlig makeup for hverdagen",
      parent_category_id: mainCategories[2].id,
    },
    {
      name: "Festmakeup",
      description: "Glamorøs makeup for spesielle anledninger",
      parent_category_id: mainCategories[2].id,
    },
    {
      name: "Vippeextensions",
      description: "Profesjonelle vippeextensions",
      parent_category_id: mainCategories[3].id,
    },
    {
      name: "Brynslaminering",
      description: "Laminering og forming av bryn",
      parent_category_id: mainCategories[3].id,
    },
    {
      name: "Brudemakeup",
      description: "Spesialmakeup for bruden",
      parent_category_id: mainCategories[4].id,
    },
    {
      name: "Brudefrisyre",
      description: "Frisyre for bruden",
      parent_category_id: mainCategories[4].id,
    },
  ]);
}
