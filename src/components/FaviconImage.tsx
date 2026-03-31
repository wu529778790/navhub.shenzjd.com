"use client";

import Image from "next/image";
import { Globe } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { getRenderableFaviconUrl } from "@/lib/favicon-url";

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
  const resolvedSrc = useMemo(() => getRenderableFaviconUrl(src), [src]);

  useEffect(() => {
    setLoadFailed(false);
  }, [resolvedSrc]);

  const shouldShowImage = Boolean(resolvedSrc) && !loadFailed;

  if (shouldShowImage) {
    if (fill) {
      return (
        <Image
          src={resolvedSrc!}
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
        src={resolvedSrc!}
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
