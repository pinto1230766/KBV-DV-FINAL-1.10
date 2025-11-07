import 'react';

declare module 'react' {
    interface CSSProperties {
        '--animation-delay'?: string;
    }
}
