import { ProjectsCrud } from "../interface/crud/projects";
import { StackAssertionError } from "../utils/errors";
import { isLocalhost } from "../utils/urls";

export type ProductionModeError = {
  message: string,
  relativeFixUrl: `/${string}`,
};

export function getProductionModeErrors(project: ProjectsCrud["Admin"]["Read"]): ProductionModeError[] {
  const errors: ProductionModeError[] = [];
  const domainsFixUrl = `/projects/${project.id}/domains` as const;

  if (project.config.allow_localhost) {
    errors.push({
      message: "Localhost is not allowed in production mode, turn off 'Allow localhost' in project settings",
      relativeFixUrl: domainsFixUrl,
    });
  }

  for (const { domain } of project.config.domains) {
    let url;
    try {
      url = new URL(domain);
    } catch {
      throw new StackAssertionError("Domain was somehow not a valid URL; we should've caught this when setting the domain in the first place", {
        domain,
        projectId: project
      });
    }

    if (isLocalhost(url)) {
      errors.push({
        message: "Localhost domains are not allowed to be trusted in production mode: " + domain,
        relativeFixUrl: domainsFixUrl,
      });
    } else if (url.hostname.match(/^\d+(\.\d+)*$/)) {
      errors.push({
        message: "Direct IPs are not valid for trusted domains in production mode: " + domain,
        relativeFixUrl: domainsFixUrl,
      });
    } else if (url.protocol !== "https:") {
      errors.push({
        message: "Trusted domains should be HTTPS: " + domain,
        relativeFixUrl: domainsFixUrl,
      });
    }
  }

  return errors;
}
