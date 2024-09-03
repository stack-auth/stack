"use client";

import Color from "color";
import { useId } from "react";
import { Button } from "@stackframe/stack-ui";
import { useStackApp } from "..";

const iconSize = 22;

function GoogleIcon({ iconSize }: { iconSize: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={iconSize} height={iconSize} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
      <path fill="none" d="M1 1h22v22H1z" />
    </svg>
  );
}

function FacebookIcon({ iconSize }: { iconSize: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={iconSize} height={iconSize} viewBox="0 0 512 512">
      <path
        fill="#FFFFFF"
        d="M512 256C512 114.6 397.4 0 256 0S0 114.6 0 256C0 376 82.7 476.8 194.2 504.5V334.2H141.4V256h52.8V222.3c0-87.1 39.4-127.5 125-127.5c16.2 0 44.2 3.2 55.7 6.4V172c-6-.6-16.5-1-29.6-1c-42 0-58.2 15.9-58.2 57.2V256h83.6l-14.4 78.2H287V510.1C413.8 494.8 512 386.9 512 256h0z"
      />
    </svg>
  );
}

function GitHubIcon({ iconSize }: { iconSize: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={iconSize} height={iconSize} viewBox="0 0 496 512">
      <path
        fill="#FFFFFF"
        d="M165.9 397.4c0 2-2.3 3.6-5.2 3.6-3.3 .3-5.6-1.3-5.6-3.6 0-2 2.3-3.6 5.2-3.6 3-.3 5.6 1.3 5.6 3.6zm-31.1-4.5c-.7 2 1.3 4.3 4.3 4.9 2.6 1 5.6 0 6.2-2s-1.3-4.3-4.3-5.2c-2.6-.7-5.5 .3-6.2 2.3zm44.2-1.7c-2.9 .7-4.9 2.6-4.6 4.9 .3 2 2.9 3.3 5.9 2.6 2.9-.7 4.9-2.6 4.6-4.6-.3-1.9-3-3.2-5.9-2.9zM244.8 8C106.1 8 0 113.3 0 252c0 110.9 69.8 205.8 169.5 239.2 12.8 2.3 17.3-5.6 17.3-12.1 0-6.2-.3-40.4-.3-61.4 0 0-70 15-84.7-29.8 0 0-11.4-29.1-27.8-36.6 0 0-22.9-15.7 1.6-15.4 0 0 24.9 2 38.6 25.8 21.9 38.6 58.6 27.5 72.9 20.9 2.3-16 8.8-27.1 16-33.7-55.9-6.2-112.3-14.3-112.3-110.5 0-27.5 7.6-41.3 23.6-58.9-2.6-6.5-11.1-33.3 2.6-67.9 20.9-6.5 69 27 69 27 20-5.6 41.5-8.5 62.8-8.5s42.8 2.9 62.8 8.5c0 0 48.1-33.6 69-27 13.7 34.7 5.2 61.4 2.6 67.9 16 17.7 25.8 31.5 25.8 58.9 0 96.5-58.9 104.2-114.8 110.5 9.2 7.9 17 22.9 17 46.4 0 33.7-.3 75.4-.3 83.6 0 6.5 4.6 14.4 17.3 12.1C428.2 457.8 496 362.9 496 252 496 113.3 383.5 8 244.8 8zM97.2 352.9c-1.3 1-1 3.3 .7 5.2 1.6 1.6 3.9 2.3 5.2 1 1.3-1 1-3.3-.7-5.2-1.6-1.6-3.9-2.3-5.2-1zm-10.8-8.1c-.7 1.3 .3 2.9 2.3 3.9 1.6 1 3.6 .7 4.3-.7 .7-1.3-.3-2.9-2.3-3.9-2-.6-3.6-.3-4.3 .7zm32.4 35.6c-1.6 1.3-1 4.3 1.3 6.2 2.3 2.3 5.2 2.6 6.5 1 1.3-1.3 .7-4.3-1.3-6.2-2.2-2.3-5.2-2.6-6.5-1zm-11.4-14.7c-1.6 1-1.6 3.6 0 5.9 1.6 2.3 4.3 3.3 5.6 2.3 1.6-1.3 1.6-3.9 0-6.2-1.4-2.3-4-3.3-5.6-2z"
      />
    </svg>
  );
}

