import type {
  SeedClient,
  service_categoriesScalars,
  servicesScalars,
  usersScalars,
} from "@snaplet/seed";
import type { DatabaseTables } from "../../types/index";
import {
  categoryIncludes,
  categoryRequirements,
  getRandomImagesForCategory,
  getRandomItemsFromArray,
  ServiceCategoryKey,
} from "./shared";

// Service templates for generating randomized services
export const serviceTemplates: Array<{
  title: string;
  description: string;
  category: ServiceCategoryKey;
  categoryIndex: number; // For linking to main categories array
  duration: number[];
}> = [
  // Hair Services
  {
    title: "Dameklipp",
    description: "Profesjonell klipp med vask og føn. Konsultasjon inkludert.",
    category: "hair",
    categoryIndex: 0,
    duration: [45, 60, 75],
  },
  {
    title: "Herreklipp",
    description: "Moderne herreklipp med styling. Inkluderer vask og føn.",
    category: "hair",
    categoryIndex: 0,
    duration: [30, 45, 60],
  },
  {
    title: "Balayage farge",
    description: "Moderne fargeteknikk for naturlig solkysset hår",
    category: "hair",
    categoryIndex: 0,
    duration: [120, 150, 180],
  },
  {
    title: "Highlights",
    description: "Striper som gir dimensjon og glans til håret",
    category: "hair",
    categoryIndex: 0,
    duration: [90, 120, 150],
  },
  {
    title: "Hårfarge",
    description: "Permanent hårfarge i ønsket nyanse",
    category: "hair",
    categoryIndex: 0,
    duration: [90, 120, 150],
  },
  {
    title: "Føn og styling",
    description: "Profesjonell føn med styling for spesielle anledninger",
    category: "hair",
    categoryIndex: 0,
    duration: [30, 45, 60],
  },
  {
    title: "Permanent",
    description: "Permanent for krøller og volum",
    category: "hair",
    categoryIndex: 0,
    duration: [120, 150, 180],
  },
  {
    title: "Hårbehandling",
    description: "Intensive behandling for skadet hår",
    category: "hair",
    categoryIndex: 0,
    duration: [45, 60, 90],
  },

  // Nail Services
  {
    title: "Gellack manikyr",
    description: "Holdbar gellakk manikyr som varer i uker",
    category: "nails",
    categoryIndex: 1,
    duration: [60, 75, 90],
  },
  {
    title: "Gellack med design",
    description: "Holdbar gellack med kreativt negledesign",
    category: "nails",
    categoryIndex: 1,
    duration: [75, 90, 105],
  },
  {
    title: "Franske negler",
    description: "Klassisk fransk manikyr for elegant look",
    category: "nails",
    categoryIndex: 1,
    duration: [45, 60, 75],
  },
  {
    title: "Akryl negler",
    description: "Forsterkning og forlengelse med akryl",
    category: "nails",
    categoryIndex: 1,
    duration: [90, 120, 150],
  },
  {
    title: "Pedikyr",
    description: "Komplett pedikyr med neglepleje",
    category: "nails",
    categoryIndex: 1,
    duration: [60, 75, 90],
  },
  {
    title: "Negleforlengelse",
    description: "Forlengelse av negler for ønsket lengde",
    category: "nails",
    categoryIndex: 1,
    duration: [90, 120, 150],
  },
  {
    title: "Shellac behandling",
    description: "Langtidsholdbar neglelakk behandling",
    category: "nails",
    categoryIndex: 1,
    duration: [45, 60, 75],
  },

  // Makeup Services
  {
    title: "Festmakeup",
    description: "Glamorøs makeup perfekt for fest og spesielle anledninger",
    category: "makeup",
    categoryIndex: 2,
    duration: [45, 60, 75],
  },
  {
    title: "Dagsmakeup",
    description: "Naturlig makeup for hverdagen",
    category: "makeup",
    categoryIndex: 2,
    duration: [30, 45, 60],
  },
  {
    title: "Brude makeup",
    description: "Perfekt makeup for din store dag",
    category: "makeup",
    categoryIndex: 2,
    duration: [60, 90, 120],
  },
  {
    title: "Foto makeup",
    description: "Makeup optimalisert for fotografering",
    category: "makeup",
    categoryIndex: 2,
    duration: [45, 60, 75],
  },
  {
    title: "Makeup kurs",
    description: "Lær å sminke deg selv som en proff",
    category: "makeup",
    categoryIndex: 2,
    duration: [90, 120, 150],
  },
  {
    title: "Kontur makeup",
    description: "Avansert konturering for skulpturerte fasader",
    category: "makeup",
    categoryIndex: 2,
    duration: [60, 75, 90],
  },

  // Brows & Lashes Services
  {
    title: "Klassiske vippeextensions",
    description: "Naturlige vippeextensions for en elegant look",
    category: "browsLashes",
    categoryIndex: 3,
    duration: [90, 120, 150],
  },
  {
    title: "Volum vippeextensions",
    description: "Fyldige volum-vipper for dramatisk effekt",
    category: "browsLashes",
    categoryIndex: 3,
    duration: [120, 150, 180],
  },
  {
    title: "Brynslaminering",
    description: "Laminering og forming av bryn for perfekt form",
    category: "browsLashes",
    categoryIndex: 3,
    duration: [45, 60, 75],
  },
  {
    title: "Brynsfarge",
    description: "Farging av bryn for definert look",
    category: "browsLashes",
    categoryIndex: 3,
    duration: [30, 45, 60],
  },
  {
    title: "Brynspluking",
    description: "Profesjonell forming av bryn",
    category: "browsLashes",
    categoryIndex: 3,
    duration: [30, 45, 60],
  },
  {
    title: "Vippelift",
    description: "Permanent krøll av naturlige vipper",
    category: "browsLashes",
    categoryIndex: 3,
    duration: [60, 75, 90],
  },
  {
    title: "Hybrid vipper",
    description: "Kombinasjon av klassiske og volum vipper",
    category: "browsLashes",
    categoryIndex: 3,
    duration: [105, 120, 135],
  },

  // Wedding Services
  {
    title: "Brudefrisyre",
    description: "Eksklusiv styling for din store dag. Prøvetime inkludert.",
    category: "wedding",
    categoryIndex: 4,
    duration: [90, 120, 150],
  },
  {
    title: "Brudemakeup komplett",
    description: "Komplett brudemakeup med prøvetime",
    category: "wedding",
    categoryIndex: 4,
    duration: [120, 150, 180],
  },
  {
    title: "Brudepakke",
    description: "Komplett pakke med makeup og hår for bruden",
    category: "wedding",
    categoryIndex: 4,
    duration: [180, 210, 240],
  },
  {
    title: "Brudesminke prøve",
    description: "Prøvetime for brudemakeup",
    category: "wedding",
    categoryIndex: 4,
    duration: [75, 90, 120],
  },
  {
    title: "Bryllupsgjester styling",
    description: "Makeup og hår for bryllupsgjester",
    category: "wedding",
    categoryIndex: 4,
    duration: [60, 75, 90],
  },
];

