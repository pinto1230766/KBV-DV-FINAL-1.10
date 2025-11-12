// Global type declarations
interface Date {
  toLocaleDateString(locales?: string | string[], options?: Intl.DateTimeFormatOptions): string;
  toLocaleTimeString(locales?: string | string[], options?: Intl.DateTimeFormatOptions): string;
}

declare const process: {
  env: {
    NODE_ENV: 'development' | 'production' | 'test';
    [key: string]: string | undefined;
  };
};

declare module '*.svg' {
  import * as React from 'react';
  export const ReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
  const src: string;
  export default src;
}

declare module '*.png' {
  const value: string;
  export default value;
}

declare module '*.jpg' {
  const value: string;
  export default value;
}

// Add global type declarations for built-in objects
declare var Object: ObjectConstructor;
declare var Boolean: BooleanConstructor;
declare var Number: NumberConstructor;
declare var String: StringConstructor;
declare var Array: ArrayConstructor;
declare var Date: DateConstructor;
declare var RegExp: RegExpConstructor;
declare var Error: ErrorConstructor;
declare var Promise: PromiseConstructor;

// Add type for the global 'window' object
declare interface Window {
  __REDUX_DEVTOOLS_EXTENSION_COMPOSE__?: Function;
  __INITIAL_STATE__?: any;
}

// Add type for the global 'document' object
declare interface Document {
  documentMode?: number;
}

// Add type for the global 'navigator' object
declare interface Navigator {
  userAgent: string;
  language: string;
  languages: string[];
}

// Add type for process.env
declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test';
    PUBLIC_URL: string;
  }
}
