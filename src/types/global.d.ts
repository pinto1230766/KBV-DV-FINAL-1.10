// Extend the global Intl namespace for DateTimeFormatOptions
declare namespace Intl {
  interface DateTimeFormatOptions {
    localeMatcher?: 'lookup' | 'best fit' | undefined;
    weekday?: 'long' | 'short' | 'narrow' | undefined;
    era?: 'long' | 'short' | 'narrow' | undefined;
    year?: 'numeric' | '2-digit' | undefined;
    month?: 'numeric' | '2-digit' | 'long' | 'short' | 'narrow' | undefined;
    day?: 'numeric' | '2-digit' | undefined;
    hour?: 'numeric' | '2-digit' | undefined;
    minute?: 'numeric' | '2-digit' | undefined;
    second?: 'numeric' | '2-digit' | undefined;
    timeZoneName?: 'long' | 'short' | 'shortOffset' | 'longOffset' | 'shortGeneric' | 'longGeneric' | undefined;
    formatMatcher?: 'basic' | 'best fit' | undefined;
    hour12?: boolean | undefined;
    timeZone?: string | undefined;
  }
}

declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}

declare module '*.module.scss' {
  const classes: { [key: string]: string };
  export default classes;
}

declare module '*.svg' {
  import * as React from 'react';
  export const ReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
  const src: string;
  export default src;
}
