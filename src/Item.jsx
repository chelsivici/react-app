
// this component shows a checkbox the text or an input and edit or save and erase buttons :D
function Item(props) {
  const { task, onDeleteTask, onToggleEdit, onChangeTaskText } = props

  // input none
  // output nothing
  // this function calls delete handler from props with task id
  function handleEraseClick() 
  {
    onDeleteTask(task.id)
  }

  // input none
  // output none
  // this function togles da editing state for task using handler from props
  function handleEditClick() 
  {
    onToggleEdit(task.id)
  }

  // input event from text input
  // output none
  // this function updates the task text while the user types in edit mode
  function handleTextChange(event) 
  {
    onChangeTaskText(task.id, event.target.value)
  }

  return (
    <div className="taskitem">
      <input
        type="checkbox"
        className="taskcheckbox"
      />

      {task.isediting ? (
        <input
          type="text"
          className="taskinput"
          value={task.text}
          onChange={handleTextChange}
        />
      ) : (
        <span className="tasktext">
          {task.text}
        </span>
      )}

      <button
        className="taskbutton"
        onClick={handleEditClick}
      >
        {task.isediting ? "save" : "edit"}
      </button>

      <button
        className="taskbutton taskbuttondanger"
        onClick={handleEraseClick}
      >
        erase
      </button>
    </div>
  )
}

export default Item