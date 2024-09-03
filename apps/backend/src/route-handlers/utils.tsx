import { KnownErrors } from "@stackframe/stack-shared";
import { UsersCrud } from "@stackframe/stack-shared/dist/interface/crud/users";

export function getIdFromUserIdOrMe(userId: string, user: UsersCrud["Server"]["Read"] | undefined): string;
export function getIdFromUserIdOrMe(userId: string | undefined, user: UsersCrud["Server"]["Read"] | undefined): string | undefined;
export function getIdFromUserIdOrMe(userId: string | undefined, user: UsersCrud["Server"]["Read"] | undefined): string | undefined {
  if (userId === "me") {
    if (!user) {
      throw new KnownErrors.CannotGetOwnUserWithoutUser();
    }
    return user.id;
  }

  return userId;
}
