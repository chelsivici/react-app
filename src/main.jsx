import react from "react"
import reactdom from "react-dom/client"
import App from "./App.jsx"
import "./index.css"

reactdom
  .createRoot(document.getElementById("root"))
  .render(
    <react.StrictMode>
      <App />
    </react.StrictMode>
  )
