"use client";

import NextLink from "next/link";
import type { ComponentProps } from "react";

export function AppLink({ prefetch = true, ...props }: ComponentProps<typeof NextLink>) {
  return <NextLink prefetch={prefetch} {...props} />;
}
