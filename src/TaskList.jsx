// input props object with a tasks array
// output jsx element that contains a list of item components
// this component maps over the tasks and renders an item for each one
import Item from "./item"

function TaskList(props) {
  const { tasks } = props

  return (
    <div className="tasklist">
      {tasks.map(task => (
        <Item key={task.id} task={task} />
      ))}
    </div>
  )
}

export default TaskList
