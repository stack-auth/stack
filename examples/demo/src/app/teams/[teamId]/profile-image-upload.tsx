"use client";

import React from "react";
import { Button } from "@stackframe/stack-ui";
import { runAsynchronously } from "@stackframe/stack-shared/dist/utils/promises";
import { uploadProfileImage } from "./server-actions";

export function getBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}


export function ProfileImageUpload(props: { teamId: string }) {
  const [file, setFile] = React.useState<File | null>(null);
  return (
    <>
      <input type='file' onChange={(e) => {
        const file = e.target.files?.[0];
        if (!file) return;
      setFile(file);
      }} />
      <Button onClick={() => runAsynchronously(async () => {
        if (!file) return;
        const base64 = await getBase64(file);
        await uploadProfileImage(props.teamId, base64);
      })} disabled={!file}>Upload</Button>
    </>
  );
}