import { ContactChannelType } from "@prisma/client";
import { PrismaTransaction } from "./types";

const fullContactChannelInclude = {
  projectUser: {
    include: {
      authMethods: {
        include: {
          otpAuthMethod: true,
          passwordAuthMethod: true,
        }
      }
    }
  }
};

export async function getAuthContactChannel(
  tx: PrismaTransaction,
  options: {
    projectId: string,
    type: ContactChannelType,
    value: string,
  }
) {
  return await tx.contactChannel.findUnique({
    where: {
      projectId_type_value_usedForAuth: {
        projectId: options.projectId,
        type: options.type,
        value: options.value,
        usedForAuth: "TRUE",
      }
    },
    include: fullContactChannelInclude,
  });
}
