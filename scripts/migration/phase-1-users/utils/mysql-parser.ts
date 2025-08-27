/**
 * MySQL dump file parser for extracting user data
 */

import { readFileSync } from 'fs';
import type { MySQLBuyer, MySQLStylist } from '../../shared/types';
import type { MigrationLogger } from '../../shared/logger';

export class MySQLParser {
  private logger: MigrationLogger;
  private dumpFilePath: string;

  constructor(logger: MigrationLogger, dumpFilePath: string) {
    this.logger = logger;
    this.dumpFilePath = dumpFilePath;
  }

  /**
   * Extract buyer records from MySQL dump file
   */
  async extractBuyers(): Promise<MySQLBuyer[]> {
    this.logger.info('Extracting buyer records from MySQL dump');
    
    try {
      const dumpContent = readFileSync(this.dumpFilePath, 'utf-8');
      const buyers = this.extractTableData(dumpContent, 'buyer');
      
      this.logger.success(`Extracted ${buyers.length} buyer records`);
      return buyers.map(buyer => this.mapToBuyer(buyer));
    } catch (error) {
      this.logger.error('Failed to extract buyer records', error);
      throw error;
    }
  }

  /**
   * Extract stylist records from MySQL dump file
   */
  async extractStylists(): Promise<MySQLStylist[]> {
    this.logger.info('Extracting stylist records from MySQL dump');
    
    try {
      const dumpContent = readFileSync(this.dumpFilePath, 'utf-8');
      const stylists = this.extractTableData(dumpContent, 'stylist');
      
      this.logger.success(`Extracted ${stylists.length} stylist records`);
      return stylists.map(stylist => this.mapToStylist(stylist));
    } catch (error) {
      this.logger.error('Failed to extract stylist records', error);
      throw error;
    }
  }

