import { FaDiscord, FaGithub, FaLinkedin } from "react-icons/fa";
import { Separator, Typography } from "@stackframe/stack-ui";
import { Link } from "@/components/link";

export default function Footer() {
  return (
    <footer>
      <Separator />

      <div className="flex flex-col gap-4 p-4 md:flex-row">
        <div className="flex flex-col gap-4 md:flex-1">
          <ul className="flex flex-grow gap-4">
            {[
              { href: "https://discord.stack-auth.com/", icon: FaDiscord },
              { href: "https://www.linkedin.com/company/stackframe-inc", icon: FaLinkedin },
              { href: "https://github.com/stack-auth/stack", icon: FaGithub },
            ].map(({ href, icon: Icon }) => (
              <li key={href}>
                <Link href={href}>
                  <Icon size={20} className="text-gray-700 dark:text-gray-300" />
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-wrap gap-4 md:flex-1 md:justify-end">
          {[
            { href: "https://stack-auth.com", label: "Home" },
            { href: "https://www.iubenda.com/privacy-policy/19290387", label: "Privacy policy" },
            { href: "https://www.iubenda.com/privacy-policy/19290387/cookie-policy", label: "Cookie policy" },
            { href: "https://www.iubenda.com/terms-and-conditions/19290387", label: "Terms & conditions" },
          ].map(({ href, label }) => (
            <Link key={label} href={href}>
              <Typography variant="secondary" type="label">
                {label}
              </Typography>
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
