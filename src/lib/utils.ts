// Kept for components.json's `utils` alias: legacy-style shadcn registry
// items import `@/lib/utils` and the CLI rewrites that to this path. New
// code imports `cn` from the "cn" package directly (as the generated
// src/components/ui/* files do).
export { cn } from "cn"