  /**
   * Extract table data using pattern matching for INSERT statements
   */
  private extractTableData(dumpContent: string, tableName: string): Record<string, string | null>[] {
    this.logger.debug(`Parsing ${tableName} table from dump file`);

    // Pattern to match INSERT statements for the specific table
    const insertPattern = new RegExp(
      `INSERT INTO \`${tableName}\` VALUES\\s*([^;]+);`,
      'gi'
    );

    // Pattern to extract column definitions
    const createTablePattern = new RegExp(
      `CREATE TABLE \`${tableName}\`\\s*\\([^;]+\\);`,
      'gi'
    );

    // First, extract column names from CREATE TABLE statement
    const createTableMatch = createTablePattern.exec(dumpContent);
    if (!createTableMatch) {
      throw new Error(`Could not find CREATE TABLE statement for ${tableName}`);
    }

    const columns = this.extractColumnNames(createTableMatch[0]);
    this.logger.debug(`Found columns for ${tableName}:`, columns);

    // Extract all INSERT statements
    const records: Record<string, string | null>[] = [];
    let match;

    while ((match = insertPattern.exec(dumpContent)) !== null) {
      const valuesString = match[1].trim();
      const rows = this.parseInsertValues(valuesString);
      
      for (const row of rows) {
        if (row.length !== columns.length) {
          this.logger.warn(`Column count mismatch for ${tableName}. Expected ${columns.length}, got ${row.length}`);
          continue;
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
   * Extract column names from CREATE TABLE statement
   */
  private extractColumnNames(createTableStatement: string): string[] {
    const columnPattern = /`(\w+)`\s+[^,)]+/g;
    const columns: string[] = [];
    let match;

    while ((match = columnPattern.exec(createTableStatement)) !== null) {
      const columnName = match[1];
      
      // Skip indexes, keys, and constraints
      if (!['PRIMARY', 'KEY', 'INDEX', 'CONSTRAINT', 'UNIQUE'].includes(columnName.toUpperCase())) {
        columns.push(columnName);
      }
    }

    return columns;
  }

  /**
   * Parse INSERT VALUES statement to extract individual rows
   */
  private parseInsertValues(valuesString: string): (string | null)[][] {
    const rows: (string | null)[][] = [];
    
    // Split by row patterns: (...),(...),...
    let parenLevel = 0;
    let currentRow: (string | null)[] = [];
    let currentValue = '';
    let inQuotes = false;
    let quoteChar = '';

    for (let i = 0; i < valuesString.length; i++) {
      const char = valuesString[i];
      const nextChar = valuesString[i + 1];

      if (!inQuotes) {
        if (char === '(' && parenLevel === 0) {
          // Start of new row
          parenLevel++;
          continue;
        } else if (char === ')' && parenLevel === 1) {
          // End of row
          if (currentValue.trim()) {
            currentRow.push(this.parseValue(currentValue.trim()));
          }
          rows.push(currentRow);
          currentRow = [];
          currentValue = '';
          parenLevel--;
          continue;
        } else if (char === ',' && parenLevel === 1) {
          // End of value
          currentRow.push(this.parseValue(currentValue.trim()));
          currentValue = '';
          continue;
        } else if ((char === '"' || char === "'") && parenLevel === 1) {
          inQuotes = true;
          quoteChar = char;
          continue;
        }
      } else {
        if (char === quoteChar && nextChar !== quoteChar) {
          // End of quoted string
          inQuotes = false;
          quoteChar = '';
          continue;
        } else if (char === quoteChar && nextChar === quoteChar) {
          // Escaped quote
          currentValue += char;
          i++; // Skip next character
          continue;
        }
      }

      if (parenLevel === 1) {
        currentValue += char;
      }
    }

    return rows;
  }

  /**
   * Parse individual value from SQL
   */
  private parseValue(value: string): string | null {
    if (value === 'NULL') {
      return null;
    }
    
    // Remove quotes and handle escaped characters
    if (value.startsWith("'") && value.endsWith("'")) {
      return value.slice(1, -1).replace(/''/g, "'").replace(/\\\\/g, '\\');
    }
    
    if (value.startsWith('"') && value.endsWith('"')) {
      return value.slice(1, -1).replace(/""/g, '"').replace(/\\\\/g, '\\');
    }

    return value;
  }

  /**
   * Map raw data to MySQLBuyer interface
   */
  private mapToBuyer(raw: Record<string, string | null>): MySQLBuyer {
    return {
      id: raw.id || '',
      name: raw.name || null,
      email: raw.email || '',
      phone_number: raw.phone_number || null,
      phone_verified: raw.phone_verified === '1',
      email_verified: raw.email_verified === '1',
      bankid_verified: raw.bankid_verified === '1',
      last_login_at: raw.last_login_at || null,
      password: raw.password || '',
      gender: raw.gender || null,
      created_at: raw.created_at || new Date().toISOString(),
      updated_at: raw.updated_at || new Date().toISOString(),
      deleted_at: raw.deleted_at || null,
      stripe_customer_id: raw.stripe_customer_id || null,
      is_blocked: raw.is_blocked === '1',
      sms_enabled: raw.sms_enabled === '1',
      email_enabled: raw.email_enabled === '1',
      profile_picture_uploaded: raw.profile_picture_uploaded === '1',
      default_address_id: raw.default_address_id || null
    };
  }

  /**
   * Map raw data to MySQLStylist interface
   */
  private mapToStylist(raw: Record<string, string | null>): MySQLStylist {
    return {
      id: raw.id || '',
      name: raw.name || null,
      email: raw.email || '',
      phone_number: raw.phone_number || null,
      phone_verified: raw.phone_verified === '1',
      email_verified: raw.email_verified === '1',
      bankid_verified: raw.bankid_verified === '1',
      last_login_at: raw.last_login_at || null,
      password: raw.password || '',
      gender: raw.gender || null,
      created_at: raw.created_at || new Date().toISOString(),
      updated_at: raw.updated_at || new Date().toISOString(),
      deleted_at: raw.deleted_at || null,
      bio: raw.bio || null,
      can_travel: raw.can_travel === '1',
      travel_distance: raw.travel_distance ? parseInt(raw.travel_distance, 10) : null,
      instagram_profile: raw.instagram_profile || null,
      facebook_profile: raw.facebook_profile || null,
      twitter_profile: raw.twitter_profile || null,
      stripe_account_id: raw.stripe_account_id || null,
      commission_percentage: raw.commission_percentage ? parseFloat(raw.commission_percentage) : null,
      is_active: raw.is_active === '1',
      salon_id: raw.salon_id || null,
      sms_enabled: raw.sms_enabled === '1',
      email_enabled: raw.email_enabled === '1',
      profile_picture_uploaded: raw.profile_picture_uploaded === '1',
      default_address_id: raw.default_address_id || null
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
      const dumpContent = readFileSync(this.dumpFilePath, 'utf-8');
      const buyers = await this.extractBuyers();
      const stylists = await this.extractStylists();

      const stats = {
        fileSize: Buffer.byteLength(dumpContent, 'utf-8'),
        totalBuyers: buyers.length,
        totalStylists: stylists.length,
        activeBuyers: buyers.filter(b => !b.deleted_at).length,
        activeStylists: stylists.filter(s => !s.deleted_at).length
      };

      this.logger.stats('MySQL Dump Statistics', {
        'File Size (MB)': Math.round(stats.fileSize / 1024 / 1024),
        'Total Buyers': stats.totalBuyers,
        'Active Buyers': stats.activeBuyers,
        'Total Stylists': stats.totalStylists,
        'Active Stylists': stats.activeStylists
      });

      return stats;
    } catch (error) {
      this.logger.error('Failed to get dump statistics', error);
      throw error;
    }
  }
}