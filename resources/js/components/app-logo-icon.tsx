import type { SVGAttributes } from 'react';

/**
 * Brand mark: slate-900 rounded square with a white "H" cutout. Designed to
 * match the bitmap shipped at /public/resources/icon.png. Single source of
 * truth for sidebar/header/auth-layouts.
 */
export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <svg
            {...props}
            viewBox="0 0 512 512"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
        >
            <rect width="512" height="512" rx="96" ry="96" fill="#0f172a" />
            <g
                fill="none"
                stroke="#f8fafc"
                strokeWidth="48"
                strokeLinecap="square"
            >
                <line x1="176" y1="128" x2="176" y2="384" />
                <line x1="336" y1="128" x2="336" y2="384" />
                <line x1="176" y1="256" x2="336" y2="256" />
            </g>
        </svg>
    );
}