function MicrosoftIcon({ iconSize }: { iconSize: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={iconSize} height={iconSize} viewBox="0 0 21 21">
      <title>{"MS-SymbolLockup"}</title>
      <path fill="#f25022" d="M1 1h9v9H1z" />
      <path fill="#00a4ef" d="M1 11h9v9H1z" />
      <path fill="#7fba00" d="M11 1h9v9h-9z" />
      <path fill="#ffb900" d="M11 11h9v9h-9z" />
    </svg>
  );
}

function SpotifyIcon({ iconSize }: { iconSize: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={iconSize} height={iconSize} viewBox="0 0 496 512">
      <path
        fill="#ffffff"
        d="M248 8C111.1 8 0 119.1 0 256s111.1 248 248 248 248-111.1 248-248S384.9 8 248 8zm100.7 364.9c-4.2 0-6.8-1.3-10.7-3.6-62.4-37.6-135-39.2-206.7-24.5-3.9 1-9 2.6-11.9 2.6-9.7 0-15.8-7.7-15.8-15.8 0-10.3 6.1-15.2 13.6-16.8 81.9-18.1 165.6-16.5 237 26.2 6.1 3.9 9.7 7.4 9.7 16.5s-7.1 15.4-15.2 15.4zm26.9-65.6c-5.2 0-8.7-2.3-12.3-4.2-62.5-37-155.7-51.9-238.6-29.4-4.8 1.3-7.4 2.6-11.9 2.6-10.7 0-19.4-8.7-19.4-19.4s5.2-17.8 15.5-20.7c27.8-7.8 56.2-13.6 97.8-13.6 64.9 0 127.6 16.1 177 45.5 8.1 4.8 11.3 11 11.3 19.7-.1 10.8-8.5 19.5-19.4 19.5zm31-76.2c-5.2 0-8.4-1.3-12.9-3.9-71.2-42.5-198.5-52.7-280.9-29.7-3.6 1-8.1 2.6-12.9 2.6-13.2 0-23.3-10.3-23.3-23.6 0-13.6 8.4-21.3 17.4-23.9 35.2-10.3 74.6-15.2 117.5-15.2 73 0 149.5 15.2 205.4 47.8 7.8 4.5 12.9 10.7 12.9 22.6 0 13.6-11 23.3-23.2 23.3z"
      />
    </svg>
  );
}
function DiscordIcon({ iconSize }: { iconSize: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={iconSize} height={iconSize} viewBox="0 0 127.14 96.36">
      <path
        fill="#fff"
        d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z"
      />
    </svg>
  );
}
function GitlabIcon({ iconSize }: { iconSize: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={iconSize}
      height={iconSize}
      viewBox="0 -10 256 256"
      version="1.1"
      preserveAspectRatio="xMidYMid"
    >
      <g>
        <path
          d="M128.07485,236.074667 L128.07485,236.074667 L175.17885,91.1043048 L80.9708495,91.1043048 L128.07485,236.074667 L128.07485,236.074667 Z"
          fill="#E24329"
        ></path>
        <path
          d="M128.07485,236.074423 L80.9708495,91.104061 L14.9557638,91.104061 L128.07485,236.074423 L128.07485,236.074423 Z"
          fill="#FC6D26"
        ></path>
        <path
          d="M14.9558857,91.1044267 L14.9558857,91.1044267 L0.641828571,135.159589 C-0.663771429,139.17757 0.766171429,143.57955 4.18438095,146.06275 L128.074971,236.074789 L14.9558857,91.1044267 L14.9558857,91.1044267 Z"
          fill="#FCA326"
        ></path>
        <path
          d="M14.9558857,91.1045486 L80.9709714,91.1045486 L52.6000762,3.79026286 C51.1408762,-0.703146667 44.7847619,-0.701927619 43.3255619,3.79026286 L14.9558857,91.1045486 L14.9558857,91.1045486 Z"
          fill="#E24329"
        ></path>
        <path
          d="M128.07485,236.074423 L175.17885,91.104061 L241.193935,91.104061 L128.07485,236.074423 L128.07485,236.074423 Z"
          fill="#FC6D26"
        ></path>
        <path
          d="M241.193935,91.1044267 L241.193935,91.1044267 L255.507992,135.159589 C256.813592,139.17757 255.38365,143.57955 251.96544,146.06275 L128.07485,236.074789 L241.193935,91.1044267 L241.193935,91.1044267 Z"
          fill="#FCA326"
        ></path>
        <path
          d="M241.193935,91.1045486 L175.17885,91.1045486 L203.549745,3.79026286 C205.008945,-0.703146667 211.365059,-0.701927619 212.824259,3.79026286 L241.193935,91.1045486 L241.193935,91.1045486 Z"
          fill="#E24329"
        ></path>
      </g>
    </svg>
  );
}