/**
 * Generates randomized services based on templates for all stylists
 * Each service gets random pricing, duration, and includes/requirements
 */
export async function createRandomizedServices(
  seed: SeedClient,
  stylistUsers: usersScalars[],
  mainCategories: service_categoriesScalars[],
) {
  console.log("-- Creating randomized services from templates...");

  const servicesToCreate = [];
  const serviceCategoryLinks: { service_id: string; category_id: string }[] =
    [];

  // Generate 55 randomized services
  for (let i = 0; i < 55; i++) {
    const template =
      serviceTemplates[Math.floor(Math.random() * serviceTemplates.length)];
    const stylist =
      stylistUsers[Math.floor(Math.random() * stylistUsers.length)];
    const basePrice = 800 + Math.floor(Math.random() * 2200); // 800-3000 NOK
    const duration =
      template.duration[Math.floor(Math.random() * template.duration.length)];

    // Add some variation to titles to avoid duplicates
    const variation = i > serviceTemplates.length
      ? ` ${Math.floor(i / serviceTemplates.length) + 1}`
      : "";

    // Get random includes and requirements for this category
    const includes = getRandomItemsFromArray(
      categoryIncludes[template.category],
      3,
      6,
    );
    const requirements = getRandomItemsFromArray(
      categoryRequirements[template.category],
      2,
      4,
    );
    const offerHomeService = Math.random() > 0.3; // 70% offer home service

    const service: DatabaseTables["services"]["Insert"] = {
      stylist_id: stylist.id,
      title: template.title + variation,
      description: template.description,
      price: basePrice,
      currency: "NOK",
      duration_minutes: duration,
      is_published: Math.random() > 0.1, // 90% published
      at_customer_place: offerHomeService,
      at_stylist_place: Math.random() > 0.2, // 80% offer at salon
      includes: includes,
      requirements: offerHomeService ? requirements : undefined, // Only add requirements if home service is offered
    };

    servicesToCreate.push(service);
  }

  const { services } = await seed.services(servicesToCreate);

  // Create service-category relationships
  services.forEach((service, index) => {
    const template = serviceTemplates[index % serviceTemplates.length];
    const serviceId = service.id;
    const categoryId = mainCategories[template.categoryIndex].id;

    if (serviceId && categoryId) {
      serviceCategoryLinks.push({
        service_id: serviceId,
        category_id: categoryId,
      });
    }
  });

  // Link services to categories
  await seed.service_service_categories(serviceCategoryLinks);

  return { services, serviceCategoryLinks };
}

/**
 * Adds curated images to services based on their category
 * Each service gets 3-5 relevant images from the curated collection
 */
export async function addImagesToServices(
  seed: SeedClient,
  services: servicesScalars[],
) {
  console.log("-- Adding curated images to services...");

  for (let i = 0; i < services.length; i++) {
    const service = services[i];
    const template = serviceTemplates[i % serviceTemplates.length];

    // Get 3-5 random images from the appropriate category
    const imageCount = Math.floor(Math.random() * 3) + 3; // 3-5 images
    const images = getRandomImagesForCategory(template.category, imageCount);

    console.log(
      `-- Using ${images.length} curated images for service: ${service.title}`,
    );

    // Create media entries for each image
    const mediaData: DatabaseTables["media"]["Insert"][] = images.map((
      imageUrl,
      index: number,
    ) => ({
      service_id: service.id,
      file_path: imageUrl,
      media_type: "service_image",
      is_preview_image: index === 0, // First image is preview
    }));

    await seed.media(mediaData);
  }
}
