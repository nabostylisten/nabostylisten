/**
 * MySQL POINT coordinate parser utility
 * Handles conversion of MySQL spatial data to PostGIS format
 */

export interface Coordinates {
  lng: number;
  lat: number;
}

export interface ParsedCoordinates extends Coordinates {
  original: string;
  format: 'wkb_hex' | 'point_text' | 'binary' | 'unknown';
  confidence: 'high' | 'medium' | 'low';
}

/**
 * MySQL POINT coordinate parser
 * Supports multiple MySQL spatial data formats
 */
export class MySQLCoordinateParser {
  private static readonly NORDIC_BOUNDS = {
    lng: { min: -10, max: 35 },
    lat: { min: 50, max: 75 }
  };

  /**
   * Parse MySQL POINT data to coordinates
   * Supports various MySQL spatial formats
   */
  static parseCoordinates(mysqlPointData: string | null): ParsedCoordinates | null {
    if (!mysqlPointData || mysqlPointData === 'NULL' || mysqlPointData.trim() === '') {
      return null;
    }

    const trimmed = mysqlPointData.trim();

    try {
      // Try parsing as text POINT format first
      const textResult = this.parseTextPoint(trimmed);
      if (textResult) {
        return {
          ...textResult,
          original: trimmed,
          format: 'point_text',
          confidence: 'high'
        };
      }

      // Try parsing as WKB hex format
      const wkbResult = this.parseWKBHex(trimmed);
      if (wkbResult) {
        return {
          ...wkbResult,
          original: trimmed,
          format: 'wkb_hex',
          confidence: 'high'
        };
      }

      // Try parsing as binary data
      const binaryResult = this.parseBinaryData(trimmed);
      if (binaryResult) {
        return {
          ...binaryResult,
          original: trimmed,
          format: 'binary',
          confidence: 'medium'
        };
      }

      return null;
    } catch (error) {
      console.warn(`Failed to parse MySQL coordinates: ${error}`);
      return null;
    }
  }

  /**
   * Parse text POINT format: "POINT(lng lat)"
   */
  private static parseTextPoint(data: string): Coordinates | null {
    // Handle both "POINT(lng lat)" and "POINT (lng lat)" formats
    const match = data.match(/POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i);
    if (!match) return null;

    const lng = parseFloat(match[1]);
    const lat = parseFloat(match[2]);

    if (isNaN(lng) || isNaN(lat)) return null;
    if (!this.validateCoordinates(lng, lat)) return null;

    return { lng, lat };
  }

  /**
   * Parse WKB (Well-Known Binary) hex format
   * Format: hex string representing binary POINT data
   */
  private static parseWKBHex(data: string): Coordinates | null {
    // Remove any prefixes like 0x or \x
    const hexData = data.replace(/^(0x|\\x)/i, '');

    // WKB hex should have even length
    if (hexData.length % 2 !== 0) return null;

    try {
      // Convert hex to binary buffer
      const buffer = Buffer.from(hexData, 'hex');

      // Parse WKB buffer

      // Extended WKB Point structure (MySQL uses SRID):
      // Bytes 0-3: SRID (4 bytes) - MySQL specific
      // Byte 4: Byte order (01 = little endian, 00 = big endian)
      // Bytes 5-8: Geometry type (1 = Point)
      // Bytes 9-16: X coordinate (double)
      // Bytes 17-24: Y coordinate (double)

      if (buffer.length < 25) {
        // Try standard WKB without SRID first
        if (buffer.length < 21) return null;

        const byteOrder = buffer.readUInt8(0);
        const isLittleEndian = byteOrder === 1;

        // Read geometry type
        const geometryType = isLittleEndian
          ? buffer.readUInt32LE(1)
          : buffer.readUInt32BE(1);


        // Must be Point (type 1)
        if (geometryType !== 1) return null;

        // Read coordinates
        const lng = isLittleEndian
          ? buffer.readDoubleLE(5)
          : buffer.readDoubleBE(5);

        const lat = isLittleEndian
          ? buffer.readDoubleLE(13)
          : buffer.readDoubleBE(13);

        if (isNaN(lng) || isNaN(lat)) return null;
        if (!this.validateCoordinates(lng, lat)) return null;

        return { lng, lat };
      }

      // Try extended WKB with SRID (MySQL format)
      const srid = buffer.readUInt32LE(0);
      const byteOrder = buffer.readUInt8(4);
      const isLittleEndian = byteOrder === 1;

      // Read geometry type
      const geometryType = isLittleEndian
        ? buffer.readUInt32LE(5)
        : buffer.readUInt32BE(5);

      // Must be Point (type 1)
      if (geometryType !== 1) return null;

      // Read coordinates
      const lng = isLittleEndian
        ? buffer.readDoubleLE(9)
        : buffer.readDoubleBE(9);

      const lat = isLittleEndian
        ? buffer.readDoubleLE(17)
        : buffer.readDoubleBE(17);

      if (isNaN(lng) || isNaN(lat)) return null;
      if (!this.validateCoordinates(lng, lat)) return null;

      return { lng, lat };
    } catch {
      return null;
    }
  }

