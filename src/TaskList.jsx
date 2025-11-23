
import Item from "./item"//אין לי מושג למה זה עובד בשבילי אבל אם זה עושה לך בעיות תשני לI

// input props object with tasks array and handlers
// output jsx that renders a list of item components
// this component maps tasks and passes the handlers down to each item
function TaskList(props) 
{
  const { tasks, onDeleteTask, onToggleEdit, onChangeTaskText } = props

  return (
    <div className="tasklist">
      {tasks.map(task => (
        <Item
          key={task.id}
          task={task}
          onDeleteTask={onDeleteTask}
          onToggleEdit={onToggleEdit}
          onChangeTaskText={onChangeTaskText}
        />
      ))}
    </div>
  )
}

export default TaskList