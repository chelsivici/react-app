import { useState } from "react"
import "./App.css"
import TaskList from "./TaskList.jsx"

// this component holds the task list state and passes data and handlers to tasklist :3
function App() 
{
  const [tasks, setTasks] = useState([
    { id: 1, text: "buy milk", isediting: false },
    { id: 2, text: "smile", isediting: false },
    { id: 3, text: "go for a walk", isediting: false }
  ])

  const [newTaskText, setNewTaskText] = useState("")

  // input event object from input change
  // output none
  // this function updates da new task text state as the user types
  function handleNewTaskChange(event) {
    setNewTaskText(event.target.value)
  }

  // input none
  // output nothing
  // this function adds a new task to tasks list if the text is empty
  function handleAddTask() 
  {
    const trimmed = newTaskText.trim()
    if (trimmed === "") {
      return
    }

    const newTask = {
      id: Date.now(), // special id :o
      text: trimmed,
      isediting: false
    }

    setTasks(prevTasks => [...prevTasks, newTask])
    setNewTaskText("")
  }

  // input task id number
  // output none
  // this function removes task with given id from tasks list
  function handleDeleteTask(id) 
  {
    setTasks(prevTasks => prevTasks.filter(task => task.id !== id))
  }
  // input task id number
  // output none
  // this function toggles isediting flag for task with given id
  function handleToggleEdit(id) 
  {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === id
          ? { ...task, isediting: !task.isediting }
          : task
      )
    )
  }

  // input task id number and new text string
  // output none
  // this function updates text of task with given id
  function handleChangeTaskText(id, newText) 
  {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === id
          ? { ...task, text: newText }
          : task
      )
    )
  }

  return (
    <div className="app">
      <h1 className="title">task manager</h1>

      <div className="addtask">
        <input
          type="text"
          placeholder="new task..."
          value={newTaskText}
          onChange={handleNewTaskChange}
        />
        <button onClick={handleAddTask}>
          add
        </button>
      </div>

      <TaskList
        tasks={tasks}
        onDeleteTask={handleDeleteTask}
        onToggleEdit={handleToggleEdit}
        onChangeTaskText={handleChangeTaskText}
      />
    </div>
  )
}

export default App
