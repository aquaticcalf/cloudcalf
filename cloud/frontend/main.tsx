import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

const App = () => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100dvh",
      }}
    >
      <img src="/favicon.svg" style={{ width: "400px", maxWidth: "70%" }} />
      <p>cloud</p>
    </div>
  )
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
