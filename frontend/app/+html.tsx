import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

const THEME_KEY = 'app_theme_preference';
const DARK_BG = '#0C1219';
const LIGHT_BG = '#F3F7F4';

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="id">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1.0, user-scalable=no, viewport-fit=cover"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem(${JSON.stringify(
              THEME_KEY,
            )});var dark=t==='dark'||((t!=='light'&&t!=='auto')&&window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.style.backgroundColor=dark?${JSON.stringify(
              DARK_BG,
            )}:${JSON.stringify(LIGHT_BG)};document.documentElement.style.colorScheme=dark?'dark':'light';}catch(e){document.documentElement.style.backgroundColor=${JSON.stringify(
              DARK_BG,
            )};}})();`,
          }}
        />
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