const changeColor = (c: Color, value: number) => {
  if (c.isLight()) {
    value = -value;
  }
  return c.hsl(c.hue(), c.saturationl(), c.lightness() + value).toString();
};

export function OAuthButton({ provider, type }: { provider: string; type: "sign-in" | "sign-up" }) {
  const stackApp = useStackApp();
  const styleId = useId().replaceAll(":", "-");

  let style: {
    backgroundColor?: string;
    textColor?: string;
    name: string;
    icon: JSX.Element | null;
    border?: string;
  };
  switch (provider) {
    case "google": {
      style = {
        backgroundColor: "#fff",
        textColor: "#000",
        name: "Google",
        border: "1px solid #ddd",
        icon: <GoogleIcon iconSize={iconSize} />,
      };
      break;
    }
    case "github": {
      style = {
        backgroundColor: "#111",
        textColor: "#fff",
        border: "1px solid #333",
        name: "GitHub",
        icon: <GitHubIcon iconSize={iconSize} />,
      };
      break;
    }
    case "facebook": {
      style = {
        backgroundColor: "#1877F2",
        textColor: "#fff",
        name: "Facebook",
        icon: <FacebookIcon iconSize={iconSize} />,
      };
      break;
    }
    case "microsoft": {
      style = {
        backgroundColor: "#2f2f2f",
        textColor: "#fff",
        name: "Microsoft",
        icon: <MicrosoftIcon iconSize={iconSize} />,
      };
      break;
    }
    case "spotify": {
      style = {
        backgroundColor: "#1DB954",
        textColor: "#fff",
        name: "Spotify",
        icon: <SpotifyIcon iconSize={iconSize} />,
      };
      break;
    }
    case "discord": {
      style = {
        backgroundColor: "#5865F2",
        textColor: "#fff",
        name: "Discord",
        icon: <DiscordIcon iconSize={iconSize} />,
      };
      break;
    }
    case "gitlab": {
      style = {
        backgroundColor: "#111",
        textColor: "#fff",
        border: "1px solid #333",
        name: "Gitlab",
        icon: <GitlabIcon iconSize={iconSize} />,
      };
      break;
    }
    default: {
      style = {
        name: provider,
        icon: null,
      };
    }
  }

  const styleSheet = `
    .stack-oauth-button-${styleId} {
      background-color: ${style.backgroundColor} !important;
      color: ${style.textColor} !important;
      border: ${style.border} !important;
    }
    .stack-oauth-button-${styleId}:hover {
      background-color: ${changeColor(Color(style.backgroundColor), 10)} !important;
    }
  `;

  return (
    <>
      <style>{styleSheet}</style>
      <Button onClick={() => stackApp.signInWithOAuth(provider)} className={`stack-oauth-button-${styleId}`}>
        <div className="flex w-full items-center gap-4">
          {style.icon}
          <span className="flex-1">
            {type === "sign-up" ? "Sign up with " : "Sign in with "}
            {style.name}
          </span>
        </div>
      </Button>
    </>
  );
}
