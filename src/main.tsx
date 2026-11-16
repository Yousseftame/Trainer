import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { App } from "@/app/App"
import { purgeInsecureBrowserStorage } from "@/features/auth/purge-insecure-storage"
import "@/lib/firebase/firebase"
import "./index.css"

// Before React mounts: strip legacy password/session caches from Application storage.
purgeInsecureBrowserStorage()

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