  /**
   * Parse binary data that might contain coordinates
   * This is a fallback for various binary formats
   */
  private static parseBinaryData(data: string): Coordinates | null {
    try {
      // Try to extract floating point numbers from the data
      // Look for patterns that might be coordinates
      const floatPattern = /[-]?\d+\.\d+/g;
      const matches = data.match(floatPattern);

      if (!matches || matches.length < 2) return null;

      // Try different combinations to find valid coordinates
      for (let i = 0; i < matches.length - 1; i++) {
        const lng = parseFloat(matches[i]);
        const lat = parseFloat(matches[i + 1]);

        if (!isNaN(lng) && !isNaN(lat) && this.validateCoordinates(lng, lat)) {
          return { lng, lat };
        }
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Validate coordinates are within expected Nordic region bounds
   */
  private static validateCoordinates(lng: number, lat: number): boolean {
    const { lng: lngBounds, lat: latBounds } = this.NORDIC_BOUNDS;

    return lng >= lngBounds.min && lng <= lngBounds.max &&
           lat >= latBounds.min && lat <= latBounds.max;
  }

  /**
   * Convert coordinates to PostGIS POINT format
   */
  static toPostGISPoint(coordinates: Coordinates): string {
    return `POINT(${coordinates.lng} ${coordinates.lat})`;
  }

  /**
   * Convert parsed coordinates to PostGIS format
   */
  static parseToPostGIS(mysqlPointData: string | null): string | null {
    const parsed = this.parseCoordinates(mysqlPointData);
    if (!parsed) return null;

    return this.toPostGISPoint(parsed);
  }

  /**
   * Batch parse multiple MySQL POINT values
   */
  static batchParse(mysqlPointValues: Array<string | null>): Array<ParsedCoordinates | null> {
    return mysqlPointValues.map(value => this.parseCoordinates(value));
  }

  /**
   * Get statistics about parsed coordinates
   */
  static getParsingStats(results: Array<ParsedCoordinates | null>): {
    total: number;
    successful: number;
    failed: number;
    byFormat: Record<string, number>;
    byConfidence: Record<string, number>;
  } {
    const stats = {
      total: results.length,
      successful: 0,
      failed: 0,
      byFormat: {} as Record<string, number>,
      byConfidence: {} as Record<string, number>
    };

    results.forEach(result => {
      if (result) {
        stats.successful++;
        stats.byFormat[result.format] = (stats.byFormat[result.format] || 0) + 1;
        stats.byConfidence[result.confidence] = (stats.byConfidence[result.confidence] || 0) + 1;
      } else {
        stats.failed++;
      }
    });

    return stats;
  }

  /**
   * Validate a PostGIS POINT string
   */
  static validatePostGISPoint(pointString: string): boolean {
    const match = pointString.match(/POINT\(([-\d.]+)\s+([-\d.]+)\)/);
    if (!match) return false;

    const lng = parseFloat(match[1]);
    const lat = parseFloat(match[2]);

    return !isNaN(lng) && !isNaN(lat) && this.validateCoordinates(lng, lat);
  }

  /**
   * Extract coordinates from various MySQL dump formats
   * Handles different ways coordinates might appear in mysqldump output
   */
  static extractFromDumpLine(dumpLine: string): ParsedCoordinates | null {
    // Look for _binary followed by quoted data
    const binaryMatch = dumpLine.match(/_binary\s+'([^']+)'/);
    if (binaryMatch) {
      return this.parseCoordinates(binaryMatch[1]);
    }

    // Look for hex data (0x followed by hex digits)
    const hexMatch = dumpLine.match(/0x([0-9A-Fa-f]+)/);
    if (hexMatch) {
      return this.parseCoordinates('0x' + hexMatch[1]);
    }

    // Look for POINT text format
    const pointMatch = dumpLine.match(/POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i);
    if (pointMatch) {
      return this.parseCoordinates(pointMatch[0]);
    }

    return null;
  }
}

/**
 * Helper function for easy coordinate parsing
 */
export function parseMySQLPoint(mysqlData: string | null): string | null {
  return MySQLCoordinateParser.parseToPostGIS(mysqlData);
}

/**
 * Helper function for coordinate validation
 */
export function validateCoordinates(lng: number, lat: number): boolean {
  return lng >= -10 && lng <= 35 && lat >= 50 && lat <= 75;
}