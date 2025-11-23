import { useState } from "react"
import "./App.css"
import TaskList from "./TaskList.jsx"

function App() {
  const [tasks, setTasks] = useState([
    { id: 1, text: "buy milk", isediting: false },
    { id: 2, text: "smile", isediting: false },
    { id: 3, text: "go for a walk", isediting: false }
  ])

  return (
    <div className="app">
      <h1 className="title">task manager</h1>
      <TaskList tasks={tasks} />
    </div>
  )
}

export default App
