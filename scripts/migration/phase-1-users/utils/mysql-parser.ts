/**
 * MySQL dump file parser for extracting user data
 */

import { readFileSync } from "fs";
import type { MySQLBuyer, MySQLStylist } from "../../shared/types";
import type { MigrationLogger } from "../../shared/logger";

// Address data from MySQL
export interface MySQLAddress {
  id: string;
  buyer_id: string | null;
  stylist_id: string | null;
  salon_id: string | null;
  formatted_address: string | null;
  street_name: string | null;
  street_no: string | null;
  city: string | null;
  zipcode: string | null;
  country: string | null;
  short_address: string | null;
  tag: string | null;
  coordinates: string | null; // MySQL POINT format
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export class MySQLParser {
  private logger: MigrationLogger;
  private dumpFilePath: string;

  constructor(dumpFilePath: string, logger: MigrationLogger) {
    this.logger = logger;
    this.dumpFilePath = dumpFilePath;
  }

  /**
   * Extract buyer records from MySQL dump file
   */
  async extractBuyers(): Promise<MySQLBuyer[]> {
    this.logger.info("Extracting buyer records from MySQL dump");

    try {
      const dumpContent = readFileSync(this.dumpFilePath, "utf-8");
      const buyers = this.extractTableData(dumpContent, "buyer");

      this.logger.success(`Extracted ${buyers.length} buyer records`);
      return buyers.map((buyer) => this.mapToBuyer(buyer));
    } catch (error) {
      this.logger.error("Failed to extract buyer records", error);
      throw error;
    }
  }

  /**
   * Extract stylist records from MySQL dump file
   */
  async extractStylists(): Promise<MySQLStylist[]> {
    this.logger.info("Extracting stylist records from MySQL dump");

    try {
      const dumpContent = readFileSync(this.dumpFilePath, "utf-8");
      const stylists = this.extractTableData(dumpContent, "stylist");

      this.logger.success(`Extracted ${stylists.length} stylist records`);
      return stylists.map((stylist) => this.mapToStylist(stylist));
    } catch (error) {
      this.logger.error("Failed to extract stylist records", error);
      throw error;
    }
  }

  /**
   * Extract address records from MySQL dump file
   * Uses a simplified approach that focuses on essential fields only
   */
  async extractAddresses(): Promise<MySQLAddress[]> {
    this.logger.info("Extracting address records from MySQL dump");

    try {
      const dumpContent = readFileSync(this.dumpFilePath, "utf-8");
      const addresses = this.extractSimpleAddressData(dumpContent);

      this.logger.success(`Extracted ${addresses.length} address records`);
      return addresses;
    } catch (error) {
      this.logger.error("Failed to extract address records", error);
      throw error;
    }
  }

  /**
   * Generic method to parse any table from MySQL dump
   */
  async parseTable<T>(tableName: string): Promise<T[]> {
    this.logger.info(`Parsing ${tableName} table from MySQL dump`);

    try {
      const dumpContent = readFileSync(this.dumpFilePath, "utf-8");
      const records = this.extractTableData(dumpContent, tableName);

      this.logger.success(`Parsed ${records.length} records from ${tableName}`);
      return records as T[];
    } catch (error) {
      this.logger.error(`Failed to parse ${tableName} table`, error);
      throw error;
    }
  }

  /**
   * Extract table data using pattern matching for INSERT statements
   */
  private extractTableData(
    dumpContent: string,
    tableName: string,
  ): Record<string, string | null>[] {
    this.logger.debug(`Parsing ${tableName} table from dump file`);

    // Pattern to match INSERT statements for the specific table
    const insertPattern = new RegExp(
      `INSERT INTO \`${tableName}\` VALUES\\s*([^;]+);`,
      "gi",
    );

    // More flexible pattern to extract column definitions that handles MySQL dump formatting
    const createTablePattern = new RegExp(
      `CREATE TABLE \`${tableName}\`\\s*\\(((?:[^;]|;(?![^\\(]*\\)))*?)\\)\\s*ENGINE`,
      "gis",
    );

    // First, extract column names from CREATE TABLE statement
    const createTableMatch = createTablePattern.exec(dumpContent);
    if (!createTableMatch) {
      // Fallback: try simpler pattern without ENGINE clause
      const simpleCreateTablePattern = new RegExp(
        `CREATE TABLE \`${tableName}\`\\s*\\(((?:[^;]|;(?![^\\(]*\\)))*?)\\);`,
        "gis",
      );

      const fallbackMatch = simpleCreateTablePattern.exec(dumpContent);
      if (!fallbackMatch) {
        throw new Error(
          `Could not find CREATE TABLE statement for ${tableName}`,
        );
      }

      return this.parseTableStructure(
        fallbackMatch[1],
        tableName,
        dumpContent,
        insertPattern,
      );
    }

    return this.parseTableStructure(
      createTableMatch[1],
      tableName,
      dumpContent,
      insertPattern,
    );
  }

  /**
   * Parse table structure and extract data
   */
  private parseTableStructure(
    tableDefinition: string,
    tableName: string,
    dumpContent: string,
    insertPattern: RegExp,
  ): Record<string, string | null>[] {
    const columns = this.extractColumnNames(tableDefinition);
    this.logger.debug(`Found columns for ${tableName}:`, columns);

    // Extract all INSERT statements
    const records: Record<string, string | null>[] = [];
    let match;

    while ((match = insertPattern.exec(dumpContent)) !== null) {
      const valuesString = match[1].trim();
      const rows = this.parseInsertValues(valuesString, tableName);

      for (const row of rows) {
        if (row.length !== columns.length) {
          this.logger.warn(
            `Column count mismatch for ${tableName}. Expected ${columns.length}, got ${row.length}`,
          );

          // Pad with nulls if row is too short, or truncate if too long
          while (row.length < columns.length) {
            row.push(null);
          }
          if (row.length > columns.length) {
            row.splice(columns.length);
          }
        }

        const record: Record<string, string | null> = {};
        columns.forEach((column, index) => {
          record[column] = row[index];
        });

        records.push(record);
      }
    }

    this.logger.debug(`Parsed ${records.length} records from ${tableName}`);
    return records;
  }

  /**
   * Extract column names from table definition (content inside CREATE TABLE parentheses)
   */
  private extractColumnNames(tableDefinition: string): string[] {
    const columns: string[] = [];

    // Split by comma and process each line
    const lines = tableDefinition.split(",");

    for (const line of lines) {
      const trimmedLine = line.trim();

      // Skip if it's a constraint, key, or index definition
      if (
        trimmedLine.match(
          /^\s*(PRIMARY\s+KEY|KEY|UNIQUE\s+KEY|INDEX|CONSTRAINT|FOREIGN\s+KEY)/i,
        )
      ) {
        continue;
      }

      // Extract column name - should start with backticks
      const columnMatch = trimmedLine.match(/^\s*`(\w+)`/);
      if (columnMatch) {
        columns.push(columnMatch[1]);
      }
    }

    return columns;
  }

  /**
   * Parse INSERT VALUES statement to extract individual rows
   * Enhanced to handle binary data gracefully (for address table) and simple parsing for other tables
   */
  private parseInsertValues(valuesString: string, tableName?: string): (string | null)[][] {
    // Use complex address parsing only for address table
    if (tableName === 'address') {
      return this.parseAddressInsertValues(valuesString);
    }

    // Use simple parsing for all other tables (category, subcategory, service, etc.)
    return this.parseSimpleInsertValues(valuesString);
  }

  /**
   * Complex address parsing (existing implementation)
   */
  private parseAddressInsertValues(valuesString: string): (string | null)[][] {
    const rows: (string | null)[][] = [];

    // Use a more robust approach: split by row boundaries first
    // Look for patterns like ),( to identify row boundaries (no whitespace in our dump)
    const rowPattern = /\),\(/g;
    const rowBoundaries: number[] = [0];

    let match;
    while ((match = rowPattern.exec(valuesString)) !== null) {
      rowBoundaries.push(match.index + 1); // Position after ),(
    }

    // Add the end position
    rowBoundaries.push(valuesString.length);

    this.logger.debug(`Found ${rowBoundaries.length - 1} potential rows`);

    // Process each row section
    for (let i = 0; i < rowBoundaries.length - 1; i++) {
      const startPos = rowBoundaries[i];
      const endPos = rowBoundaries[i + 1];
      const rowText = valuesString.substring(startPos, endPos);

      try {
        const parsedRow = this.parseAddressRowText(rowText);
        if (parsedRow && parsedRow.length > 0) {
          rows.push(parsedRow);
        }
      } catch (error) {
        this.logger.debug(`Failed to parse row ${i + 1}: ${error}`);
        continue;
      }

      // Log progress every 1000 rows
      if ((i + 1) % 1000 === 0) {
        this.logger.debug(`Processed ${i + 1} rows, extracted ${rows.length} valid rows`);
      }
    }

    this.logger.debug(`Finished parsing: processed ${rowBoundaries.length - 1} row sections, extracted ${rows.length} valid rows`);
    return rows;
  }

  /**
   * Simple parsing for standard tables (category, subcategory, service, etc.)
   */
  private parseSimpleInsertValues(valuesString: string): (string | null)[][] {
    const rows: (string | null)[][] = [];

    // Clean up the values string - remove leading/trailing whitespace
    const cleanValues = valuesString.trim();

    // Split by row boundaries: ),( pattern
    const rowStrings = cleanValues.split('),(');

    for (let i = 0; i < rowStrings.length; i++) {
      let rowString = rowStrings[i];

      // Clean up first and last rows
      if (i === 0 && rowString.startsWith('(')) {
        rowString = rowString.slice(1);
      }
      if (i === rowStrings.length - 1 && rowString.endsWith(')')) {
        rowString = rowString.slice(0, -1);
      }

      try {
        const row = this.parseSimpleRowValues(rowString);
        if (row && row.length > 0) {
          rows.push(row);
        }
      } catch (error) {
        this.logger.debug(`Failed to parse row ${i + 1}: ${error}`);
      }
    }

    return rows;
  }

  /**
   * Parse individual row values from a comma-separated string for simple tables
   */
  private parseSimpleRowValues(rowString: string): (string | null)[] {
    const values: (string | null)[] = [];
    let currentValue = '';
    let inQuotes = false;
    let quoteChar = '';
    let i = 0;

    while (i < rowString.length) {
      const char = rowString[i];

      if (!inQuotes) {
        if (char === "'" || char === '"') {
          inQuotes = true;
          quoteChar = char;
        } else if (char === ',') {
          // End of value
          const trimmed = currentValue.trim();
          if (trimmed === 'NULL') {
            values.push(null);
          } else {
            values.push(trimmed);
          }
          currentValue = '';
        } else {
          currentValue += char;
        }
      } else {
        if (char === quoteChar) {
          // Check for escaped quote
          if (i + 1 < rowString.length && rowString[i + 1] === quoteChar) {
            currentValue += char;
            i++; // Skip the next quote
          } else {
            inQuotes = false;
            quoteChar = '';
          }
        } else {
          currentValue += char;
        }
      }
      i++;
    }

    // Add the last value
    const trimmed = currentValue.trim();
    if (trimmed === 'NULL') {
      values.push(null);
    } else {
      values.push(trimmed);
    }

    return values;
  }

  /**
   * Parse a single address row text, handling binary data gracefully
   * Expected format: ('id','buyer_id','stylist_id','salon_id',_binary 'data','field5',...,'field16')
   */
  private parseAddressRowText(rowText: string): (string | null)[] {
    const row: (string | null)[] = [];

    // Remove leading/trailing parentheses and whitespace
    let cleanText = rowText.replace(/^\s*\(/, '').replace(/\)\s*$/, '').trim();

    // Handle the binary coordinate field (position 4) specially
    // More robust pattern for _binary 'complex_data_with_nulls_and_special_chars'
    // We need to find _binary and then skip to the next field after the binary data

    const binaryStartIndex = cleanText.indexOf('_binary');
    if (binaryStartIndex !== -1) {
      // Find the quote after _binary
      const quoteStartIndex = cleanText.indexOf("'", binaryStartIndex);
      if (quoteStartIndex !== -1) {
        // Find the closing quote, but we need to be careful with escaped quotes and null bytes
        let quoteEndIndex = -1;
        let i = quoteStartIndex + 1;

        // Look for the end of the binary data by finding the pattern ','
        // after the binary section (which should be after the closing quote)
        while (i < cleanText.length) {
          if (cleanText[i] === "'" &&
              i + 1 < cleanText.length &&
              cleanText[i + 1] === ',') {
            quoteEndIndex = i;
            break;
          }
          i++;
        }

        if (quoteEndIndex !== -1) {
          // Replace the entire _binary '...' section with placeholder
          const before = cleanText.substring(0, binaryStartIndex);
          const after = cleanText.substring(quoteEndIndex + 1);
          cleanText = before + 'BINARY_PLACEHOLDER' + after;
        }
      }
    }

    // Now split by commas that are not inside quotes
    const values: string[] = [];
    let currentValue = '';
    let inQuotes = false;
    let quoteChar = '';

    for (let i = 0; i < cleanText.length; i++) {
      const char = cleanText[i];
      const nextChar = cleanText[i + 1];

      if (!inQuotes) {
        if (char === "'" || char === '"') {
          inQuotes = true;
          quoteChar = char;
          currentValue += char;
        } else if (char === ',') {
          values.push(currentValue.trim());
          currentValue = '';
        } else {
          currentValue += char;
        }
      } else {
        if (char === quoteChar && nextChar !== quoteChar) {
          // End of quoted string
          inQuotes = false;
          quoteChar = '';
          currentValue += char;
        } else if (char === quoteChar && nextChar === quoteChar) {
          // Escaped quote
          currentValue += char + char;
          i++; // Skip next char
        } else {
          currentValue += char;
        }
      }
    }

    // Add the last value
    if (currentValue.trim()) {
      values.push(currentValue.trim());
    }

    // Convert values to proper format, handling the binary placeholder
    for (const value of values) {
      if (value === 'BINARY_PLACEHOLDER') {
        row.push(null); // Skip binary coordinates
      } else {
        row.push(this.parseValue(value));
      }
    }

    return row;
  }

  /**
   * Parse individual value from SQL
   */
  private parseValue(value: string): string | null {
    if (value === "NULL") {
      return null;
    }

    // Remove quotes and handle escaped characters
    if (value.startsWith("'") && value.endsWith("'")) {
      return value.slice(1, -1).replace(/''/g, "'").replace(/\\\\/g, "\\");
    }

    if (value.startsWith('"') && value.endsWith('"')) {
      return value.slice(1, -1).replace(/""/g, '"').replace(/\\\\/g, "\\");
    }

    return value;
  }

  /**
   * Map raw data to MySQLBuyer interface
   */
  private mapToBuyer(raw: Record<string, string | null>): MySQLBuyer {
    return {
      id: raw.id || "",
      name: raw.name || "",
      email: raw.email || null,
      phone_number: raw.phone_number || null,
      default_address_id: raw.default_address_id || null,
      is_deleted: raw.is_deleted === "1",
      phone_verified: raw.phone_verified === "1",
      email_verified: raw.email_verified === "1",
      bankid_verified: raw.bankid_verified === "1",
      sms_enabled: raw.sms_enabled === "1",
      email_enabled: raw.email_enabled === "1",
      last_login_at: raw.last_login_at || null,
      created_at: raw.created_at || new Date().toISOString(),
      updated_at: raw.updated_at || new Date().toISOString(),
      deleted_at: raw.deleted_at || null,
      gender: raw.gender || null,
      stripe_customer_id: raw.stripe_customer_id || null,
      profile_picture_uploaded: raw.profile_picture_uploaded === "1",
      is_blocked: raw.is_blocked === "1",
    };
  }

  /**
   * Map raw data to MySQLStylist interface
   */
  private mapToStylist(raw: Record<string, string | null>): MySQLStylist {
    return {
      id: raw.id || "",
      name: raw.name || "",
      email: raw.email || null,
      phone_number: raw.phone_number || null,
      default_address_id: raw.default_address_id || null,
      is_deleted: raw.is_deleted === "1",
      phone_verified: raw.phone_verified === "1",
      email_verified: raw.email_verified === "1",
      bankid_verified: raw.bankid_verified === "1",
      sms_enabled: raw.sms_enabled === "1",
      email_enabled: raw.email_enabled === "1",
      last_login_at: raw.last_login_at || null,
      created_at: raw.created_at || new Date().toISOString(),
      updated_at: raw.updated_at || new Date().toISOString(),
      deleted_at: raw.deleted_at || null,
      gender: raw.gender || null,
      stripe_account_id: raw.stripe_account_id || null,
      bio: raw.bio || null,
      commission_percentage: raw.commission_percentage
        ? parseFloat(raw.commission_percentage)
        : null,
      facebook_profile: raw.facebook_profile || "",
      instagram_profile: raw.instagram_profile || "",
      twitter_profile: raw.twitter_profile || "",
      is_active: raw.is_active === "1",
      can_travel: raw.can_travel === "1",
      travel_distance: raw.travel_distance
        ? parseInt(raw.travel_distance, 10)
        : null,
      salon_id: raw.salon_id || null,
      stripe_onboarding_completed: raw.stripe_onboarding_completed === "1",
      scheduler_resource_id: raw.scheduler_resource_id
        ? parseInt(raw.scheduler_resource_id, 10)
        : null,
      profile_picture_uploaded: raw.profile_picture_uploaded === "1",
      has_own_place: raw.has_own_place === "1",
    };
  }

  /**
   * Extract address data using a simplified pattern-matching approach
   * This avoids column count issues by parsing INSERT statements directly
   * Handles both multiple INSERT statements and single massive INSERT statement formats
   */
  private extractSimpleAddressData(dumpContent: string): MySQLAddress[] {
    this.logger.debug("Using simplified address extraction approach");

    const addresses: MySQLAddress[] = [];

    // First try the original pattern for multiple INSERT statements
    const multipleInsertPattern = /INSERT INTO `address` VALUES\s*\(([^;]+)\);/gi;
    let match;
    let foundMultiple = false;

    while ((match = multipleInsertPattern.exec(dumpContent)) !== null) {
      foundMultiple = true;
      const valuesString = match[1];
      const rows = this.parseInsertValues(valuesString, tableName);

      for (const row of rows) {
        try {
          const address = this.parseAddressRow(row);
          if (address) {
            addresses.push(address);
          }
        } catch (error) {
          this.logger.debug(`Skipping problematic address row: ${error}`);
          continue;
        }
      }
    }

    // If no multiple INSERT statements found, try single massive INSERT statement
    if (!foundMultiple) {
      this.logger.info("No multiple INSERT statements found, trying single massive INSERT format");

      // Pattern for single massive INSERT statement
      const singleInsertPattern = /INSERT INTO `address` VALUES\s*([^;]+);/gi;
      const singleMatch = singleInsertPattern.exec(dumpContent);

      if (singleMatch) {
        this.logger.info("Found single massive INSERT statement, parsing...");
        const valuesString = singleMatch[1];
        this.logger.debug(`Values string length: ${valuesString.length} characters`);

        // Count approximate number of rows by counting separator patterns
        const separatorCount = (valuesString.match(/\),\(/g) || []).length;
        this.logger.info(`Estimated ${separatorCount + 1} rows based on separator count`);

        const rows = this.parseInsertValues(valuesString, tableName);
        this.logger.info(`Actually parsed ${rows.length} address rows from single INSERT statement`);

        for (const row of rows) {
          try {
            const address = this.parseAddressRow(row);
            if (address) {
              addresses.push(address);
            }
          } catch (error) {
            this.logger.debug(`Skipping problematic address row: ${error}`);
            continue;
          }
        }
      } else {
        this.logger.warn("No INSERT statements found for address table");
      }
    }

    return addresses;
  }

  /**
   * Parse a single address row with flexible field mapping
   * Based on the production database structure with full columns
   */
  private parseAddressRow(row: (string | null)[]): MySQLAddress | null {
    if (row.length < 8) {
      return null; // Skip rows that are too short
    }

    // Corrected based on actual production MySQL address table structure:
    // INSERT INTO `address` VALUES ('id','buyer_id',stylist_id,salon_id,coordinates,'short_address','formatted_address','tag','created_at','updated_at',deleted_at,'street_name','street_no','city','zipcode','country')
    const id = row[0];
    const buyerId = row[1] === 'NULL' ? null : row[1];
    const stylistId = row[2] === 'NULL' ? null : row[2];
    const salonId = row[3] === 'NULL' ? null : row[3];

    // Skip the binary coordinates (row[4]) - we'll handle this in separate Mapbox script
    const shortAddress = row[5]; // This was incorrectly mapped as streetName before
    const formattedAddress = row[6];
    const tag = row[7];
    const createdAt = row[8] || new Date().toISOString();
    const updatedAt = row[9] || new Date().toISOString();
    const deletedAt = row[10] === 'NULL' ? null : row[10];

    // Correctly mapped fields from their actual positions
    const streetName = row.length > 11 ? (row[11] === 'NULL' || row[11] === '' ? null : row[11]) : null;
    const streetNo = row.length > 12 ? (row[12] === 'NULL' || row[12] === '' ? null : row[12]) : null;
    const city = row.length > 13 ? (row[13] === 'NULL' || row[13] === '' ? null : row[13]) : null;
    const zipcode = row.length > 14 ? (row[14] === 'NULL' || row[14] === '' ? null : row[14]) : null;
    const country = row.length > 15 ? (row[15] === 'NULL' || row[15] === '' ? null : row[15]) : null;

    // Only return address if we have an ID and either buyer_id or stylist_id
    if (!id || (!buyerId && !stylistId)) {
      return null;
    }

    return {
      id,
      buyer_id: buyerId,
      stylist_id: stylistId,
      salon_id: salonId,
      formatted_address: formattedAddress,
      street_name: streetName,
      street_no: streetNo,
      city: city,
      zipcode: zipcode,
      country: country || "Norway", // Default to Norway
      short_address: shortAddress,
      tag: tag,
      coordinates: null, // Will be geocoded using Mapbox later
      created_at: createdAt,
      updated_at: updatedAt,
      deleted_at: deletedAt,
    };
  }

  /**
   * Map raw data to MySQLAddress interface (fallback method)
   */
  private mapToAddress(raw: Record<string, string | null>): MySQLAddress {
    return {
      id: raw.id || "",
      buyer_id: raw.buyer_id || null,
      stylist_id: raw.stylist_id || null,
      salon_id: raw.salon_id || null,
      formatted_address: raw.formatted_address || null,
      street_name: raw.street_name || null,
      street_no: raw.street_no || null,
      city: raw.city || null,
      zipcode: raw.zipcode || null,
      country: raw.country || null,
      short_address: raw.short_address || null,
      tag: raw.tag || null,
      coordinates: raw.coordinates || null,
      created_at: raw.created_at || new Date().toISOString(),
      updated_at: raw.updated_at || new Date().toISOString(),
      deleted_at: raw.deleted_at || null,
    };
  }

  /**
   * Get dump file statistics
   */
  async getDumpStats(): Promise<{
    fileSize: number;
    totalBuyers: number;
    totalStylists: number;
    activeBuyers: number;
    activeStylists: number;
  }> {
    try {
      const dumpContent = readFileSync(this.dumpFilePath, "utf-8");
      const buyers = await this.parseTable<MySQLBuyer>("buyer");
      const stylists = await this.parseTable<MySQLStylist>("stylist");

      const stats = {
        fileSize: Buffer.byteLength(dumpContent, "utf-8"),
        totalBuyers: buyers.length,
        totalStylists: stylists.length,
        activeBuyers: buyers.filter((b) => !b.deleted_at).length,
        activeStylists: stylists.filter((s) => !s.deleted_at).length,
      };

      this.logger.stats("MySQL Dump Statistics", {
        "File Size (MB)": Math.round(stats.fileSize / 1024 / 1024),
        "Total Buyers": stats.totalBuyers,
        "Active Buyers": stats.activeBuyers,
        "Total Stylists": stats.totalStylists,
        "Active Stylists": stats.activeStylists,
      });

      return stats;
    } catch (error) {
      this.logger.error("Failed to get dump statistics", error);
      throw error;
    }
  }
}
