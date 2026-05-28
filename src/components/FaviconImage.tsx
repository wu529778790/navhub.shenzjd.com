"use client";

import Image from "next/image";
import { Globe, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
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
  const [failedSrc, setFailedSrc] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const resolvedSrc = useMemo(() => getRenderableFaviconUrl(src), [src]);
  const shouldShowImage = Boolean(resolvedSrc) && failedSrc !== resolvedSrc;

  if (shouldShowImage) {
    if (fill) {
      return (
        <>
          {isLoading && (
            <div className={cn("absolute inset-0 flex items-center justify-center animate-pulse", fallbackClassName)}>
              <Loader2 className={cn("w-4 h-4 animate-spin text-[var(--muted-foreground)]", iconClassName)} />
            </div>
          )}
          <Image
            src={resolvedSrc!}
            alt={alt}
            fill
            className={cn(imageClassName, isLoading && "opacity-0")}
            unoptimized
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setFailedSrc(resolvedSrc);
              setIsLoading(false);
            }}
          />
        </>
      );
    }

    return (
      <>
        {isLoading && (
          <div className={cn("flex items-center justify-center animate-pulse", fallbackClassName)}>
            <Loader2 className={cn("w-4 h-4 animate-spin text-[var(--muted-foreground)]", iconClassName)} />
          </div>
        )}
        <Image
          src={resolvedSrc!}
          alt={alt}
          width={size}
          height={size}
          className={cn(imageClassName, isLoading && "opacity-0")}
          unoptimized
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setFailedSrc(resolvedSrc);
            setIsLoading(false);
          }}
        />
      </>
    );
  }

  return (
    <div className={cn("w-full h-full flex items-center justify-center", fallbackClassName)}>
      <Globe className={cn("w-4 h-4", iconClassName)} />
    </div>
  );
}
