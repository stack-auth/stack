import { prismaClient } from "@/prisma-client";
import { KnownErrors } from "@stackframe/stack-shared";

export async function upsertUserImage(
  projectId: string,
  userId: string,
  image:string
):Promise<string>{
    let imageData=await convertbase64ImagetoJpeg(image);
    if (!imageData) {
      throw new Error('Image conversion failed.');
    }
    const upsertedProfileImage = await prismaClient.projectUserProfileImage.upsert({
      where: {
        projectId_userId: {
          projectId: projectId,
          userId: userId,
        },
      },
      create: {
        projectId: projectId,
        userId: userId,
        image: imageData,
      },
      update: {
        image: imageData, // Updating the existing image data
      },
      select: {
        id: true
      }
    });

    return upsertedProfileImage.id;
}

export async function getUserImage(userId:string) {
  const userImageRecord = await prismaClient.projectUserProfileImage.findFirst({
    where: {
      userId: userId,
    },
    select: {
      image: true,
    },
  });
  if (userImageRecord) {
    const imageString = "data:image/jpeg;base64,"+userImageRecord.image.toString('base64');
    return {"userProfileImage":imageString};
  } else {
    return {"userProfileImage":""};
  }
}

async function convertbase64ImagetoJpeg(image:string){
    const imageDataArray = image.split(',');
    if(imageDataArray.length>=2){
      const base64ImageData = imageDataArray[1];
      const buffer = Buffer.from(base64ImageData, 'base64');
      const bufferLengthKB=buffer.length/1024;
      if(bufferLengthKB>500){
        throw new KnownErrors.InvalidProfileImage();
      }
      return buffer;
    }
}