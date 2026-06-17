import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { Button } from "@heroui/react"
import { ChevronRight } from "lucide-react"
import "./index.css"

const App = () => {
  return (
    <div className="text-foreground bg-background min-h-[100dvh] flex flex-col items-center justify-center gap-6">
      <img src="/favicon.svg" className="w-[400px] max-w-[70%]" />
      <p className="text-2xl font-semibold tracking-tight text-default-600">cloud</p>
      <Button
        aria-label="Go"
        className="bg-primary text-primary-foreground shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-transform min-w-14 w-14 h-14 rounded-full p-0 flex items-center justify-center"
      >
        <ChevronRight size={24} strokeWidth={2.5} />
      </Button>
    </div>
  )
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
