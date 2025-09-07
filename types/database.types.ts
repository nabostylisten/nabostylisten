export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  gis: {
    Tables: {
      spatial_ref_sys: {
        Row: {
          auth_name: string | null
          auth_srid: number | null
          proj4text: string | null
          srid: number
          srtext: string | null
        }
        Insert: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid: number
          srtext?: string | null
        }
        Update: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid?: number
          srtext?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      geography_columns: {
        Row: {
          coord_dimension: number | null
          f_geography_column: unknown | null
          f_table_catalog: unknown | null
          f_table_name: unknown | null
          f_table_schema: unknown | null
          srid: number | null
          type: string | null
        }
        Relationships: []
      }
      geometry_columns: {
        Row: {
          coord_dimension: number | null
          f_geometry_column: unknown | null
          f_table_catalog: string | null
          f_table_name: unknown | null
          f_table_schema: unknown | null
          srid: number | null
          type: string | null
        }
        Insert: {
          coord_dimension?: number | null
          f_geometry_column?: unknown | null
          f_table_catalog?: string | null
          f_table_name?: unknown | null
          f_table_schema?: unknown | null
          srid?: number | null
          type?: string | null
        }
        Update: {
          coord_dimension?: number | null
          f_geometry_column?: unknown | null
          f_table_catalog?: string | null
          f_table_name?: unknown | null
          f_table_schema?: unknown | null
          srid?: number | null
          type?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      _postgis_deprecate: {
        Args: { oldname: string; version: string; newname: string }
        Returns: undefined
      }
      _postgis_index_extent: {
        Args: { col: string; tbl: unknown }
        Returns: unknown
      }
      _postgis_pgsql_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      _postgis_scripts_pgsql_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      _postgis_selectivity: {
        Args: { geom: unknown; mode?: string; att_name: string; tbl: unknown }
        Returns: number
      }
      _st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_bestsrid: {
        Args: { "": unknown }
        Returns: number
      }
      _st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_containsproperly: {
        Args: { geom2: unknown; geom1: unknown }
        Returns: boolean
      }
      _st_coveredby: {
        Args:
          | { geog2: unknown; geog1: unknown }
          | { geom2: unknown; geom1: unknown }
        Returns: boolean
      }
      _st_covers: {
        Args:
          | { geog2: unknown; geog1: unknown }
          | { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_crosses: {
        Args: { geom2: unknown; geom1: unknown }
        Returns: boolean
      }
      _st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      _st_equals: {
        Args: { geom2: unknown; geom1: unknown }
        Returns: boolean
      }
      _st_intersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      _st_longestline: {
        Args: { geom2: unknown; geom1: unknown }
        Returns: unknown
      }
      _st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      _st_orderingequals: {
        Args: { geom2: unknown; geom1: unknown }
        Returns: boolean
      }
      _st_overlaps: {
        Args: { geom2: unknown; geom1: unknown }
        Returns: boolean
      }
      _st_pointoutside: {
        Args: { "": unknown }
        Returns: unknown
      }
      _st_sortablehash: {
        Args: { geom: unknown }
        Returns: number
      }
      _st_touches: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_voronoi: {
        Args: {
          g1: unknown
          clip?: unknown
          tolerance?: number
          return_polygons?: boolean
        }
        Returns: unknown
      }
      _st_within: {
        Args: { geom2: unknown; geom1: unknown }
        Returns: boolean
      }
      addauth: {
        Args: { "": string }
        Returns: boolean
      }
      addgeometrycolumn: {
        Args:
          | {
              table_name: string
              schema_name: string
              use_typmod?: boolean
              new_dim: number
              new_type: string
              new_srid: number
              column_name: string
            }
          | {
              table_name: string
              use_typmod?: boolean
              new_dim: number
              new_type: string
              new_srid: number
              column_name: string
            }
          | {
              use_typmod?: boolean
              catalog_name: string
              schema_name: string
              table_name: string
              column_name: string
              new_srid_in: number
              new_type: string
              new_dim: number
            }
        Returns: string
      }
      box: {
        Args: { "": unknown } | { "": unknown }
        Returns: unknown
      }
      box2d: {
        Args: { "": unknown } | { "": unknown }
        Returns: unknown
      }
      box2d_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      box2d_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      box2df_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      box2df_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      box3d: {
        Args: { "": unknown } | { "": unknown }
        Returns: unknown
      }
      box3d_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      box3d_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      box3dtobox: {
        Args: { "": unknown }
        Returns: unknown
      }
      bytea: {
        Args: { "": unknown } | { "": unknown }
        Returns: string
      }
      disablelongtransactions: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      dropgeometrycolumn: {
        Args:
          | {
              catalog_name: string
              schema_name: string
              table_name: string
              column_name: string
            }
          | { schema_name: string; table_name: string; column_name: string }
          | { table_name: string; column_name: string }
        Returns: string
      }
      dropgeometrytable: {
        Args:
          | { catalog_name: string; schema_name: string; table_name: string }
          | { schema_name: string; table_name: string }
          | { table_name: string }
        Returns: string
      }
      enablelongtransactions: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      equals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geography: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      geography_analyze: {
        Args: { "": unknown }
        Returns: boolean
      }
      geography_gist_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      geography_gist_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      geography_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      geography_send: {
        Args: { "": unknown }
        Returns: string
      }
      geography_spgist_compress_nd: {
        Args: { "": unknown }
        Returns: unknown
      }
      geography_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      geography_typmod_out: {
        Args: { "": number }
        Returns: unknown
      }
      geometry: {
        Args:
          | { "": string }
          | { "": string }
          | { "": unknown }
          | { "": unknown }
          | { "": unknown }
          | { "": unknown }
          | { "": unknown }
          | { "": unknown }
        Returns: unknown
      }
      geometry_above: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_analyze: {
        Args: { "": unknown }
        Returns: boolean
      }
      geometry_below: {
        Args: { geom2: unknown; geom1: unknown }
        Returns: boolean
      }
      geometry_cmp: {
        Args: { geom2: unknown; geom1: unknown }
        Returns: number
      }
      geometry_contained_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains: {
        Args: { geom2: unknown; geom1: unknown }
        Returns: boolean
      }
      geometry_contains_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_distance_box: {
        Args: { geom2: unknown; geom1: unknown }
        Returns: number
      }
      geometry_distance_centroid: {
        Args: { geom2: unknown; geom1: unknown }
        Returns: number
      }
      geometry_eq: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_ge: {
        Args: { geom2: unknown; geom1: unknown }
        Returns: boolean
      }
      geometry_gist_compress_2d: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_gist_compress_nd: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_gist_decompress_2d: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_gist_decompress_nd: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_gist_sortsupport_2d: {
        Args: { "": unknown }
        Returns: undefined
      }
      geometry_gt: {
        Args: { geom2: unknown; geom1: unknown }
        Returns: boolean
      }
      geometry_hash: {
        Args: { "": unknown }
        Returns: number
      }
      geometry_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_le: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_left: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_lt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_overabove: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overbelow: {
        Args: { geom2: unknown; geom1: unknown }
        Returns: boolean
      }
      geometry_overlaps: {
        Args: { geom2: unknown; geom1: unknown }
        Returns: boolean
      }
      geometry_overlaps_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overleft: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overright: {
        Args: { geom2: unknown; geom1: unknown }
        Returns: boolean
      }
      geometry_recv: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_right: {
        Args: { geom2: unknown; geom1: unknown }
        Returns: boolean
      }
      geometry_same: {
        Args: { geom2: unknown; geom1: unknown }
        Returns: boolean
      }
      geometry_same_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_send: {
        Args: { "": unknown }
        Returns: string
      }
      geometry_sortsupport: {
        Args: { "": unknown }
        Returns: undefined
      }
      geometry_spgist_compress_2d: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_spgist_compress_3d: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_spgist_compress_nd: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      geometry_typmod_out: {
        Args: { "": number }
        Returns: unknown
      }
      geometry_within: {
        Args: { geom2: unknown; geom1: unknown }
        Returns: boolean
      }
      geometrytype: {
        Args: { "": unknown } | { "": unknown }
        Returns: string
      }
      geomfromewkb: {
        Args: { "": string }
        Returns: unknown
      }
      geomfromewkt: {
        Args: { "": string }
        Returns: unknown
      }
      get_proj4_from_srid: {
        Args: { "": number }
        Returns: string
      }
      gettransactionid: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      gidx_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gidx_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      json: {
        Args: { "": unknown }
        Returns: Json
      }
      jsonb: {
        Args: { "": unknown }
        Returns: Json
      }
      longtransactionsenabled: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      path: {
        Args: { "": unknown }
        Returns: unknown
      }
      pgis_asflatgeobuf_finalfn: {
        Args: { "": unknown }
        Returns: string
      }
      pgis_asgeobuf_finalfn: {
        Args: { "": unknown }
        Returns: string
      }
      pgis_asmvt_finalfn: {
        Args: { "": unknown }
        Returns: string
      }
      pgis_asmvt_serialfn: {
        Args: { "": unknown }
        Returns: string
      }
      pgis_geometry_clusterintersecting_finalfn: {
        Args: { "": unknown }
        Returns: unknown[]
      }
      pgis_geometry_clusterwithin_finalfn: {
        Args: { "": unknown }
        Returns: unknown[]
      }
      pgis_geometry_collect_finalfn: {
        Args: { "": unknown }
        Returns: unknown
      }
      pgis_geometry_makeline_finalfn: {
        Args: { "": unknown }
        Returns: unknown
      }
      pgis_geometry_polygonize_finalfn: {
        Args: { "": unknown }
        Returns: unknown
      }
      pgis_geometry_union_parallel_finalfn: {
        Args: { "": unknown }
        Returns: unknown
      }
      pgis_geometry_union_parallel_serialfn: {
        Args: { "": unknown }
        Returns: string
      }
      point: {
        Args: { "": unknown }
        Returns: unknown
      }
      polygon: {
        Args: { "": unknown }
        Returns: unknown
      }
      populate_geometry_columns: {
        Args:
          | { tbl_oid: unknown; use_typmod?: boolean }
          | { use_typmod?: boolean }
        Returns: string
      }
      postgis_addbbox: {
        Args: { "": unknown }
        Returns: unknown
      }
      postgis_constraint_dims: {
        Args: { geomschema: string; geomtable: string; geomcolumn: string }
        Returns: number
      }
      postgis_constraint_srid: {
        Args: { geomschema: string; geomtable: string; geomcolumn: string }
        Returns: number
      }
      postgis_constraint_type: {
        Args: { geomschema: string; geomtable: string; geomcolumn: string }
        Returns: string
      }
      postgis_dropbbox: {
        Args: { "": unknown }
        Returns: unknown
      }
      postgis_extensions_upgrade: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_full_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_geos_noop: {
        Args: { "": unknown }
        Returns: unknown
      }
      postgis_geos_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_getbbox: {
        Args: { "": unknown }
        Returns: unknown
      }
      postgis_hasbbox: {
        Args: { "": unknown }
        Returns: boolean
      }
      postgis_index_supportfn: {
        Args: { "": unknown }
        Returns: unknown
      }
      postgis_lib_build_date: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_lib_revision: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_lib_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_libjson_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_liblwgeom_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_libprotobuf_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_libxml_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_noop: {
        Args: { "": unknown }
        Returns: unknown
      }
      postgis_proj_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_scripts_build_date: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_scripts_installed: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_scripts_released: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_svn_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_type_name: {
        Args: {
          geomname: string
          coord_dimension: number
          use_new_name?: boolean
        }
        Returns: string
      }
      postgis_typmod_dims: {
        Args: { "": number }
        Returns: number
      }
      postgis_typmod_srid: {
        Args: { "": number }
        Returns: number
      }
      postgis_typmod_type: {
        Args: { "": number }
        Returns: string
      }
      postgis_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_wagyu_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      spheroid_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      spheroid_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_3dclosestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3ddistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dintersects: {
        Args: { geom2: unknown; geom1: unknown }
        Returns: boolean
      }
      st_3dlength: {
        Args: { "": unknown }
        Returns: number
      }
      st_3dlongestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmakebox: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmaxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dperimeter: {
        Args: { "": unknown }
        Returns: number
      }
      st_3dshortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_addpoint: {
        Args: { geom2: unknown; geom1: unknown }
        Returns: unknown
      }
      st_angle: {
        Args:
          | { line1: unknown; line2: unknown }
          | { pt4?: unknown; pt2: unknown; pt3: unknown; pt1: unknown }
        Returns: number
      }
      st_area: {
        Args:
          | { "": string }
          | { "": unknown }
          | { geog: unknown; use_spheroid?: boolean }
        Returns: number
      }
      st_area2d: {
        Args: { "": unknown }
        Returns: number
      }
      st_asbinary: {
        Args: { "": unknown } | { "": unknown }
        Returns: string
      }
      st_asencodedpolyline: {
        Args: { geom: unknown; nprecision?: number }
        Returns: string
      }
      st_asewkb: {
        Args: { "": unknown }
        Returns: string
      }
      st_asewkt: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: string
      }
      st_asgeojson: {
        Args:
          | { "": string }
          | { options?: number; geog: unknown; maxdecimaldigits?: number }
          | { options?: number; maxdecimaldigits?: number; geom: unknown }
          | {
              pretty_bool?: boolean
              r: Record<string, unknown>
              geom_column?: string
              maxdecimaldigits?: number
            }
        Returns: string
      }
      st_asgml: {
        Args:
          | { "": string }
          | {
              nprefix?: string
              id?: string
              options?: number
              version: number
              geog: unknown
              maxdecimaldigits?: number
            }
          | { options?: number; geom: unknown; maxdecimaldigits?: number }
          | {
              options?: number
              id?: string
              nprefix?: string
              geog: unknown
              maxdecimaldigits?: number
            }
          | {
              version: number
              id?: string
              nprefix?: string
              options?: number
              maxdecimaldigits?: number
              geom: unknown
            }
        Returns: string
      }
      st_ashexewkb: {
        Args: { "": unknown }
        Returns: string
      }
      st_askml: {
        Args:
          | { "": string }
          | { geog: unknown; nprefix?: string; maxdecimaldigits?: number }
          | { geom: unknown; nprefix?: string; maxdecimaldigits?: number }
        Returns: string
      }
      st_aslatlontext: {
        Args: { geom: unknown; tmpl?: string }
        Returns: string
      }
      st_asmarc21: {
        Args: { format?: string; geom: unknown }
        Returns: string
      }
      st_asmvtgeom: {
        Args: {
          extent?: number
          clip_geom?: boolean
          bounds: unknown
          buffer?: number
          geom: unknown
        }
        Returns: unknown
      }
      st_assvg: {
        Args:
          | { "": string }
          | { rel?: number; geog: unknown; maxdecimaldigits?: number }
          | { rel?: number; geom: unknown; maxdecimaldigits?: number }
        Returns: string
      }
      st_astext: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: string
      }
      st_astwkb: {
        Args:
          | {
              prec_z?: number
              prec_m?: number
              with_sizes?: boolean
              with_boxes?: boolean
              ids: number[]
              geom: unknown[]
              prec?: number
            }
          | {
              prec_z?: number
              with_sizes?: boolean
              with_boxes?: boolean
              geom: unknown
              prec?: number
              prec_m?: number
            }
        Returns: string
      }
      st_asx3d: {
        Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
        Returns: string
      }
      st_azimuth: {
        Args:
          | { geog2: unknown; geog1: unknown }
          | { geom2: unknown; geom1: unknown }
        Returns: number
      }
      st_boundary: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_boundingdiagonal: {
        Args: { geom: unknown; fits?: boolean }
        Returns: unknown
      }
      st_buffer: {
        Args:
          | { radius: number; options?: string; geom: unknown }
          | { radius: number; quadsegs: number; geom: unknown }
        Returns: unknown
      }
      st_buildarea: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_centroid: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      st_cleangeometry: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_clipbybox2d: {
        Args: { box: unknown; geom: unknown }
        Returns: unknown
      }
      st_closestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_clusterintersecting: {
        Args: { "": unknown[] }
        Returns: unknown[]
      }
      st_collect: {
        Args: { "": unknown[] } | { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_collectionextract: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_collectionhomogenize: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_concavehull: {
        Args: {
          param_geom: unknown
          param_pctconvex: number
          param_allow_holes?: boolean
        }
        Returns: unknown
      }
      st_contains: {
        Args: { geom2: unknown; geom1: unknown }
        Returns: boolean
      }
      st_containsproperly: {
        Args: { geom2: unknown; geom1: unknown }
        Returns: boolean
      }
      st_convexhull: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_coorddim: {
        Args: { geometry: unknown }
        Returns: number
      }
      st_coveredby: {
        Args:
          | { geog2: unknown; geog1: unknown }
          | { geom2: unknown; geom1: unknown }
        Returns: boolean
      }
      st_covers: {
        Args:
          | { geog1: unknown; geog2: unknown }
          | { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_crosses: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_curvetoline: {
        Args: { toltype?: number; geom: unknown; tol?: number; flags?: number }
        Returns: unknown
      }
      st_delaunaytriangles: {
        Args: { g1: unknown; flags?: number; tolerance?: number }
        Returns: unknown
      }
      st_difference: {
        Args: { geom1: unknown; gridsize?: number; geom2: unknown }
        Returns: unknown
      }
      st_dimension: {
        Args: { "": unknown }
        Returns: number
      }
      st_disjoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_distance: {
        Args:
          | { geom1: unknown; geom2: unknown }
          | { use_spheroid?: boolean; geog2: unknown; geog1: unknown }
        Returns: number
      }
      st_distancesphere: {
        Args:
          | { geom1: unknown; geom2: unknown }
          | { geom2: unknown; geom1: unknown; radius: number }
        Returns: number
      }
      st_distancespheroid: {
        Args: { geom2: unknown; geom1: unknown }
        Returns: number
      }
      st_dump: {
        Args: { "": unknown }
        Returns: Database["gis"]["CompositeTypes"]["geometry_dump"][]
      }
      st_dumppoints: {
        Args: { "": unknown }
        Returns: Database["gis"]["CompositeTypes"]["geometry_dump"][]
      }
      st_dumprings: {
        Args: { "": unknown }
        Returns: Database["gis"]["CompositeTypes"]["geometry_dump"][]
      }
      st_dumpsegments: {
        Args: { "": unknown }
        Returns: Database["gis"]["CompositeTypes"]["geometry_dump"][]
      }
      st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      st_endpoint: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_envelope: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_equals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_expand: {
        Args:
          | { dx: number; box: unknown; dy: number; dz?: number }
          | { dx: number; dy: number; box: unknown }
          | { dx: number; dy: number; dm?: number; dz?: number; geom: unknown }
        Returns: unknown
      }
      st_exteriorring: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_flipcoordinates: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_force2d: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_force3d: {
        Args: { zvalue?: number; geom: unknown }
        Returns: unknown
      }
      st_force3dm: {
        Args: { geom: unknown; mvalue?: number }
        Returns: unknown
      }
      st_force3dz: {
        Args: { geom: unknown; zvalue?: number }
        Returns: unknown
      }
      st_force4d: {
        Args: { mvalue?: number; geom: unknown; zvalue?: number }
        Returns: unknown
      }
      st_forcecollection: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_forcecurve: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_forcepolygonccw: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_forcepolygoncw: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_forcerhr: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_forcesfs: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_generatepoints: {
        Args:
          | { npoints: number; area: unknown }
          | { npoints: number; area: unknown; seed: number }
        Returns: unknown
      }
      st_geogfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_geogfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_geographyfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_geohash: {
        Args:
          | { geom: unknown; maxchars?: number }
          | { maxchars?: number; geog: unknown }
        Returns: string
      }
      st_geomcollfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_geomcollfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_geometricmedian: {
        Args: {
          fail_if_not_converged?: boolean
          max_iter?: number
          tolerance?: number
          g: unknown
        }
        Returns: unknown
      }
      st_geometryfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_geometrytype: {
        Args: { "": unknown }
        Returns: string
      }
      st_geomfromewkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_geomfromewkt: {
        Args: { "": string }
        Returns: unknown
      }
      st_geomfromgeojson: {
        Args: { "": Json } | { "": Json } | { "": string }
        Returns: unknown
      }
      st_geomfromgml: {
        Args: { "": string }
        Returns: unknown
      }
      st_geomfromkml: {
        Args: { "": string }
        Returns: unknown
      }
      st_geomfrommarc21: {
        Args: { marc21xml: string }
        Returns: unknown
      }
      st_geomfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_geomfromtwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_geomfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_gmltosql: {
        Args: { "": string }
        Returns: unknown
      }
      st_hasarc: {
        Args: { geometry: unknown }
        Returns: boolean
      }
      st_hausdorffdistance: {
        Args: { geom2: unknown; geom1: unknown }
        Returns: number
      }
      st_hexagon: {
        Args: { cell_i: number; origin?: unknown; size: number; cell_j: number }
        Returns: unknown
      }
      st_hexagongrid: {
        Args: { size: number; bounds: unknown }
        Returns: Record<string, unknown>[]
      }
      st_interpolatepoint: {
        Args: { line: unknown; point: unknown }
        Returns: number
      }
      st_intersection: {
        Args: { geom2: unknown; geom1: unknown; gridsize?: number }
        Returns: unknown
      }
      st_intersects: {
        Args:
          | { geog1: unknown; geog2: unknown }
          | { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_isclosed: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_iscollection: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_isempty: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_ispolygonccw: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_ispolygoncw: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_isring: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_issimple: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_isvalid: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_isvaliddetail: {
        Args: { flags?: number; geom: unknown }
        Returns: Database["gis"]["CompositeTypes"]["valid_detail"]
      }
      st_isvalidreason: {
        Args: { "": unknown }
        Returns: string
      }
      st_isvalidtrajectory: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_length: {
        Args:
          | { "": string }
          | { "": unknown }
          | { geog: unknown; use_spheroid?: boolean }
        Returns: number
      }
      st_length2d: {
        Args: { "": unknown }
        Returns: number
      }
      st_letters: {
        Args: { letters: string; font?: Json }
        Returns: unknown
      }
      st_linecrossingdirection: {
        Args: { line2: unknown; line1: unknown }
        Returns: number
      }
      st_linefromencodedpolyline: {
        Args: { txtin: string; nprecision?: number }
        Returns: unknown
      }
      st_linefrommultipoint: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_linefromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_linefromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_linelocatepoint: {
        Args: { geom2: unknown; geom1: unknown }
        Returns: number
      }
      st_linemerge: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_linestringfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_linetocurve: {
        Args: { geometry: unknown }
        Returns: unknown
      }
      st_locatealong: {
        Args: { geometry: unknown; measure: number; leftrightoffset?: number }
        Returns: unknown
      }
      st_locatebetween: {
        Args: {
          geometry: unknown
          frommeasure: number
          leftrightoffset?: number
          tomeasure: number
        }
        Returns: unknown
      }
      st_locatebetweenelevations: {
        Args: { geometry: unknown; fromelevation: number; toelevation: number }
        Returns: unknown
      }
      st_longestline: {
        Args: { geom2: unknown; geom1: unknown }
        Returns: unknown
      }
      st_m: {
        Args: { "": unknown }
        Returns: number
      }
      st_makebox2d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makeline: {
        Args: { "": unknown[] } | { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makepolygon: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_makevalid: {
        Args: { "": unknown } | { params: string; geom: unknown }
        Returns: unknown
      }
      st_maxdistance: {
        Args: { geom2: unknown; geom1: unknown }
        Returns: number
      }
      st_maximuminscribedcircle: {
        Args: { "": unknown }
        Returns: Record<string, unknown>
      }
      st_memsize: {
        Args: { "": unknown }
        Returns: number
      }
      st_minimumboundingcircle: {
        Args: { segs_per_quarter?: number; inputgeom: unknown }
        Returns: unknown
      }
      st_minimumboundingradius: {
        Args: { "": unknown }
        Returns: Record<string, unknown>
      }
      st_minimumclearance: {
        Args: { "": unknown }
        Returns: number
      }
      st_minimumclearanceline: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_mlinefromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_mlinefromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_mpointfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_mpointfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_mpolyfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_mpolyfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_multi: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_multilinefromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_multilinestringfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_multipointfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_multipointfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_multipolyfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_multipolygonfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_ndims: {
        Args: { "": unknown }
        Returns: number
      }
      st_node: {
        Args: { g: unknown }
        Returns: unknown
      }
      st_normalize: {
        Args: { geom: unknown }
        Returns: unknown
      }
      st_npoints: {
        Args: { "": unknown }
        Returns: number
      }
      st_nrings: {
        Args: { "": unknown }
        Returns: number
      }
      st_numgeometries: {
        Args: { "": unknown }
        Returns: number
      }
      st_numinteriorring: {
        Args: { "": unknown }
        Returns: number
      }
      st_numinteriorrings: {
        Args: { "": unknown }
        Returns: number
      }
      st_numpatches: {
        Args: { "": unknown }
        Returns: number
      }
      st_numpoints: {
        Args: { "": unknown }
        Returns: number
      }
      st_offsetcurve: {
        Args: { params?: string; line: unknown; distance: number }
        Returns: unknown
      }
      st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_orientedenvelope: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_perimeter: {
        Args: { "": unknown } | { geog: unknown; use_spheroid?: boolean }
        Returns: number
      }
      st_perimeter2d: {
        Args: { "": unknown }
        Returns: number
      }
      st_pointfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_pointfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_pointm: {
        Args: {
          ycoordinate: number
          srid?: number
          xcoordinate: number
          mcoordinate: number
        }
        Returns: unknown
      }
      st_pointonsurface: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_points: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_pointz: {
        Args: {
          ycoordinate: number
          srid?: number
          xcoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_pointzm: {
        Args: {
          zcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
          mcoordinate: number
        }
        Returns: unknown
      }
      st_polyfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_polyfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_polygonfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_polygonfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_polygonize: {
        Args: { "": unknown[] }
        Returns: unknown
      }
      st_project: {
        Args: { distance: number; azimuth: number; geog: unknown }
        Returns: unknown
      }
      st_quantizecoordinates: {
        Args: {
          prec_m?: number
          g: unknown
          prec_x: number
          prec_y?: number
          prec_z?: number
        }
        Returns: unknown
      }
      st_reduceprecision: {
        Args: { gridsize: number; geom: unknown }
        Returns: unknown
      }
      st_relate: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: string
      }
      st_removerepeatedpoints: {
        Args: { tolerance?: number; geom: unknown }
        Returns: unknown
      }
      st_reverse: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_segmentize: {
        Args: { max_segment_length: number; geog: unknown }
        Returns: unknown
      }
      st_setsrid: {
        Args: { srid: number; geog: unknown } | { srid: number; geom: unknown }
        Returns: unknown
      }
      st_sharedpaths: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_shiftlongitude: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_shortestline: {
        Args: { geom2: unknown; geom1: unknown }
        Returns: unknown
      }
      st_simplifypolygonhull: {
        Args: { geom: unknown; vertex_fraction: number; is_outer?: boolean }
        Returns: unknown
      }
      st_split: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_square: {
        Args: { cell_i: number; origin?: unknown; size: number; cell_j: number }
        Returns: unknown
      }
      st_squaregrid: {
        Args: { size: number; bounds: unknown }
        Returns: Record<string, unknown>[]
      }
      st_srid: {
        Args: { geog: unknown } | { geom: unknown }
        Returns: number
      }
      st_startpoint: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_subdivide: {
        Args: { maxvertices?: number; geom: unknown; gridsize?: number }
        Returns: unknown[]
      }
      st_summary: {
        Args: { "": unknown } | { "": unknown }
        Returns: string
      }
      st_swapordinates: {
        Args: { geom: unknown; ords: unknown }
        Returns: unknown
      }
      st_symdifference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_symmetricdifference: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_tileenvelope: {
        Args: {
          bounds?: unknown
          zoom: number
          x: number
          y: number
          margin?: number
        }
        Returns: unknown
      }
      st_touches: {
        Args: { geom2: unknown; geom1: unknown }
        Returns: boolean
      }
      st_transform: {
        Args:
          | { from_proj: string; geom: unknown; to_proj: string }
          | { to_proj: string; geom: unknown }
          | { to_srid: number; geom: unknown; from_proj: string }
        Returns: unknown
      }
      st_triangulatepolygon: {
        Args: { g1: unknown }
        Returns: unknown
      }
      st_union: {
        Args:
          | { "": unknown[] }
          | { geom2: unknown; geom1: unknown }
          | { geom2: unknown; gridsize: number; geom1: unknown }
        Returns: unknown
      }
      st_voronoilines: {
        Args: { g1: unknown; tolerance?: number; extend_to?: unknown }
        Returns: unknown
      }
      st_voronoipolygons: {
        Args: { g1: unknown; tolerance?: number; extend_to?: unknown }
        Returns: unknown
      }
      st_within: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_wkbtosql: {
        Args: { wkb: string }
        Returns: unknown
      }
      st_wkttosql: {
        Args: { "": string }
        Returns: unknown
      }
      st_wrapx: {
        Args: { move: number; wrap: number; geom: unknown }
        Returns: unknown
      }
      st_x: {
        Args: { "": unknown }
        Returns: number
      }
      st_xmax: {
        Args: { "": unknown }
        Returns: number
      }
      st_xmin: {
        Args: { "": unknown }
        Returns: number
      }
      st_y: {
        Args: { "": unknown }
        Returns: number
      }
      st_ymax: {
        Args: { "": unknown }
        Returns: number
      }
      st_ymin: {
        Args: { "": unknown }
        Returns: number
      }
      st_z: {
        Args: { "": unknown }
        Returns: number
      }
      st_zmax: {
        Args: { "": unknown }
        Returns: number
      }
      st_zmflag: {
        Args: { "": unknown }
        Returns: number
      }
      st_zmin: {
        Args: { "": unknown }
        Returns: number
      }
      text: {
        Args: { "": unknown }
        Returns: string
      }
      unlockrows: {
        Args: { "": string }
        Returns: number
      }
      updategeometrysrid: {
        Args: {
          catalogn_name: string
          schema_name: string
          table_name: string
          column_name: string
          new_srid_in: number
        }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      geometry_dump: {
        path: number[] | null
        geom: unknown | null
      }
      valid_detail: {
        valid: boolean | null
        reason: string | null
        location: unknown | null
      }
    }
  }
  public: {
    Tables: {
      addresses: {
        Row: {
          city: string
          country: string
          country_code: string | null
          created_at: string
          entry_instructions: string | null
          id: string
          is_primary: boolean
          location: unknown | null
          nickname: string | null
          postal_code: string
          street_address: string
          updated_at: string
          user_id: string
        }
        Insert: {
          city: string
          country: string
          country_code?: string | null
          created_at?: string
          entry_instructions?: string | null
          id?: string
          is_primary?: boolean
          location?: unknown | null
          nickname?: string | null
          postal_code: string
          street_address: string
          updated_at?: string
          user_id: string
        }
        Update: {
          city?: string
          country?: string
          country_code?: string | null
          created_at?: string
          entry_instructions?: string | null
          id?: string
          is_primary?: boolean
          location?: unknown | null
          nickname?: string | null
          postal_code?: string
          street_address?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "addresses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_applications: {
        Row: {
          created_at: string
          expected_referrals: number | null
          id: string
          marketing_strategy: string | null
          reason: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          social_media_reach: number | null
          status: Database["public"]["Enums"]["affiliate_application_status"]
          stylist_id: string
          terms_accepted: boolean
          terms_accepted_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          expected_referrals?: number | null
          id?: string
          marketing_strategy?: string | null
          reason: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          social_media_reach?: number | null
          status?: Database["public"]["Enums"]["affiliate_application_status"]
          stylist_id: string
          terms_accepted?: boolean
          terms_accepted_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          expected_referrals?: number | null
          id?: string
          marketing_strategy?: string | null
          reason?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          social_media_reach?: number | null
          status?: Database["public"]["Enums"]["affiliate_application_status"]
          stylist_id?: string
          terms_accepted?: boolean
          terms_accepted_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_applications_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_applications_stylist_id_fkey"
            columns: ["stylist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_clicks: {
        Row: {
          affiliate_link_id: string
          booking_id: string | null
          city: string | null
          commission_amount: number
          converted: boolean
          converted_at: string | null
          country_code: string | null
          created_at: string
          id: string
          ip_address: string | null
          landing_page: string | null
          referrer: string | null
          stylist_id: string
          user_agent: string | null
          user_id: string | null
          visitor_id: string | null
        }
        Insert: {
          affiliate_link_id: string
          booking_id?: string | null
          city?: string | null
          commission_amount?: number
          converted?: boolean
          converted_at?: string | null
          country_code?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          landing_page?: string | null
          referrer?: string | null
          stylist_id: string
          user_agent?: string | null
          user_id?: string | null
          visitor_id?: string | null
        }
        Update: {
          affiliate_link_id?: string
          booking_id?: string | null
          city?: string | null
          commission_amount?: number
          converted?: boolean
          converted_at?: string | null
          country_code?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          landing_page?: string | null
          referrer?: string | null
          stylist_id?: string
          user_agent?: string | null
          user_id?: string | null
          visitor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_clicks_affiliate_link_id_fkey"
            columns: ["affiliate_link_id"]
            isOneToOne: false
            referencedRelation: "affiliate_links"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_clicks_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_clicks_stylist_id_fkey"
            columns: ["stylist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_clicks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_commissions: {
        Row: {
          affiliate_id: string
          amount: number
          booking_id: string
          commission_percentage: number
          created_at: string
          currency: string
          id: string
          notes: string | null
          paid_at: string | null
          payout_id: string | null
          status: Database["public"]["Enums"]["affiliate_payout_status"]
          updated_at: string
        }
        Insert: {
          affiliate_id: string
          amount: number
          booking_id: string
          commission_percentage: number
          created_at?: string
          currency?: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          payout_id?: string | null
          status?: Database["public"]["Enums"]["affiliate_payout_status"]
          updated_at?: string
        }
        Update: {
          affiliate_id?: string
          amount?: number
          booking_id?: string
          commission_percentage?: number
          created_at?: string
          currency?: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          payout_id?: string | null
          status?: Database["public"]["Enums"]["affiliate_payout_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_commissions_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_commissions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_commissions_payout_id_fkey"
            columns: ["payout_id"]
            isOneToOne: false
            referencedRelation: "affiliate_payouts"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_links: {
        Row: {
          application_id: string
          click_count: number
          commission_percentage: number
          conversion_count: number
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          link_code: string
          notes: string | null
          stylist_id: string
          total_commission_earned: number
          updated_at: string
        }
        Insert: {
          application_id: string
          click_count?: number
          commission_percentage?: number
          conversion_count?: number
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          link_code: string
          notes?: string | null
          stylist_id: string
          total_commission_earned?: number
          updated_at?: string
        }
        Update: {
          application_id?: string
          click_count?: number
          commission_percentage?: number
          conversion_count?: number
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          link_code?: string
          notes?: string | null
          stylist_id?: string
          total_commission_earned?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_links_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: true
            referencedRelation: "affiliate_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_links_stylist_id_fkey"
            columns: ["stylist_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_payouts: {
        Row: {
          affiliate_link_id: string
          created_at: string
          currency: string
          email_sent: boolean
          id: string
          notes: string | null
          payout_amount: number
          period_end: string
          period_start: string
          processed_at: string | null
          processed_by: string | null
          status: Database["public"]["Enums"]["affiliate_payout_status"]
          stripe_payout_id: string | null
          stripe_transfer_id: string | null
          stylist_id: string
          total_bookings: number
          total_commission_earned: number
          updated_at: string
        }
        Insert: {
          affiliate_link_id: string
          created_at?: string
          currency?: string
          email_sent?: boolean
          id?: string
          notes?: string | null
          payout_amount: number
          period_end: string
          period_start: string
          processed_at?: string | null
          processed_by?: string | null
          status?: Database["public"]["Enums"]["affiliate_payout_status"]
          stripe_payout_id?: string | null
          stripe_transfer_id?: string | null
          stylist_id: string
          total_bookings: number
          total_commission_earned: number
          updated_at?: string
        }
        Update: {
          affiliate_link_id?: string
          created_at?: string
          currency?: string
          email_sent?: boolean
          id?: string
          notes?: string | null
          payout_amount?: number
          period_end?: string
          period_start?: string
          processed_at?: string | null
          processed_by?: string | null
          status?: Database["public"]["Enums"]["affiliate_payout_status"]
          stripe_payout_id?: string | null
          stripe_transfer_id?: string | null
          stylist_id?: string
          total_bookings?: number
          total_commission_earned?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_payouts_affiliate_link_id_fkey"
            columns: ["affiliate_link_id"]
            isOneToOne: false
            referencedRelation: "affiliate_links"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_payouts_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_payouts_stylist_id_fkey"
            columns: ["stylist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      application_categories: {
        Row: {
          application_id: string
          category_id: string
        }
        Insert: {
          application_id: string
          category_id: string
        }
        Update: {
          application_id?: string
          category_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_categories_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          address_geometry: unknown | null
          address_nickname: string | null
          birth_date: string
          city: string
          country: string
          country_code: string | null
          created_at: string
          email: string
          entry_instructions: string | null
          full_name: string
          id: string
          phone_number: string
          postal_code: string
          price_range_currency: string
          price_range_from: number
          price_range_to: number
          professional_experience: string
          status: Database["public"]["Enums"]["application_status"]
          street_address: string
          user_id: string | null
        }
        Insert: {
          address_geometry?: unknown | null
          address_nickname?: string | null
          birth_date: string
          city: string
          country: string
          country_code?: string | null
          created_at?: string
          email: string
          entry_instructions?: string | null
          full_name: string
          id?: string
          phone_number: string
          postal_code: string
          price_range_currency?: string
          price_range_from: number
          price_range_to: number
          professional_experience: string
          status?: Database["public"]["Enums"]["application_status"]
          street_address: string
          user_id?: string | null
        }
        Update: {
          address_geometry?: unknown | null
          address_nickname?: string | null
          birth_date?: string
          city?: string
          country?: string
          country_code?: string | null
          created_at?: string
          email?: string
          entry_instructions?: string | null
          full_name?: string
          id?: string
          phone_number?: string
          postal_code?: string
          price_range_currency?: string
          price_range_from?: number
          price_range_to?: number
          professional_experience?: string
          status?: Database["public"]["Enums"]["application_status"]
          street_address?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_notes: {
        Row: {
          booking_id: string
          category: Database["public"]["Enums"]["booking_note_category"]
          content: string
          created_at: string
          customer_visible: boolean
          duration_minutes: number | null
          id: string
          next_appointment_suggestion: string | null
          stylist_id: string
          tags: string[]
          updated_at: string
        }
        Insert: {
          booking_id: string
          category?: Database["public"]["Enums"]["booking_note_category"]
          content: string
          created_at?: string
          customer_visible?: boolean
          duration_minutes?: number | null
          id?: string
          next_appointment_suggestion?: string | null
          stylist_id: string
          tags?: string[]
          updated_at?: string
        }
        Update: {
          booking_id?: string
          category?: Database["public"]["Enums"]["booking_note_category"]
          content?: string
          created_at?: string
          customer_visible?: boolean
          duration_minutes?: number | null
          id?: string
          next_appointment_suggestion?: string | null
          stylist_id?: string
          tags?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_notes_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_notes_stylist_id_fkey"
            columns: ["stylist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_services: {
        Row: {
          booking_id: string
          service_id: string
        }
        Insert: {
          booking_id: string
          service_id: string
        }
        Update: {
          booking_id?: string
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_services_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          address_id: string | null
          awaiting_payment_setup: boolean
          cancellation_reason: string | null
          cancelled_at: string | null
          created_at: string
          customer_id: string
          customer_receipt_email_sent_at: string | null
          discount_applied: number
          discount_id: string | null
          end_time: string
          id: string
          is_trial_session: boolean
          main_booking_id: string | null
          message_to_stylist: string | null
          payment_captured_at: string | null
          payout_email_sent_at: string | null
          payout_processed_at: string | null
          reschedule_reason: string | null
          rescheduled_at: string | null
          rescheduled_from: string | null
          start_time: string
          status: Database["public"]["Enums"]["booking_status"]
          stripe_payment_intent_id: string | null
          stylist_id: string
          stylist_notification_email_sent_at: string | null
          total_duration_minutes: number
          total_price: number
          trial_booking_id: string | null
          updated_at: string
        }
        Insert: {
          address_id?: string | null
          awaiting_payment_setup?: boolean
          cancellation_reason?: string | null
          cancelled_at?: string | null
          created_at?: string
          customer_id: string
          customer_receipt_email_sent_at?: string | null
          discount_applied?: number
          discount_id?: string | null
          end_time: string
          id?: string
          is_trial_session?: boolean
          main_booking_id?: string | null
          message_to_stylist?: string | null
          payment_captured_at?: string | null
          payout_email_sent_at?: string | null
          payout_processed_at?: string | null
          reschedule_reason?: string | null
          rescheduled_at?: string | null
          rescheduled_from?: string | null
          start_time: string
          status?: Database["public"]["Enums"]["booking_status"]
          stripe_payment_intent_id?: string | null
          stylist_id: string
          stylist_notification_email_sent_at?: string | null
          total_duration_minutes: number
          total_price: number
          trial_booking_id?: string | null
          updated_at?: string
        }
        Update: {
          address_id?: string | null
          awaiting_payment_setup?: boolean
          cancellation_reason?: string | null
          cancelled_at?: string | null
          created_at?: string
          customer_id?: string
          customer_receipt_email_sent_at?: string | null
          discount_applied?: number
          discount_id?: string | null
          end_time?: string
          id?: string
          is_trial_session?: boolean
          main_booking_id?: string | null
          message_to_stylist?: string | null
          payment_captured_at?: string | null
          payout_email_sent_at?: string | null
          payout_processed_at?: string | null
          reschedule_reason?: string | null
          rescheduled_at?: string | null
          rescheduled_from?: string | null
          start_time?: string
          status?: Database["public"]["Enums"]["booking_status"]
          stripe_payment_intent_id?: string | null
          stylist_id?: string
          stylist_notification_email_sent_at?: string | null
          total_duration_minutes?: number
          total_price?: number
          trial_booking_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_address_id_fkey"
            columns: ["address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_discount_id_fkey"
            columns: ["discount_id"]
            isOneToOne: false
            referencedRelation: "discounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_main_booking_id_fkey"
            columns: ["main_booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_stylist_id_fkey"
            columns: ["stylist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_trial_booking_id_fkey"
            columns: ["trial_booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          chat_id: string
          content: string
          created_at: string
          id: string
          is_read: boolean
          sender_id: string
        }
        Insert: {
          chat_id: string
          content: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id: string
        }
        Update: {
          chat_id?: string
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chats: {
        Row: {
          booking_id: string
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chats_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      discount_restrictions: {
        Row: {
          discount_id: string
          profile_id: string
        }
        Insert: {
          discount_id: string
          profile_id: string
        }
        Update: {
          discount_id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "discount_restrictions_discount_id_fkey"
            columns: ["discount_id"]
            isOneToOne: false
            referencedRelation: "discounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discount_restrictions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      discount_usage: {
        Row: {
          booking_id: string | null
          created_at: string
          discount_id: string
          id: string
          profile_id: string
          updated_at: string
          used_at: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          discount_id: string
          id?: string
          profile_id: string
          updated_at?: string
          used_at?: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          discount_id?: string
          id?: string
          profile_id?: string
          updated_at?: string
          used_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "discount_usage_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discount_usage_discount_id_fkey"
            columns: ["discount_id"]
            isOneToOne: false
            referencedRelation: "discounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discount_usage_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      discounts: {
        Row: {
          code: string
          created_at: string
          currency: string
          current_uses: number
          description: string | null
          discount_amount: number | null
          discount_percentage: number | null
          expires_at: string | null
          id: string
          is_active: boolean
          max_uses: number | null
          max_uses_per_user: number
          maximum_order_amount: number | null
          minimum_order_amount: number | null
          updated_at: string
          valid_from: string
        }
        Insert: {
          code: string
          created_at?: string
          currency?: string
          current_uses?: number
          description?: string | null
          discount_amount?: number | null
          discount_percentage?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          max_uses_per_user?: number
          maximum_order_amount?: number | null
          minimum_order_amount?: number | null
          updated_at?: string
          valid_from?: string
        }
        Update: {
          code?: string
          created_at?: string
          currency?: string
          current_uses?: number
          description?: string | null
          discount_amount?: number | null
          discount_percentage?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          max_uses_per_user?: number
          maximum_order_amount?: number | null
          minimum_order_amount?: number | null
          updated_at?: string
          valid_from?: string
        }
        Relationships: []
      }
      media: {
        Row: {
          application_id: string | null
          booking_note_id: string | null
          chat_message_id: string | null
          created_at: string
          file_path: string
          id: string
          is_preview_image: boolean
          media_type: Database["public"]["Enums"]["media_type"]
          owner_id: string | null
          review_id: string | null
          service_id: string | null
        }
        Insert: {
          application_id?: string | null
          booking_note_id?: string | null
          chat_message_id?: string | null
          created_at?: string
          file_path: string
          id?: string
          is_preview_image?: boolean
          media_type: Database["public"]["Enums"]["media_type"]
          owner_id?: string | null
          review_id?: string | null
          service_id?: string | null
        }
        Update: {
          application_id?: string | null
          booking_note_id?: string | null
          chat_message_id?: string | null
          created_at?: string
          file_path?: string
          id?: string
          is_preview_image?: boolean
          media_type?: Database["public"]["Enums"]["media_type"]
          owner_id?: string | null
          review_id?: string | null
          service_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "media_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_booking_note_id_fkey"
            columns: ["booking_note_id"]
            isOneToOne: false
            referencedRelation: "booking_notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_chat_message_id_fkey"
            columns: ["chat_message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          affiliate_commission: number
          affiliate_commission_percentage: number | null
          affiliate_id: string | null
          authorized_at: string | null
          booking_id: string
          captured_at: string | null
          created_at: string
          currency: string
          discount_amount: number
          discount_code: string | null
          discount_fixed_amount: number | null
          discount_percentage: number | null
          final_amount: number
          id: string
          original_amount: number
          payment_intent_id: string
          payout_completed_at: string | null
          payout_initiated_at: string | null
          platform_fee: number
          refund_reason: string | null
          refunded_amount: number
          status: Database["public"]["Enums"]["payment_status"]
          stripe_application_fee_amount: number
          stylist_payout: number
          stylist_transfer_id: string | null
          succeeded_at: string | null
          updated_at: string
        }
        Insert: {
          affiliate_commission?: number
          affiliate_commission_percentage?: number | null
          affiliate_id?: string | null
          authorized_at?: string | null
          booking_id: string
          captured_at?: string | null
          created_at?: string
          currency?: string
          discount_amount?: number
          discount_code?: string | null
          discount_fixed_amount?: number | null
          discount_percentage?: number | null
          final_amount: number
          id?: string
          original_amount: number
          payment_intent_id: string
          payout_completed_at?: string | null
          payout_initiated_at?: string | null
          platform_fee: number
          refund_reason?: string | null
          refunded_amount?: number
          status?: Database["public"]["Enums"]["payment_status"]
          stripe_application_fee_amount: number
          stylist_payout: number
          stylist_transfer_id?: string | null
          succeeded_at?: string | null
          updated_at?: string
        }
        Update: {
          affiliate_commission?: number
          affiliate_commission_percentage?: number | null
          affiliate_id?: string | null
          authorized_at?: string | null
          booking_id?: string
          captured_at?: string | null
          created_at?: string
          currency?: string
          discount_amount?: number
          discount_code?: string | null
          discount_fixed_amount?: number | null
          discount_percentage?: number | null
          final_amount?: number
          id?: string
          original_amount?: number
          payment_intent_id?: string
          payout_completed_at?: string | null
          payout_initiated_at?: string | null
          platform_fee?: number
          refund_reason?: string | null
          refunded_amount?: number
          status?: Database["public"]["Enums"]["payment_status"]
          stripe_application_fee_amount?: number
          stylist_payout?: number
          stylist_transfer_id?: string | null
          succeeded_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_config: {
        Row: {
          config_key: string
          config_value: Json
          created_at: string
          created_by: string
          description: string | null
          environment: string
          id: string
          is_active: boolean
          updated_at: string
        }
        Insert: {
          config_key: string
          config_value: Json
          created_at?: string
          created_by: string
          description?: string | null
          environment?: string
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Update: {
          config_key?: string
          config_value?: Json
          created_at?: string
          created_by?: string
          description?: string | null
          environment?: string
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_config_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          bankid_verified: boolean
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone_number: string | null
          role: Database["public"]["Enums"]["user_role"]
          stripe_customer_id: string | null
          updated_at: string
        }
        Insert: {
          bankid_verified?: boolean
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone_number?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          stripe_customer_id?: string | null
          updated_at?: string
        }
        Update: {
          bankid_verified?: boolean
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone_number?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          stripe_customer_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      recurring_unavailability_exceptions: {
        Row: {
          id: string
          new_end_time: string | null
          new_start_time: string | null
          original_start_time: string
          series_id: string
        }
        Insert: {
          id?: string
          new_end_time?: string | null
          new_start_time?: string | null
          original_start_time: string
          series_id: string
        }
        Update: {
          id?: string
          new_end_time?: string | null
          new_start_time?: string | null
          original_start_time?: string
          series_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_unavailability_exceptions_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "stylist_recurring_unavailability"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          booking_id: string
          comment: string | null
          created_at: string
          customer_id: string
          id: string
          rating: number
          stylist_id: string
        }
        Insert: {
          booking_id: string
          comment?: string | null
          created_at?: string
          customer_id: string
          id?: string
          rating: number
          stylist_id: string
        }
        Update: {
          booking_id?: string
          comment?: string | null
          created_at?: string
          customer_id?: string
          id?: string
          rating?: number
          stylist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_stylist_id_fkey"
            columns: ["stylist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      service_categories: {
        Row: {
          description: string | null
          id: string
          name: string
          parent_category_id: string | null
        }
        Insert: {
          description?: string | null
          id?: string
          name: string
          parent_category_id?: string | null
        }
        Update: {
          description?: string | null
          id?: string
          name?: string
          parent_category_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_categories_parent_category_id_fkey"
            columns: ["parent_category_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      service_service_categories: {
        Row: {
          category_id: string
          service_id: string
        }
        Insert: {
          category_id: string
          service_id: string
        }
        Update: {
          category_id?: string
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_service_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_service_categories_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          at_customer_place: boolean
          at_stylist_place: boolean
          created_at: string
          currency: string
          description: string | null
          duration_minutes: number
          has_trial_session: boolean
          id: string
          includes: string[] | null
          is_published: boolean
          price: number
          requirements: string[] | null
          stylist_id: string
          title: string
          trial_session_description: string | null
          trial_session_duration_minutes: number | null
          trial_session_price: number | null
          updated_at: string
        }
        Insert: {
          at_customer_place?: boolean
          at_stylist_place?: boolean
          created_at?: string
          currency?: string
          description?: string | null
          duration_minutes: number
          has_trial_session?: boolean
          id?: string
          includes?: string[] | null
          is_published?: boolean
          price: number
          requirements?: string[] | null
          stylist_id: string
          title: string
          trial_session_description?: string | null
          trial_session_duration_minutes?: number | null
          trial_session_price?: number | null
          updated_at?: string
        }
        Update: {
          at_customer_place?: boolean
          at_stylist_place?: boolean
          created_at?: string
          currency?: string
          description?: string | null
          duration_minutes?: number
          has_trial_session?: boolean
          id?: string
          includes?: string[] | null
          is_published?: boolean
          price?: number
          requirements?: string[] | null
          stylist_id?: string
          title?: string
          trial_session_description?: string | null
          trial_session_duration_minutes?: number | null
          trial_session_price?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_stylist_id_fkey"
            columns: ["stylist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      stylist_availability_rules: {
        Row: {
          day_of_week: Database["public"]["Enums"]["day_of_week"]
          end_time: string
          id: string
          start_time: string
          stylist_id: string
        }
        Insert: {
          day_of_week: Database["public"]["Enums"]["day_of_week"]
          end_time: string
          id?: string
          start_time: string
          stylist_id: string
        }
        Update: {
          day_of_week?: Database["public"]["Enums"]["day_of_week"]
          end_time?: string
          id?: string
          start_time?: string
          stylist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stylist_availability_rules_stylist_id_fkey"
            columns: ["stylist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      stylist_details: {
        Row: {
          bio: string | null
          can_travel: boolean
          created_at: string
          facebook_profile: string | null
          has_own_place: boolean
          identity_verification_completed_at: string | null
          instagram_profile: string | null
          other_social_media_urls: string[] | null
          profile_id: string
          snapchat_profile: string | null
          stripe_account_id: string | null
          stripe_verification_session_id: string | null
          tiktok_profile: string | null
          travel_distance_km: number | null
          updated_at: string
          youtube_profile: string | null
        }
        Insert: {
          bio?: string | null
          can_travel?: boolean
          created_at?: string
          facebook_profile?: string | null
          has_own_place?: boolean
          identity_verification_completed_at?: string | null
          instagram_profile?: string | null
          other_social_media_urls?: string[] | null
          profile_id: string
          snapchat_profile?: string | null
          stripe_account_id?: string | null
          stripe_verification_session_id?: string | null
          tiktok_profile?: string | null
          travel_distance_km?: number | null
          updated_at?: string
          youtube_profile?: string | null
        }
        Update: {
          bio?: string | null
          can_travel?: boolean
          created_at?: string
          facebook_profile?: string | null
          has_own_place?: boolean
          identity_verification_completed_at?: string | null
          instagram_profile?: string | null
          other_social_media_urls?: string[] | null
          profile_id?: string
          snapchat_profile?: string | null
          stripe_account_id?: string | null
          stripe_verification_session_id?: string | null
          tiktok_profile?: string | null
          travel_distance_km?: number | null
          updated_at?: string
          youtube_profile?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stylist_details_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      stylist_recurring_unavailability: {
        Row: {
          end_time: string
          id: string
          rrule: string
          series_end_date: string | null
          series_start_date: string
          start_time: string
          stylist_id: string
          title: string | null
        }
        Insert: {
          end_time: string
          id?: string
          rrule: string
          series_end_date?: string | null
          series_start_date: string
          start_time: string
          stylist_id: string
          title?: string | null
        }
        Update: {
          end_time?: string
          id?: string
          rrule?: string
          series_end_date?: string | null
          series_start_date?: string
          start_time?: string
          stylist_id?: string
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stylist_recurring_unavailability_stylist_id_fkey"
            columns: ["stylist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      stylist_unavailability: {
        Row: {
          end_time: string
          id: string
          reason: string | null
          start_time: string
          stylist_id: string
        }
        Insert: {
          end_time: string
          id?: string
          reason?: string | null
          start_time: string
          stylist_id: string
        }
        Update: {
          end_time?: string
          id?: string
          reason?: string | null
          start_time?: string
          stylist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stylist_unavailability_stylist_id_fkey"
            columns: ["stylist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          application_status_updates: boolean
          booking_cancellations: boolean
          booking_confirmations: boolean
          booking_reminders: boolean
          booking_status_updates: boolean
          chat_messages: boolean
          created_at: string
          email_delivery: boolean
          id: string
          marketing_emails: boolean
          new_booking_requests: boolean
          newsletter_subscribed: boolean
          payment_notifications: boolean
          promotional_sms: boolean
          push_notifications: boolean
          review_notifications: boolean
          sms_delivery: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          application_status_updates?: boolean
          booking_cancellations?: boolean
          booking_confirmations?: boolean
          booking_reminders?: boolean
          booking_status_updates?: boolean
          chat_messages?: boolean
          created_at?: string
          email_delivery?: boolean
          id?: string
          marketing_emails?: boolean
          new_booking_requests?: boolean
          newsletter_subscribed?: boolean
          payment_notifications?: boolean
          promotional_sms?: boolean
          push_notifications?: boolean
          review_notifications?: boolean
          sms_delivery?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          application_status_updates?: boolean
          booking_cancellations?: boolean
          booking_confirmations?: boolean
          booking_reminders?: boolean
          booking_status_updates?: boolean
          chat_messages?: boolean
          created_at?: string
          email_delivery?: boolean
          id?: string
          marketing_emails?: boolean
          new_booking_requests?: boolean
          newsletter_subscribed?: boolean
          payment_notifications?: boolean
          promotional_sms?: boolean
          push_notifications?: boolean
          review_notifications?: boolean
          sms_delivery?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_admin_payments: {
        Args: {
          search_term?: string
          status_filter?: string
          limit_count?: number
          offset_count?: number
        }
        Returns: {
          id: string
          created_at: string
          updated_at: string
          booking_id: string
          payment_intent_id: string
          original_amount: number
          discount_amount: number
          final_amount: number
          platform_fee: number
          stylist_payout: number
          affiliate_commission: number
          currency: string
          discount_code: string
          status: Database["public"]["Enums"]["payment_status"]
          captured_at: string
          succeeded_at: string
          refunded_amount: number
          refund_reason: string
          customer_id: string
          customer_name: string
          customer_email: string
          stylist_id: string
          stylist_name: string
          stylist_email: string
          booking_date: string
        }[]
      }
      get_my_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["user_role"]
      }
      nearby_addresses: {
        Args: { lat: number; long: number; radius_km?: number }
        Returns: {
          id: string
          user_id: string
          nickname: string
          street_address: string
          city: string
          postal_code: string
          country: string
          entry_instructions: string
          is_primary: boolean
          lat: number
          long: number
          distance_meters: number
        }[]
      }
      nearby_services: {
        Args: {
          lat: number
          long: number
          radius_km?: number
          search_term?: string
          category_ids?: string[]
          min_price_ore?: number
          max_price_ore?: number
          at_customer_place?: boolean
          at_stylist_place?: boolean
          stylist_ids?: string[]
          sort_by?: string
        }
        Returns: {
          service_id: string
          service_title: string
          service_description: string
          service_price: number
          service_currency: string
          service_duration_minutes: number
          service_at_customer_place: boolean
          service_at_stylist_place: boolean
          service_is_published: boolean
          service_created_at: string
          service_has_trial_session: boolean
          service_trial_session_price: number
          service_trial_session_duration_minutes: number
          service_trial_session_description: string
          stylist_id: string
          stylist_full_name: string
          stylist_bio: string
          stylist_can_travel: boolean
          stylist_has_own_place: boolean
          address_id: string
          address_street_address: string
          address_city: string
          address_postal_code: string
          address_country: string
          address_lat: number
          address_lng: number
          distance_meters: number
          average_rating: number
          total_reviews: number
        }[]
      }
    }
    Enums: {
      affiliate_application_status:
        | "pending"
        | "approved"
        | "rejected"
        | "suspended"
      affiliate_payout_status: "pending" | "processing" | "paid" | "failed"
      application_status: "applied" | "pending_info" | "rejected" | "approved"
      booking_note_category:
        | "service_notes"
        | "customer_preferences"
        | "issues"
        | "results"
        | "follow_up"
        | "other"
      booking_status: "pending" | "confirmed" | "cancelled" | "completed"
      day_of_week:
        | "monday"
        | "tuesday"
        | "wednesday"
        | "thursday"
        | "friday"
        | "saturday"
        | "sunday"
      media_type:
        | "avatar"
        | "service_image"
        | "review_image"
        | "chat_image"
        | "application_image"
        | "landing_asset"
        | "logo_asset"
        | "booking_note_image"
        | "other"
      payment_status:
        | "pending"
        | "requires_payment_method"
        | "requires_confirmation"
        | "requires_action"
        | "processing"
        | "requires_capture"
        | "cancelled"
        | "succeeded"
      user_role: "customer" | "stylist" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  stripe: {
    Tables: {
      charges: {
        Row: {
          amount: number | null
          amount_refunded: number | null
          application: string | null
          application_fee: string | null
          balance_transaction: string | null
          captured: boolean | null
          created: number | null
          currency: string | null
          customer: string | null
          description: string | null
          destination: string | null
          dispute: string | null
          failure_code: string | null
          failure_message: string | null
          fraud_details: Json | null
          id: string
          invoice: string | null
          livemode: boolean | null
          metadata: Json | null
          object: string | null
          on_behalf_of: string | null
          order: string | null
          outcome: Json | null
          paid: boolean | null
          payment_intent: string | null
          payment_method_details: Json | null
          receipt_email: string | null
          receipt_number: string | null
          refunded: boolean | null
          refunds: Json | null
          review: string | null
          shipping: Json | null
          source: Json | null
          source_transfer: string | null
          statement_descriptor: string | null
          status: string | null
          transfer_group: string | null
          updated: number | null
          updated_at: string
        }
        Insert: {
          amount?: number | null
          amount_refunded?: number | null
          application?: string | null
          application_fee?: string | null
          balance_transaction?: string | null
          captured?: boolean | null
          created?: number | null
          currency?: string | null
          customer?: string | null
          description?: string | null
          destination?: string | null
          dispute?: string | null
          failure_code?: string | null
          failure_message?: string | null
          fraud_details?: Json | null
          id: string
          invoice?: string | null
          livemode?: boolean | null
          metadata?: Json | null
          object?: string | null
          on_behalf_of?: string | null
          order?: string | null
          outcome?: Json | null
          paid?: boolean | null
          payment_intent?: string | null
          payment_method_details?: Json | null
          receipt_email?: string | null
          receipt_number?: string | null
          refunded?: boolean | null
          refunds?: Json | null
          review?: string | null
          shipping?: Json | null
          source?: Json | null
          source_transfer?: string | null
          statement_descriptor?: string | null
          status?: string | null
          transfer_group?: string | null
          updated?: number | null
          updated_at?: string
        }
        Update: {
          amount?: number | null
          amount_refunded?: number | null
          application?: string | null
          application_fee?: string | null
          balance_transaction?: string | null
          captured?: boolean | null
          created?: number | null
          currency?: string | null
          customer?: string | null
          description?: string | null
          destination?: string | null
          dispute?: string | null
          failure_code?: string | null
          failure_message?: string | null
          fraud_details?: Json | null
          id?: string
          invoice?: string | null
          livemode?: boolean | null
          metadata?: Json | null
          object?: string | null
          on_behalf_of?: string | null
          order?: string | null
          outcome?: Json | null
          paid?: boolean | null
          payment_intent?: string | null
          payment_method_details?: Json | null
          receipt_email?: string | null
          receipt_number?: string | null
          refunded?: boolean | null
          refunds?: Json | null
          review?: string | null
          shipping?: Json | null
          source?: Json | null
          source_transfer?: string | null
          statement_descriptor?: string | null
          status?: string | null
          transfer_group?: string | null
          updated?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      coupons: {
        Row: {
          amount_off: number | null
          created: number | null
          currency: string | null
          duration: string | null
          duration_in_months: number | null
          id: string
          livemode: boolean | null
          max_redemptions: number | null
          metadata: Json | null
          name: string | null
          object: string | null
          percent_off: number | null
          percent_off_precise: number | null
          redeem_by: number | null
          times_redeemed: number | null
          updated: number | null
          updated_at: string
          valid: boolean | null
        }
        Insert: {
          amount_off?: number | null
          created?: number | null
          currency?: string | null
          duration?: string | null
          duration_in_months?: number | null
          id: string
          livemode?: boolean | null
          max_redemptions?: number | null
          metadata?: Json | null
          name?: string | null
          object?: string | null
          percent_off?: number | null
          percent_off_precise?: number | null
          redeem_by?: number | null
          times_redeemed?: number | null
          updated?: number | null
          updated_at?: string
          valid?: boolean | null
        }
        Update: {
          amount_off?: number | null
          created?: number | null
          currency?: string | null
          duration?: string | null
          duration_in_months?: number | null
          id?: string
          livemode?: boolean | null
          max_redemptions?: number | null
          metadata?: Json | null
          name?: string | null
          object?: string | null
          percent_off?: number | null
          percent_off_precise?: number | null
          redeem_by?: number | null
          times_redeemed?: number | null
          updated?: number | null
          updated_at?: string
          valid?: boolean | null
        }
        Relationships: []
      }
      credit_notes: {
        Row: {
          amount: number | null
          amount_shipping: number | null
          created: number | null
          currency: string | null
          customer: string | null
          customer_balance_transaction: string | null
          discount_amount: number | null
          discount_amounts: Json | null
          id: string
          invoice: string | null
          lines: Json | null
          livemode: boolean | null
          memo: string | null
          metadata: Json | null
          number: string | null
          object: string | null
          out_of_band_amount: number | null
          pdf: string | null
          reason: string | null
          refund: string | null
          shipping_cost: Json | null
          status: string | null
          subtotal: number | null
          subtotal_excluding_tax: number | null
          tax_amounts: Json | null
          total: number | null
          total_excluding_tax: number | null
          type: string | null
          voided_at: string | null
        }
        Insert: {
          amount?: number | null
          amount_shipping?: number | null
          created?: number | null
          currency?: string | null
          customer?: string | null
          customer_balance_transaction?: string | null
          discount_amount?: number | null
          discount_amounts?: Json | null
          id: string
          invoice?: string | null
          lines?: Json | null
          livemode?: boolean | null
          memo?: string | null
          metadata?: Json | null
          number?: string | null
          object?: string | null
          out_of_band_amount?: number | null
          pdf?: string | null
          reason?: string | null
          refund?: string | null
          shipping_cost?: Json | null
          status?: string | null
          subtotal?: number | null
          subtotal_excluding_tax?: number | null
          tax_amounts?: Json | null
          total?: number | null
          total_excluding_tax?: number | null
          type?: string | null
          voided_at?: string | null
        }
        Update: {
          amount?: number | null
          amount_shipping?: number | null
          created?: number | null
          currency?: string | null
          customer?: string | null
          customer_balance_transaction?: string | null
          discount_amount?: number | null
          discount_amounts?: Json | null
          id?: string
          invoice?: string | null
          lines?: Json | null
          livemode?: boolean | null
          memo?: string | null
          metadata?: Json | null
          number?: string | null
          object?: string | null
          out_of_band_amount?: number | null
          pdf?: string | null
          reason?: string | null
          refund?: string | null
          shipping_cost?: Json | null
          status?: string | null
          subtotal?: number | null
          subtotal_excluding_tax?: number | null
          tax_amounts?: Json | null
          total?: number | null
          total_excluding_tax?: number | null
          type?: string | null
          voided_at?: string | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: Json | null
          balance: number | null
          created: number | null
          currency: string | null
          default_source: string | null
          deleted: boolean
          delinquent: boolean | null
          description: string | null
          discount: Json | null
          email: string | null
          id: string
          invoice_prefix: string | null
          invoice_settings: Json | null
          livemode: boolean | null
          metadata: Json | null
          name: string | null
          next_invoice_sequence: number | null
          object: string | null
          phone: string | null
          preferred_locales: Json | null
          shipping: Json | null
          tax_exempt: string | null
          updated_at: string
        }
        Insert: {
          address?: Json | null
          balance?: number | null
          created?: number | null
          currency?: string | null
          default_source?: string | null
          deleted?: boolean
          delinquent?: boolean | null
          description?: string | null
          discount?: Json | null
          email?: string | null
          id: string
          invoice_prefix?: string | null
          invoice_settings?: Json | null
          livemode?: boolean | null
          metadata?: Json | null
          name?: string | null
          next_invoice_sequence?: number | null
          object?: string | null
          phone?: string | null
          preferred_locales?: Json | null
          shipping?: Json | null
          tax_exempt?: string | null
          updated_at?: string
        }
        Update: {
          address?: Json | null
          balance?: number | null
          created?: number | null
          currency?: string | null
          default_source?: string | null
          deleted?: boolean
          delinquent?: boolean | null
          description?: string | null
          discount?: Json | null
          email?: string | null
          id?: string
          invoice_prefix?: string | null
          invoice_settings?: Json | null
          livemode?: boolean | null
          metadata?: Json | null
          name?: string | null
          next_invoice_sequence?: number | null
          object?: string | null
          phone?: string | null
          preferred_locales?: Json | null
          shipping?: Json | null
          tax_exempt?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      disputes: {
        Row: {
          amount: number | null
          balance_transactions: Json | null
          charge: string | null
          created: number | null
          currency: string | null
          evidence: Json | null
          evidence_details: Json | null
          id: string
          is_charge_refundable: boolean | null
          livemode: boolean | null
          metadata: Json | null
          object: string | null
          payment_intent: string | null
          reason: string | null
          status: string | null
          updated: number | null
          updated_at: string
        }
        Insert: {
          amount?: number | null
          balance_transactions?: Json | null
          charge?: string | null
          created?: number | null
          currency?: string | null
          evidence?: Json | null
          evidence_details?: Json | null
          id: string
          is_charge_refundable?: boolean | null
          livemode?: boolean | null
          metadata?: Json | null
          object?: string | null
          payment_intent?: string | null
          reason?: string | null
          status?: string | null
          updated?: number | null
          updated_at?: string
        }
        Update: {
          amount?: number | null
          balance_transactions?: Json | null
          charge?: string | null
          created?: number | null
          currency?: string | null
          evidence?: Json | null
          evidence_details?: Json | null
          id?: string
          is_charge_refundable?: boolean | null
          livemode?: boolean | null
          metadata?: Json | null
          object?: string | null
          payment_intent?: string | null
          reason?: string | null
          status?: string | null
          updated?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      early_fraud_warnings: {
        Row: {
          actionable: boolean | null
          charge: string | null
          created: number | null
          fraud_type: string | null
          id: string
          livemode: boolean | null
          object: string | null
          payment_intent: string | null
          updated_at: string
        }
        Insert: {
          actionable?: boolean | null
          charge?: string | null
          created?: number | null
          fraud_type?: string | null
          id: string
          livemode?: boolean | null
          object?: string | null
          payment_intent?: string | null
          updated_at?: string
        }
        Update: {
          actionable?: boolean | null
          charge?: string | null
          created?: number | null
          fraud_type?: string | null
          id?: string
          livemode?: boolean | null
          object?: string | null
          payment_intent?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          api_version: string | null
          created: number | null
          data: Json | null
          id: string
          livemode: boolean | null
          object: string | null
          pending_webhooks: number | null
          request: string | null
          type: string | null
          updated: number | null
          updated_at: string
        }
        Insert: {
          api_version?: string | null
          created?: number | null
          data?: Json | null
          id: string
          livemode?: boolean | null
          object?: string | null
          pending_webhooks?: number | null
          request?: string | null
          type?: string | null
          updated?: number | null
          updated_at?: string
        }
        Update: {
          api_version?: string | null
          created?: number | null
          data?: Json | null
          id?: string
          livemode?: boolean | null
          object?: string | null
          pending_webhooks?: number | null
          request?: string | null
          type?: string | null
          updated?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          account_country: string | null
          account_name: string | null
          account_tax_ids: Json | null
          amount_due: number | null
          amount_paid: number | null
          amount_remaining: number | null
          application_fee_amount: number | null
          attempt_count: number | null
          attempted: boolean | null
          auto_advance: boolean | null
          billing_reason: string | null
          charge: string | null
          collection_method: string | null
          created: number | null
          currency: string | null
          custom_fields: Json | null
          customer: string | null
          customer_address: Json | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          customer_shipping: Json | null
          customer_tax_exempt: string | null
          customer_tax_ids: Json | null
          default_payment_method: string | null
          default_source: string | null
          default_tax_rates: Json | null
          description: string | null
          discount: Json | null
          discounts: Json | null
          due_date: number | null
          ending_balance: number | null
          footer: string | null
          hosted_invoice_url: string | null
          id: string
          invoice_pdf: string | null
          last_finalization_error: Json | null
          lines: Json | null
          livemode: boolean | null
          metadata: Json | null
          next_payment_attempt: number | null
          number: string | null
          object: string | null
          on_behalf_of: string | null
          paid: boolean | null
          payment_intent: string | null
          payment_settings: Json | null
          period_end: number | null
          period_start: number | null
          post_payment_credit_notes_amount: number | null
          pre_payment_credit_notes_amount: number | null
          receipt_number: string | null
          starting_balance: number | null
          statement_descriptor: string | null
          status: Database["stripe"]["Enums"]["invoice_status"] | null
          status_transitions: Json | null
          subscription: string | null
          subtotal: number | null
          tax: number | null
          total: number | null
          total_discount_amounts: Json | null
          total_tax_amounts: Json | null
          transfer_data: Json | null
          updated_at: string
          webhooks_delivered_at: number | null
        }
        Insert: {
          account_country?: string | null
          account_name?: string | null
          account_tax_ids?: Json | null
          amount_due?: number | null
          amount_paid?: number | null
          amount_remaining?: number | null
          application_fee_amount?: number | null
          attempt_count?: number | null
          attempted?: boolean | null
          auto_advance?: boolean | null
          billing_reason?: string | null
          charge?: string | null
          collection_method?: string | null
          created?: number | null
          currency?: string | null
          custom_fields?: Json | null
          customer?: string | null
          customer_address?: Json | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_shipping?: Json | null
          customer_tax_exempt?: string | null
          customer_tax_ids?: Json | null
          default_payment_method?: string | null
          default_source?: string | null
          default_tax_rates?: Json | null
          description?: string | null
          discount?: Json | null
          discounts?: Json | null
          due_date?: number | null
          ending_balance?: number | null
          footer?: string | null
          hosted_invoice_url?: string | null
          id: string
          invoice_pdf?: string | null
          last_finalization_error?: Json | null
          lines?: Json | null
          livemode?: boolean | null
          metadata?: Json | null
          next_payment_attempt?: number | null
          number?: string | null
          object?: string | null
          on_behalf_of?: string | null
          paid?: boolean | null
          payment_intent?: string | null
          payment_settings?: Json | null
          period_end?: number | null
          period_start?: number | null
          post_payment_credit_notes_amount?: number | null
          pre_payment_credit_notes_amount?: number | null
          receipt_number?: string | null
          starting_balance?: number | null
          statement_descriptor?: string | null
          status?: Database["stripe"]["Enums"]["invoice_status"] | null
          status_transitions?: Json | null
          subscription?: string | null
          subtotal?: number | null
          tax?: number | null
          total?: number | null
          total_discount_amounts?: Json | null
          total_tax_amounts?: Json | null
          transfer_data?: Json | null
          updated_at?: string
          webhooks_delivered_at?: number | null
        }
        Update: {
          account_country?: string | null
          account_name?: string | null
          account_tax_ids?: Json | null
          amount_due?: number | null
          amount_paid?: number | null
          amount_remaining?: number | null
          application_fee_amount?: number | null
          attempt_count?: number | null
          attempted?: boolean | null
          auto_advance?: boolean | null
          billing_reason?: string | null
          charge?: string | null
          collection_method?: string | null
          created?: number | null
          currency?: string | null
          custom_fields?: Json | null
          customer?: string | null
          customer_address?: Json | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_shipping?: Json | null
          customer_tax_exempt?: string | null
          customer_tax_ids?: Json | null
          default_payment_method?: string | null
          default_source?: string | null
          default_tax_rates?: Json | null
          description?: string | null
          discount?: Json | null
          discounts?: Json | null
          due_date?: number | null
          ending_balance?: number | null
          footer?: string | null
          hosted_invoice_url?: string | null
          id?: string
          invoice_pdf?: string | null
          last_finalization_error?: Json | null
          lines?: Json | null
          livemode?: boolean | null
          metadata?: Json | null
          next_payment_attempt?: number | null
          number?: string | null
          object?: string | null
          on_behalf_of?: string | null
          paid?: boolean | null
          payment_intent?: string | null
          payment_settings?: Json | null
          period_end?: number | null
          period_start?: number | null
          post_payment_credit_notes_amount?: number | null
          pre_payment_credit_notes_amount?: number | null
          receipt_number?: string | null
          starting_balance?: number | null
          statement_descriptor?: string | null
          status?: Database["stripe"]["Enums"]["invoice_status"] | null
          status_transitions?: Json | null
          subscription?: string | null
          subtotal?: number | null
          tax?: number | null
          total?: number | null
          total_discount_amounts?: Json | null
          total_tax_amounts?: Json | null
          transfer_data?: Json | null
          updated_at?: string
          webhooks_delivered_at?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_customer_fkey"
            columns: ["customer"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_subscription_fkey"
            columns: ["subscription"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      migrations: {
        Row: {
          executed_at: string | null
          hash: string
          id: number
          name: string
        }
        Insert: {
          executed_at?: string | null
          hash: string
          id: number
          name: string
        }
        Update: {
          executed_at?: string | null
          hash?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      payment_intents: {
        Row: {
          amount: number | null
          amount_capturable: number | null
          amount_details: Json | null
          amount_received: number | null
          application: string | null
          application_fee_amount: number | null
          automatic_payment_methods: string | null
          canceled_at: number | null
          cancellation_reason: string | null
          capture_method: string | null
          client_secret: string | null
          confirmation_method: string | null
          created: number | null
          currency: string | null
          customer: string | null
          description: string | null
          id: string
          invoice: string | null
          last_payment_error: string | null
          livemode: boolean | null
          metadata: Json | null
          next_action: string | null
          object: string | null
          on_behalf_of: string | null
          payment_method: string | null
          payment_method_options: Json | null
          payment_method_types: Json | null
          processing: string | null
          receipt_email: string | null
          review: string | null
          setup_future_usage: string | null
          shipping: Json | null
          statement_descriptor: string | null
          statement_descriptor_suffix: string | null
          status: string | null
          transfer_data: Json | null
          transfer_group: string | null
        }
        Insert: {
          amount?: number | null
          amount_capturable?: number | null
          amount_details?: Json | null
          amount_received?: number | null
          application?: string | null
          application_fee_amount?: number | null
          automatic_payment_methods?: string | null
          canceled_at?: number | null
          cancellation_reason?: string | null
          capture_method?: string | null
          client_secret?: string | null
          confirmation_method?: string | null
          created?: number | null
          currency?: string | null
          customer?: string | null
          description?: string | null
          id: string
          invoice?: string | null
          last_payment_error?: string | null
          livemode?: boolean | null
          metadata?: Json | null
          next_action?: string | null
          object?: string | null
          on_behalf_of?: string | null
          payment_method?: string | null
          payment_method_options?: Json | null
          payment_method_types?: Json | null
          processing?: string | null
          receipt_email?: string | null
          review?: string | null
          setup_future_usage?: string | null
          shipping?: Json | null
          statement_descriptor?: string | null
          statement_descriptor_suffix?: string | null
          status?: string | null
          transfer_data?: Json | null
          transfer_group?: string | null
        }
        Update: {
          amount?: number | null
          amount_capturable?: number | null
          amount_details?: Json | null
          amount_received?: number | null
          application?: string | null
          application_fee_amount?: number | null
          automatic_payment_methods?: string | null
          canceled_at?: number | null
          cancellation_reason?: string | null
          capture_method?: string | null
          client_secret?: string | null
          confirmation_method?: string | null
          created?: number | null
          currency?: string | null
          customer?: string | null
          description?: string | null
          id?: string
          invoice?: string | null
          last_payment_error?: string | null
          livemode?: boolean | null
          metadata?: Json | null
          next_action?: string | null
          object?: string | null
          on_behalf_of?: string | null
          payment_method?: string | null
          payment_method_options?: Json | null
          payment_method_types?: Json | null
          processing?: string | null
          receipt_email?: string | null
          review?: string | null
          setup_future_usage?: string | null
          shipping?: Json | null
          statement_descriptor?: string | null
          statement_descriptor_suffix?: string | null
          status?: string | null
          transfer_data?: Json | null
          transfer_group?: string | null
        }
        Relationships: []
      }
      payment_methods: {
        Row: {
          billing_details: Json | null
          card: Json | null
          created: number | null
          customer: string | null
          id: string
          metadata: Json | null
          object: string | null
          type: string | null
        }
        Insert: {
          billing_details?: Json | null
          card?: Json | null
          created?: number | null
          customer?: string | null
          id: string
          metadata?: Json | null
          object?: string | null
          type?: string | null
        }
        Update: {
          billing_details?: Json | null
          card?: Json | null
          created?: number | null
          customer?: string | null
          id?: string
          metadata?: Json | null
          object?: string | null
          type?: string | null
        }
        Relationships: []
      }
      payouts: {
        Row: {
          amount: number | null
          amount_reversed: number | null
          arrival_date: string | null
          automatic: boolean | null
          balance_transaction: string | null
          bank_account: Json | null
          created: number | null
          currency: string | null
          date: string | null
          description: string | null
          destination: string | null
          failure_balance_transaction: string | null
          failure_code: string | null
          failure_message: string | null
          id: string
          livemode: boolean | null
          metadata: Json | null
          method: string | null
          object: string | null
          recipient: string | null
          source_transaction: string | null
          source_type: string | null
          statement_description: string | null
          statement_descriptor: string | null
          status: string | null
          transfer_group: string | null
          type: string | null
          updated: number | null
          updated_at: string
        }
        Insert: {
          amount?: number | null
          amount_reversed?: number | null
          arrival_date?: string | null
          automatic?: boolean | null
          balance_transaction?: string | null
          bank_account?: Json | null
          created?: number | null
          currency?: string | null
          date?: string | null
          description?: string | null
          destination?: string | null
          failure_balance_transaction?: string | null
          failure_code?: string | null
          failure_message?: string | null
          id: string
          livemode?: boolean | null
          metadata?: Json | null
          method?: string | null
          object?: string | null
          recipient?: string | null
          source_transaction?: string | null
          source_type?: string | null
          statement_description?: string | null
          statement_descriptor?: string | null
          status?: string | null
          transfer_group?: string | null
          type?: string | null
          updated?: number | null
          updated_at?: string
        }
        Update: {
          amount?: number | null
          amount_reversed?: number | null
          arrival_date?: string | null
          automatic?: boolean | null
          balance_transaction?: string | null
          bank_account?: Json | null
          created?: number | null
          currency?: string | null
          date?: string | null
          description?: string | null
          destination?: string | null
          failure_balance_transaction?: string | null
          failure_code?: string | null
          failure_message?: string | null
          id?: string
          livemode?: boolean | null
          metadata?: Json | null
          method?: string | null
          object?: string | null
          recipient?: string | null
          source_transaction?: string | null
          source_type?: string | null
          statement_description?: string | null
          statement_descriptor?: string | null
          status?: string | null
          transfer_group?: string | null
          type?: string | null
          updated?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      plans: {
        Row: {
          active: boolean | null
          aggregate_usage: string | null
          amount: number | null
          billing_scheme: string | null
          created: number | null
          currency: string | null
          id: string
          interval: string | null
          interval_count: number | null
          livemode: boolean | null
          metadata: Json | null
          nickname: string | null
          object: string | null
          product: string | null
          tiers_mode: string | null
          transform_usage: string | null
          trial_period_days: number | null
          updated_at: string
          usage_type: string | null
        }
        Insert: {
          active?: boolean | null
          aggregate_usage?: string | null
          amount?: number | null
          billing_scheme?: string | null
          created?: number | null
          currency?: string | null
          id: string
          interval?: string | null
          interval_count?: number | null
          livemode?: boolean | null
          metadata?: Json | null
          nickname?: string | null
          object?: string | null
          product?: string | null
          tiers_mode?: string | null
          transform_usage?: string | null
          trial_period_days?: number | null
          updated_at?: string
          usage_type?: string | null
        }
        Update: {
          active?: boolean | null
          aggregate_usage?: string | null
          amount?: number | null
          billing_scheme?: string | null
          created?: number | null
          currency?: string | null
          id?: string
          interval?: string | null
          interval_count?: number | null
          livemode?: boolean | null
          metadata?: Json | null
          nickname?: string | null
          object?: string | null
          product?: string | null
          tiers_mode?: string | null
          transform_usage?: string | null
          trial_period_days?: number | null
          updated_at?: string
          usage_type?: string | null
        }
        Relationships: []
      }
      prices: {
        Row: {
          active: boolean | null
          billing_scheme: string | null
          created: number | null
          currency: string | null
          id: string
          livemode: boolean | null
          lookup_key: string | null
          metadata: Json | null
          nickname: string | null
          object: string | null
          product: string | null
          recurring: Json | null
          tiers_mode: Database["stripe"]["Enums"]["pricing_tiers"] | null
          transform_quantity: Json | null
          type: Database["stripe"]["Enums"]["pricing_type"] | null
          unit_amount: number | null
          unit_amount_decimal: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          billing_scheme?: string | null
          created?: number | null
          currency?: string | null
          id: string
          livemode?: boolean | null
          lookup_key?: string | null
          metadata?: Json | null
          nickname?: string | null
          object?: string | null
          product?: string | null
          recurring?: Json | null
          tiers_mode?: Database["stripe"]["Enums"]["pricing_tiers"] | null
          transform_quantity?: Json | null
          type?: Database["stripe"]["Enums"]["pricing_type"] | null
          unit_amount?: number | null
          unit_amount_decimal?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          billing_scheme?: string | null
          created?: number | null
          currency?: string | null
          id?: string
          livemode?: boolean | null
          lookup_key?: string | null
          metadata?: Json | null
          nickname?: string | null
          object?: string | null
          product?: string | null
          recurring?: Json | null
          tiers_mode?: Database["stripe"]["Enums"]["pricing_tiers"] | null
          transform_quantity?: Json | null
          type?: Database["stripe"]["Enums"]["pricing_type"] | null
          unit_amount?: number | null
          unit_amount_decimal?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "prices_product_fkey"
            columns: ["product"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean | null
          created: number | null
          default_price: string | null
          description: string | null
          id: string
          images: Json | null
          livemode: boolean | null
          marketing_features: Json | null
          metadata: Json | null
          name: string | null
          object: string | null
          package_dimensions: Json | null
          shippable: boolean | null
          statement_descriptor: string | null
          unit_label: string | null
          updated: number | null
          updated_at: string
          url: string | null
        }
        Insert: {
          active?: boolean | null
          created?: number | null
          default_price?: string | null
          description?: string | null
          id: string
          images?: Json | null
          livemode?: boolean | null
          marketing_features?: Json | null
          metadata?: Json | null
          name?: string | null
          object?: string | null
          package_dimensions?: Json | null
          shippable?: boolean | null
          statement_descriptor?: string | null
          unit_label?: string | null
          updated?: number | null
          updated_at?: string
          url?: string | null
        }
        Update: {
          active?: boolean | null
          created?: number | null
          default_price?: string | null
          description?: string | null
          id?: string
          images?: Json | null
          livemode?: boolean | null
          marketing_features?: Json | null
          metadata?: Json | null
          name?: string | null
          object?: string | null
          package_dimensions?: Json | null
          shippable?: boolean | null
          statement_descriptor?: string | null
          unit_label?: string | null
          updated?: number | null
          updated_at?: string
          url?: string | null
        }
        Relationships: []
      }
      refunds: {
        Row: {
          amount: number | null
          balance_transaction: string | null
          charge: string | null
          created: number | null
          currency: string | null
          destination_details: Json | null
          id: string
          metadata: Json | null
          object: string | null
          payment_intent: string | null
          reason: string | null
          receipt_number: string | null
          source_transfer_reversal: string | null
          status: string | null
          transfer_reversal: string | null
          updated_at: string
        }
        Insert: {
          amount?: number | null
          balance_transaction?: string | null
          charge?: string | null
          created?: number | null
          currency?: string | null
          destination_details?: Json | null
          id: string
          metadata?: Json | null
          object?: string | null
          payment_intent?: string | null
          reason?: string | null
          receipt_number?: string | null
          source_transfer_reversal?: string | null
          status?: string | null
          transfer_reversal?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number | null
          balance_transaction?: string | null
          charge?: string | null
          created?: number | null
          currency?: string | null
          destination_details?: Json | null
          id?: string
          metadata?: Json | null
          object?: string | null
          payment_intent?: string | null
          reason?: string | null
          receipt_number?: string | null
          source_transfer_reversal?: string | null
          status?: string | null
          transfer_reversal?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          billing_zip: string | null
          charge: string | null
          closed_reason: string | null
          created: number | null
          id: string
          ip_address: string | null
          ip_address_location: Json | null
          livemode: boolean | null
          object: string | null
          open: boolean | null
          opened_reason: string | null
          payment_intent: string | null
          reason: string | null
          session: string | null
          updated_at: string
        }
        Insert: {
          billing_zip?: string | null
          charge?: string | null
          closed_reason?: string | null
          created?: number | null
          id: string
          ip_address?: string | null
          ip_address_location?: Json | null
          livemode?: boolean | null
          object?: string | null
          open?: boolean | null
          opened_reason?: string | null
          payment_intent?: string | null
          reason?: string | null
          session?: string | null
          updated_at?: string
        }
        Update: {
          billing_zip?: string | null
          charge?: string | null
          closed_reason?: string | null
          created?: number | null
          id?: string
          ip_address?: string | null
          ip_address_location?: Json | null
          livemode?: boolean | null
          object?: string | null
          open?: boolean | null
          opened_reason?: string | null
          payment_intent?: string | null
          reason?: string | null
          session?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      setup_intents: {
        Row: {
          cancellation_reason: string | null
          created: number | null
          customer: string | null
          description: string | null
          id: string
          latest_attempt: string | null
          mandate: string | null
          object: string | null
          on_behalf_of: string | null
          payment_method: string | null
          single_use_mandate: string | null
          status: string | null
          usage: string | null
        }
        Insert: {
          cancellation_reason?: string | null
          created?: number | null
          customer?: string | null
          description?: string | null
          id: string
          latest_attempt?: string | null
          mandate?: string | null
          object?: string | null
          on_behalf_of?: string | null
          payment_method?: string | null
          single_use_mandate?: string | null
          status?: string | null
          usage?: string | null
        }
        Update: {
          cancellation_reason?: string | null
          created?: number | null
          customer?: string | null
          description?: string | null
          id?: string
          latest_attempt?: string | null
          mandate?: string | null
          object?: string | null
          on_behalf_of?: string | null
          payment_method?: string | null
          single_use_mandate?: string | null
          status?: string | null
          usage?: string | null
        }
        Relationships: []
      }
      subscription_items: {
        Row: {
          billing_thresholds: Json | null
          created: number | null
          deleted: boolean | null
          id: string
          metadata: Json | null
          object: string | null
          price: string | null
          quantity: number | null
          subscription: string | null
          tax_rates: Json | null
        }
        Insert: {
          billing_thresholds?: Json | null
          created?: number | null
          deleted?: boolean | null
          id: string
          metadata?: Json | null
          object?: string | null
          price?: string | null
          quantity?: number | null
          subscription?: string | null
          tax_rates?: Json | null
        }
        Update: {
          billing_thresholds?: Json | null
          created?: number | null
          deleted?: boolean | null
          id?: string
          metadata?: Json | null
          object?: string | null
          price?: string | null
          quantity?: number | null
          subscription?: string | null
          tax_rates?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "subscription_items_price_fkey"
            columns: ["price"]
            isOneToOne: false
            referencedRelation: "prices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_items_subscription_fkey"
            columns: ["subscription"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_schedules: {
        Row: {
          application: string | null
          canceled_at: number | null
          completed_at: number | null
          created: number
          current_phase: Json | null
          customer: string
          default_settings: Json | null
          end_behavior: string | null
          id: string
          livemode: boolean
          metadata: Json
          object: string | null
          phases: Json
          released_at: number | null
          released_subscription: string | null
          status: Database["stripe"]["Enums"]["subscription_schedule_status"]
          subscription: string | null
          test_clock: string | null
        }
        Insert: {
          application?: string | null
          canceled_at?: number | null
          completed_at?: number | null
          created: number
          current_phase?: Json | null
          customer: string
          default_settings?: Json | null
          end_behavior?: string | null
          id: string
          livemode: boolean
          metadata: Json
          object?: string | null
          phases: Json
          released_at?: number | null
          released_subscription?: string | null
          status: Database["stripe"]["Enums"]["subscription_schedule_status"]
          subscription?: string | null
          test_clock?: string | null
        }
        Update: {
          application?: string | null
          canceled_at?: number | null
          completed_at?: number | null
          created?: number
          current_phase?: Json | null
          customer?: string
          default_settings?: Json | null
          end_behavior?: string | null
          id?: string
          livemode?: boolean
          metadata?: Json
          object?: string | null
          phases?: Json
          released_at?: number | null
          released_subscription?: string | null
          status?: Database["stripe"]["Enums"]["subscription_schedule_status"]
          subscription?: string | null
          test_clock?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          application_fee_percent: number | null
          billing_cycle_anchor: number | null
          billing_thresholds: Json | null
          cancel_at: number | null
          cancel_at_period_end: boolean | null
          canceled_at: number | null
          collection_method: string | null
          created: number | null
          current_period_end: number | null
          current_period_start: number | null
          customer: string | null
          days_until_due: number | null
          default_payment_method: string | null
          default_source: string | null
          default_tax_rates: Json | null
          discount: Json | null
          ended_at: number | null
          id: string
          items: Json | null
          latest_invoice: string | null
          livemode: boolean | null
          metadata: Json | null
          next_pending_invoice_item_invoice: number | null
          object: string | null
          pause_collection: Json | null
          pending_invoice_item_interval: Json | null
          pending_setup_intent: string | null
          pending_update: Json | null
          plan: string | null
          schedule: string | null
          start_date: number | null
          status: Database["stripe"]["Enums"]["subscription_status"] | null
          transfer_data: Json | null
          trial_end: Json | null
          trial_start: Json | null
          updated_at: string
        }
        Insert: {
          application_fee_percent?: number | null
          billing_cycle_anchor?: number | null
          billing_thresholds?: Json | null
          cancel_at?: number | null
          cancel_at_period_end?: boolean | null
          canceled_at?: number | null
          collection_method?: string | null
          created?: number | null
          current_period_end?: number | null
          current_period_start?: number | null
          customer?: string | null
          days_until_due?: number | null
          default_payment_method?: string | null
          default_source?: string | null
          default_tax_rates?: Json | null
          discount?: Json | null
          ended_at?: number | null
          id: string
          items?: Json | null
          latest_invoice?: string | null
          livemode?: boolean | null
          metadata?: Json | null
          next_pending_invoice_item_invoice?: number | null
          object?: string | null
          pause_collection?: Json | null
          pending_invoice_item_interval?: Json | null
          pending_setup_intent?: string | null
          pending_update?: Json | null
          plan?: string | null
          schedule?: string | null
          start_date?: number | null
          status?: Database["stripe"]["Enums"]["subscription_status"] | null
          transfer_data?: Json | null
          trial_end?: Json | null
          trial_start?: Json | null
          updated_at?: string
        }
        Update: {
          application_fee_percent?: number | null
          billing_cycle_anchor?: number | null
          billing_thresholds?: Json | null
          cancel_at?: number | null
          cancel_at_period_end?: boolean | null
          canceled_at?: number | null
          collection_method?: string | null
          created?: number | null
          current_period_end?: number | null
          current_period_start?: number | null
          customer?: string | null
          days_until_due?: number | null
          default_payment_method?: string | null
          default_source?: string | null
          default_tax_rates?: Json | null
          discount?: Json | null
          ended_at?: number | null
          id?: string
          items?: Json | null
          latest_invoice?: string | null
          livemode?: boolean | null
          metadata?: Json | null
          next_pending_invoice_item_invoice?: number | null
          object?: string | null
          pause_collection?: Json | null
          pending_invoice_item_interval?: Json | null
          pending_setup_intent?: string | null
          pending_update?: Json | null
          plan?: string | null
          schedule?: string | null
          start_date?: number | null
          status?: Database["stripe"]["Enums"]["subscription_status"] | null
          transfer_data?: Json | null
          trial_end?: Json | null
          trial_start?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_customer_fkey"
            columns: ["customer"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_ids: {
        Row: {
          country: string | null
          created: number
          customer: string | null
          id: string
          livemode: boolean | null
          object: string | null
          owner: Json | null
          type: string | null
          value: string | null
        }
        Insert: {
          country?: string | null
          created: number
          customer?: string | null
          id: string
          livemode?: boolean | null
          object?: string | null
          owner?: Json | null
          type?: string | null
          value?: string | null
        }
        Update: {
          country?: string | null
          created?: number
          customer?: string | null
          id?: string
          livemode?: boolean | null
          object?: string | null
          owner?: Json | null
          type?: string | null
          value?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      invoice_status:
        | "draft"
        | "open"
        | "paid"
        | "uncollectible"
        | "void"
        | "deleted"
      pricing_tiers: "graduated" | "volume"
      pricing_type: "one_time" | "recurring"
      subscription_schedule_status:
        | "not_started"
        | "active"
        | "completed"
        | "released"
        | "canceled"
      subscription_status:
        | "trialing"
        | "active"
        | "canceled"
        | "incomplete"
        | "incomplete_expired"
        | "past_due"
        | "unpaid"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  gis: {
    Enums: {},
  },
  public: {
    Enums: {
      affiliate_application_status: [
        "pending",
        "approved",
        "rejected",
        "suspended",
      ],
      affiliate_payout_status: ["pending", "processing", "paid", "failed"],
      application_status: ["applied", "pending_info", "rejected", "approved"],
      booking_note_category: [
        "service_notes",
        "customer_preferences",
        "issues",
        "results",
        "follow_up",
        "other",
      ],
      booking_status: ["pending", "confirmed", "cancelled", "completed"],
      day_of_week: [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
      ],
      media_type: [
        "avatar",
        "service_image",
        "review_image",
        "chat_image",
        "application_image",
        "landing_asset",
        "logo_asset",
        "booking_note_image",
        "other",
      ],
      payment_status: [
        "pending",
        "requires_payment_method",
        "requires_confirmation",
        "requires_action",
        "processing",
        "requires_capture",
        "cancelled",
        "succeeded",
      ],
      user_role: ["customer", "stylist", "admin"],
    },
  },
  stripe: {
    Enums: {
      invoice_status: [
        "draft",
        "open",
        "paid",
        "uncollectible",
        "void",
        "deleted",
      ],
      pricing_tiers: ["graduated", "volume"],
      pricing_type: ["one_time", "recurring"],
      subscription_schedule_status: [
        "not_started",
        "active",
        "completed",
        "released",
        "canceled",
      ],
      subscription_status: [
        "trialing",
        "active",
        "canceled",
        "incomplete",
        "incomplete_expired",
        "past_due",
        "unpaid",
      ],
    },
  },
} as const

