import { SmartImage } from "./smart-image";
import logoLightMode from "../../public/logo.svg";
import logoFullLightMode from "../../public/logo-full.svg";
import logoDarkMode from "../../public/logo-bright.svg";
import logoFullDarkMode from "../../public/logo-full-bright.svg";
import { Link } from "./link";

type ImageProps = React.ComponentProps<typeof SmartImage>;

export function Logo(props: (ImageProps | Omit<ImageProps, "src" | "alt">) & { full?: boolean, href?: string}) {
  const { full, ...imageProps } = props;
  const logos = {
    light: full ? logoFullLightMode : logoLightMode,
    dark: full ? logoFullDarkMode : logoDarkMode,
  };

  return (
    <>
      <Link href={props.href || "/"} className="block dark:hidden">
        <SmartImage src={logos.light} alt="Logo" priority {...imageProps} placeholder="empty" />
      </Link>
      <Link href={props.href || "/"} className="hidden dark:block">
        <SmartImage src={logos.dark} alt="Logo" priority {...imageProps} placeholder="empty" />
      </Link>
    </>
  );
}
