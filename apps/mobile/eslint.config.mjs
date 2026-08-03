import react from "@doska/configs/eslint/react"
import { defineConfig, globalIgnores } from "eslint/config"

// These packages' roots re-export their whole catalogue — every Lucide icon,
// every font weight and italic — and Metro cannot tree-shake the asset
// requires back out, so a root import ships all of it. Deep paths only.
const barrels = {
  "lucide-react-native": "lucide-react-native/icons/<kebab-name>",
  "@expo-google-fonts/mulish": "@expo-google-fonts/mulish/<Weight>",
  "@expo-google-fonts/geist-mono": "@expo-google-fonts/geist-mono/<Weight>",
}

export default defineConfig([
  // .expo is generated; its router.d.ts carries a disable directive we'd flag.
  globalIgnores([".expo"]),
  react,
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-restricted-imports": [
        "error",
        {
          paths: Object.entries(barrels).map(([name, deep]) => ({
            name,
            message: `Import from ${deep} instead — the root pulls in the entire catalogue.`,
            allowTypeImports: true,
          })),
        },
      ],
    },
  },
])
