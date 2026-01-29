declare module 'csv-parse' {
  import { Transform } from 'stream';

  export interface Options {
    columns?: boolean | string[];
    skip_empty_lines?: boolean;
    trim?: boolean;
    delimiter?: string | string[];
    relax_column_count?: boolean;
  }

  export function parse(options?: Options): Transform;
}
