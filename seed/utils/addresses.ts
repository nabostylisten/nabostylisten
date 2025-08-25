import type { SeedClient } from "@snaplet/seed";

/**
 * Creates addresses for stylists with proper PostGIS geography data
 * Addresses are distributed across major Norwegian cities with realistic coordinates
 */
export async function createStylistAddresses(seed: SeedClient, stylistUsers: any[]) {
  console.log("-- Creating stylist addresses with PostGIS coordinates...");
  
  // Note: PostGIS expects POINT(longitude latitude) format
  await seed.addresses([
    // Oslo stylists addresses
    {
      user_id: stylistUsers[0].id, // Maria Hansen
      nickname: "Salong",
      street_address: "Storgata 15",
      city: "Oslo",
      postal_code: "0154",
      country: "Norge",
      location: "POINT(10.746 59.913)", // Oslo center coordinates
      is_primary: true,
    },
    {
      user_id: stylistUsers[1].id, // Sophia Larsen
      nickname: "Studio",
      street_address: "Markveien 35",
      city: "Oslo",
      postal_code: "0554",
      country: "Norge",
      location: "POINT(10.7585 59.9295)", // Grünerløkka, Oslo coordinates
      is_primary: true,
    },
    // Bergen stylists addresses
    {
      user_id: stylistUsers[2].id, // Emma Nilsen
      nickname: "Hjemmekontor",
      street_address: "Løkkeveien 8",
      city: "Bergen",
      postal_code: "5003",
      country: "Norge",
      location: "POINT(5.324 60.393)", // Bergen coordinates
      is_primary: true,
    },
    {
      user_id: stylistUsers[3].id, // Lisa Berg
      nickname: "Salong",
      street_address: "Strandgaten 55",
      city: "Bergen",
      postal_code: "5004",
      country: "Norge",
      location: "POINT(5.3260 60.3894)", // Bergen city center
      is_primary: true,
    },
    // Trondheim stylists addresses
    {
      user_id: stylistUsers[4].id, // Anna Johansen
      nickname: "Studio",
      street_address: "Munkegata 20",
      city: "Trondheim",
      postal_code: "7011",
      country: "Norge",
      location: "POINT(10.395 63.43)", // Trondheim coordinates
      is_primary: true,
    },
    {
      user_id: stylistUsers[5].id, // Ingrid Solberg
      nickname: "Neglesalong",
      street_address: "Olav Tryggvasons gate 14",
      city: "Trondheim",
      postal_code: "7013",
      country: "Norge",
      location: "POINT(10.3950 63.4305)", // Trondheim center
      is_primary: true,
    },
    // Stavanger stylists addresses
    {
      user_id: stylistUsers[6].id, // Camilla Eriksen
      nickname: "Hårstudio",
      street_address: "Klubbgaten 5",
      city: "Stavanger",
      postal_code: "4006",
      country: "Norge",
      location: "POINT(5.733 58.97)", // Stavanger coordinates
      is_primary: true,
    },
    {
      user_id: stylistUsers[7].id, // Thea Andersen
      nickname: "Skjønnhetssalong",
      street_address: "Øvre Holmegate 15",
      city: "Stavanger",
      postal_code: "4008",
      country: "Norge",
      location: "POINT(5.7330 58.9700)", // Stavanger center
      is_primary: true,
    },
    // Kristiansand stylists addresses
    {
      user_id: stylistUsers[8].id, // Marte Kristiansen
      nickname: "Beauty Studio",
      street_address: "Markens gate 33",
      city: "Kristiansand",
      postal_code: "4611",
      country: "Norge",
      location: "POINT(8.00 58.1472)", // Kristiansand coordinates
      is_primary: true,
    },
    {
      user_id: stylistUsers[9].id, // Sara Pedersen
      nickname: "Hårsalong",
      street_address: "Dronningens gate 15",
      city: "Kristiansand",
      postal_code: "4608",
      country: "Norge",
      location: "POINT(7.9956 58.1467)", // Kristiansand center
      is_primary: true,
    },
  ]);
}

/**
 * Creates primary addresses for customers distributed across Norwegian cities
 */
export async function createCustomerPrimaryAddresses(seed: SeedClient, customerUsers: any[]) {
  console.log("-- Creating customer primary addresses...");
  
  await seed.addresses([
    {
      user_id: customerUsers[0].id, // Kari Nordmann
      nickname: "Hjemme",
      street_address: "Grønlandsleiret 44",
      city: "Oslo",
      postal_code: "0190",
      country: "Norge",
      location: "POINT(10.7608 59.9127)", // Grønland, Oslo coordinates
      is_primary: true,
    },
    {
      user_id: customerUsers[1].id, // Ole Hansen
      nickname: "Leilighet",
      street_address: "Torgallmenningen 8",
      city: "Bergen",
      postal_code: "5014",
      country: "Norge",
      location: "POINT(5.3247 60.3933)", // Bergen city center coordinates
      is_primary: true,
    },
    {
      user_id: customerUsers[2].id, // Per Jensen
      nickname: "Hjem",
      street_address: "Prinsens gate 44",
      city: "Trondheim",
      postal_code: "7012",
      country: "Norge",
      location: "POINT(10.3951 63.4297)", // Trondheim coordinates
      is_primary: true,
    },
    {
      user_id: customerUsers[3].id, // Anne Olsen
      nickname: "Leilighet",
      street_address: "Kirkegata 20",
      city: "Stavanger",
      postal_code: "4005",
      country: "Norge",
      location: "POINT(5.7315 58.9690)", // Stavanger coordinates
      is_primary: true,
    },
  ]);
}

/**
 * Creates additional customer addresses for booking testing scenarios
 */
export async function createAdditionalCustomerAddresses(seed: SeedClient, customerUsers: any[]) {
  console.log("-- Creating additional customer addresses for testing...");
  
  const { addresses: customerAddresses } = await seed.addresses([
    {
      user_id: customerUsers[0].id, // Kari Nordmann
      nickname: "Sommerhus",
      street_address: "Strandveien 123",
      city: "Oslo",
      postal_code: "0250",
      country: "Norge",
      location: "POINT(10.6831 59.8897)", // Bygdøy, Oslo coordinates
      entry_instructions: "Ring på døren, kode 1234",
      is_primary: false,
    },
  ]);

  return customerAddresses;
}