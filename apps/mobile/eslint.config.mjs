import react from "@doska/configs/eslint/react"
import { defineConfig, globalIgnores } from "eslint/config"

// .expo is generated; its router.d.ts carries a disable directive we'd flag.
export default defineConfig([globalIgnores([".expo"]), react])
