declare module 'csv-parse/sync' {
  export interface Options {
    columns?: boolean | string[];
    skip_empty_lines?: boolean;
    trim?: boolean;
    delimiter?: string | string[];
    relax_column_count?: boolean;
  }

  export function parse(input: Buffer | string, options?: Options): any[];
}
