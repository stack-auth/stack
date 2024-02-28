import { Link } from "@mui/joy";
import { SmartImage } from "./smart-image";
import logoLightMode from "../../public/logo.svg";
import logoFullLightMode from "../../public/logo-full.svg";
import logoDarkMode from "../../public/logo-bright.svg";
import logoFullDarkMode from "../../public/logo-full-bright.svg";

type ImageProps = React.ComponentProps<typeof SmartImage>;

export function Logo(props: (ImageProps | Omit<ImageProps, "src" | "alt">) & { full?: boolean, href?: string}) {
  const { full, ...imageProps } = props;

  // first item is the selector which HIDES the logo, second is the logo source
  const modes = [
    // instead of using theme.getColorSchemeSelector, we use this literal to support RSC
    ['html[data-joy-color-scheme="light"] &', full ? logoFullDarkMode : logoDarkMode],
    ['html:not([data-joy-color-scheme="light"]) &', full ? logoFullLightMode : logoLightMode],
  ] as const;

  return (
    <>
      {modes.map((mode, i) => (
        <Link
          href={props.href || "/"}
          key={i}
          sx={{
            [mode[0]]: {
              display: 'none',
            },
          }}
        >
          <SmartImage
            src={mode[1]}
            alt="Logo"
            priority
            {...imageProps}
            placeholder="empty"
          />
        </Link>
      ))}
    </>
  );
}
