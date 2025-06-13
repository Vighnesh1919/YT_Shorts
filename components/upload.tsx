"use client";
import React, { useState } from "react";
import { ImageKitProvider, IKUpload } from "imagekitio-next";
import { Progress } from "./ui/progress";

// Use environment variables securely
const publicKey = process.env.NEXT_PUBLIC_PUBLIC_KEY!;
const urlEndpoint = process.env.NEXT_PUBLIC_URL_ENDPOINT!;

// Define the expected upload response structure
type IKUploadResponse = {
  fileId: string;
  name: string;
  url: string;
  thumbnailUrl?: string;
};

const authenticator = async () => {
  try {
    const response = await fetch("/api/auth");

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Request failed with status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const { signature, expire, token } = data;
    return { signature, expire, token };
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(`Authentication request failed: ${error.message}`);
    }
    throw error;
  }
};

type UploadProps = {
  setVideoUrl: (url: string) => void;
};

export default function Upload({ setVideoUrl }: UploadProps) {
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onError = (err: any) => {
    console.error("Upload Error:", err);
    setError(err?.message || "Upload failed.");
    setUploadProgress(null);
  };

  const onSuccess = (res: IKUploadResponse) => {
    console.log("Upload Success:", res);
    setVideoUrl(res.url);
    setUploadProgress(100);
    setError(null);
  };

  const onUploadProgress = (evt: ProgressEvent<XMLHttpRequestEventTarget>) => {
    if (evt.lengthComputable) {
      const progress = Math.round((evt.loaded / evt.total) * 100);
      setUploadProgress(progress);
    }
  };

  const onUploadStart = () => {
    setUploadProgress(0);
    setError(null);
  };

  return (
    <ImageKitProvider
      publicKey={publicKey}
      urlEndpoint={urlEndpoint}
      authenticator={authenticator}
    >
      <p className="text-sm font-medium text-gray-700">Upload File</p>
      <IKUpload
        useUniqueFileName={true}
        validateFile={(file: File) => {
          if (file.size > 20 * 1024 * 1024) {
            setError("File size exceeds 20MB.");
            return false; // Reject large files
          }
          return true;
        }}
        folder="/sample-folder"
        onError={onError}
        onSuccess={onSuccess}
        onUploadProgress={onUploadProgress}
        onUploadStart={onUploadStart}
        className="mt-1 block w-full text-sm text-gray-900 file:mr-4 file:px-4 file:py-2 file:rounded-md file:border file:border-gray-300 file:bg-white file:text-sm file:font-semibold file:text-gray-700 hover:file:bg-gray-50"
      />

      {uploadProgress !== null && (
        <div className="mt-4">
          <Progress value={uploadProgress} className="h-2" />
        </div>
      )}

      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </ImageKitProvider>
  );
}
