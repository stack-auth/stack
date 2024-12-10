import { InternalSession } from "../sessions";
import { ApiKeysCrud } from "./crud/api-keys";
import { EmailTemplateCrud, EmailTemplateType } from "./crud/email-templates";
import { ProjectsCrud } from "./crud/projects";
import { SvixTokenCrud } from "./crud/svix-token";
import { TeamPermissionDefinitionsCrud } from "./crud/team-permissions";
import { ServerAuthApplicationOptions, StackServerInterface } from "./serverInterface";

export type AdminAuthApplicationOptions = ServerAuthApplicationOptions &(
  | {
    superSecretAdminKey: string,
  }
  | {
    projectOwnerSession: InternalSession,
  }
);

export type ApiKeyCreateCrudRequest = {
  has_publishable_client_key: boolean,
  has_secret_server_key: boolean,
  has_super_secret_admin_key: boolean,
  expires_at_millis: number,
  description: string,
};

export type ApiKeyCreateCrudResponse = ApiKeysCrud["Admin"]["Read"] & {
  publishable_client_key?: string,
  secret_server_key?: string,
  super_secret_admin_key?: string,
};

export class StackAdminInterface extends StackServerInterface {
  constructor(public readonly options: AdminAuthApplicationOptions) {
    super(options);
  }

  protected async sendAdminRequest(path: string, options: RequestInit, session: InternalSession | null, requestType: "admin" = "admin") {
    return await this.sendServerRequest(
      path,
      {
        ...options,
        headers: {
          "x-stack-super-secret-admin-key": "superSecretAdminKey" in this.options ? this.options.superSecretAdminKey : "",
          ...options.headers,
        },
      },
      session,
      requestType,
    );
  }

  async getProject(): Promise<ProjectsCrud["Admin"]["Read"]> {
    const response = await this.sendAdminRequest(
      "/projects/current",
      {
        method: "GET",
      },
      null,
    );
    return await response.json();
  }

  async updateProject(update: ProjectsCrud["Admin"]["Update"]): Promise<ProjectsCrud["Admin"]["Read"]> {
    const response = await this.sendAdminRequest(
      "/projects/current",
      {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(update),
      },
      null,
    );
    return await response.json();
  }

  async createApiKey(
    options: ApiKeyCreateCrudRequest,
  ): Promise<ApiKeyCreateCrudResponse> {
    const response = await this.sendAdminRequest(
      "/internal/api-keys",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(options),
      },
      null,
    );
    return await response.json();
  }

  async listApiKeys(): Promise<ApiKeysCrud["Admin"]["Read"][]> {
    const response = await this.sendAdminRequest("/internal/api-keys", {}, null);
    const result = await response.json() as ApiKeysCrud["Admin"]["List"];
    return result.items;
  }

  async revokeApiKeyById(id: string) {
    await this.sendAdminRequest(
      `/internal/api-keys/${id}`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          revoked: true,
        }),
      },
      null,
    );
  }

  async getApiKey(id: string, session: InternalSession): Promise<ApiKeysCrud["Admin"]["Read"]> {
    const response = await this.sendAdminRequest(`/internal/api-keys/${id}`, {}, session);
    return await response.json();
  }

  async listEmailTemplates(): Promise<EmailTemplateCrud['Admin']['Read'][]> {
    const response = await this.sendAdminRequest(`/email-templates`, {}, null);
    const result = await response.json() as EmailTemplateCrud['Admin']['List'];
    return result.items;
  }

  async updateEmailTemplate(type: EmailTemplateType, data: EmailTemplateCrud['Admin']['Update']): Promise<EmailTemplateCrud['Admin']['Read']> {
    const result = await this.sendAdminRequest(
      `/email-templates/${type}`,
      {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(data),
      },
      null,
    );
    return await result.json();
  }

  async resetEmailTemplate(type: EmailTemplateType): Promise<void> {
    await this.sendAdminRequest(
      `/email-templates/${type}`,
      { method: "DELETE" },
      null
    );
  }

  async listPermissionDefinitions(): Promise<TeamPermissionDefinitionsCrud['Admin']['Read'][]> {
    const response = await this.sendAdminRequest(`/team-permission-definitions`, {}, null);
    const result = await response.json() as TeamPermissionDefinitionsCrud['Admin']['List'];
    return result.items;
  }

  async createPermissionDefinition(data: TeamPermissionDefinitionsCrud['Admin']['Create']): Promise<TeamPermissionDefinitionsCrud['Admin']['Read']> {
    const response = await this.sendAdminRequest(
      "/team-permission-definitions",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(data),
      },
      null,
    );
    return await response.json();
  }

  async updatePermissionDefinition(permissionId: string, data: TeamPermissionDefinitionsCrud['Admin']['Update']): Promise<TeamPermissionDefinitionsCrud['Admin']['Read']> {
    const response = await this.sendAdminRequest(
      `/team-permission-definitions/${permissionId}`,
      {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(data),
      },
      null,
    );
    return await response.json();
  }

  async deletePermissionDefinition(permissionId: string): Promise<void> {
    await this.sendAdminRequest(
      `/team-permission-definitions/${permissionId}`,
      { method: "DELETE" },
      null,
    );
  }

  async getSvixToken(): Promise<SvixTokenCrud["Admin"]["Read"]> {
    const response = await this.sendAdminRequest(
      "/webhooks/svix-token",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({}),
      },
      null,
    );
    return await response.json();
  }

  async deleteProject(): Promise<void> {
    await this.sendAdminRequest(
      "/projects/current",
      {
        method: "DELETE",
      },
      null,
    );
  }
}
