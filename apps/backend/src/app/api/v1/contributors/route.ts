import sharp from "sharp";
import * as yup from "yup";
import { yupMixed, yupNumber, yupObject, yupString } from "@stackframe/stack-shared/dist/schema-fields";
import { getNodeEnvironment } from "@stackframe/stack-shared/dist/utils/env";
import { StackAssertionError, captureError } from "@stackframe/stack-shared/dist/utils/errors";
import { createSmartRouteHandler } from "@/route-handlers/smart-route-handler";

let pngImagePromise: Promise<Uint8Array> | undefined;

export const GET = createSmartRouteHandler({
  metadata: {
    hidden: true,
  },
  request: yupObject({}),
  response: yupObject({
    statusCode: yupNumber().oneOf([200]).required(),
    bodyType: yupString().oneOf(["binary"]).required(),
    body: yupMixed<any>().required(),
    headers: yupObject({
      "Content-Type": yup.tuple([yupString().oneOf(["image/png"]).required()]).required(),
    }).required(),
  }),
  handler: async () => {
    if (getNodeEnvironment() === "development" || !pngImagePromise) {
      pngImagePromise = (async () => {
        const ghPage = await fetch("https://github.com/stack-auth/stack");
        const ghPageText = await ghPage.text();
        const regex = /<a\s+href="https:\/\/github\.com\/([^"]+)"\s+class=""\s+data-hovercard-type="user"/gm;
        const matches = [...ghPageText.matchAll(regex)];
        if (matches.length === 0) {
          throw new StackAssertionError("Could not find any contributors. This is unexpected.", { ghPageText });
        }
        const contributors = matches.map((match) => match[1]);
        console.log("Creating contributor image", { contributors });

        const imagesPerRow = 9;
        const rows = Math.ceil(contributors.length / imagesPerRow);
        const profilePictureSize = 96;
        const gapSize = Math.round(profilePictureSize * 0.1);
        const cellSize = profilePictureSize + gapSize;

        const contributorsImageUrls = contributors.map((contributor) => `https://github.com/${encodeURIComponent(contributor)}.png`);
        const contributorsImagesArrayBuffers = await Promise.all(
          contributorsImageUrls.map(async (url) => {
            const image = await fetch(url);
            return await image.arrayBuffer();
          }),
        );
        const contributorsImagesBuffersRounded = await Promise.all(
          contributorsImagesArrayBuffers.map(async (buffer) => {
            const filledCircle = `<svg xmlns="http://www.w3.org/2000/svg" width="${profilePictureSize}" height="${profilePictureSize}"><circle cx="${profilePictureSize / 2}" cy="${profilePictureSize / 2}" r="${profilePictureSize / 2}" fill="#000000"/></svg>`;
            return await sharp(buffer)
              .resize(profilePictureSize, profilePictureSize)
              .composite([
                {
                  input: Buffer.from(filledCircle),
                  blend: "dest-in",
                },
              ])
              .png()
              .toBuffer();
          }),
        );

        const circleOutline = `<svg xmlns="http://www.w3.org/2000/svg" width="${profilePictureSize + 2}" height="${profilePictureSize + 2}"><circle cx="${profilePictureSize / 2 + 1}" cy="${profilePictureSize / 2 + 1}" r="${profilePictureSize / 2}" fill="none" stroke="#88888888" stroke-width="${1}"/></svg>`;
        const mergedImage = sharp({
          create: {
            width: cellSize * (imagesPerRow - 1) + profilePictureSize + 2,
            height: cellSize * (rows - 1) + profilePictureSize + 2,
            channels: 3,
            background: { alpha: 0, r: 255, g: 255, b: 255 },
          },
        }).composite(
          contributorsImagesBuffersRounded.flatMap((buffer, index) => [
            {
              input: buffer,
              top: Math.floor(index / imagesPerRow) * cellSize + 1,
              left: (index % imagesPerRow) * cellSize + 1,
            },
            {
              input: Buffer.from(circleOutline),
              top: Math.floor(index / imagesPerRow) * cellSize,
              left: (index % imagesPerRow) * cellSize,
            },
          ]),
        );

        return await mergedImage.png().toBuffer();
      })();
      pngImagePromise.catch((error) => {
        captureError("contributors-image", error);
        throw error;
      });
    }

    return {
      statusCode: 200,
      bodyType: "binary",
      headers: {
        "Content-Type": ["image/png"],
      },
      body: await pngImagePromise,
    } as const;
  },
});
