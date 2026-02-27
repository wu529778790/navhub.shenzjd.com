"use client";

import Image from "next/image";
import { Globe } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface FaviconImageProps {
  src?: string;
  alt: string;
  fill?: boolean;
  size?: number;
  imageClassName?: string;
  fallbackClassName?: string;
  iconClassName?: string;
}

export function FaviconImage({
  src,
  alt,
  fill = false,
  size = 24,
  imageClassName,
  fallbackClassName,
  iconClassName,
}: FaviconImageProps) {
  const [loadFailed, setLoadFailed] = useState(false);
  const shouldShowImage = Boolean(src) && !loadFailed;

  if (shouldShowImage) {
    if (fill) {
      return (
        <Image
          src={src!}
          alt={alt}
          fill
          className={imageClassName}
          unoptimized
          onError={() => setLoadFailed(true)}
        />
      );
    }

    return (
      <Image
        src={src!}
        alt={alt}
        width={size}
        height={size}
        className={imageClassName}
        unoptimized
        onError={() => setLoadFailed(true)}
      />
    );
  }

  return (
    <div className={cn("w-full h-full flex items-center justify-center", fallbackClassName)}>
      <Globe className={cn("w-4 h-4", iconClassName)} />
    </div>
  );
}
