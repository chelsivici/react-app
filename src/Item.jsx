// input props object with a single task
// output jsx element that represents a single task row
// this component shows a checkbox the text and the edit erase buttons

function Item(props) {
  const { task } = props

  return (
    <div className="taskitem">
      <input
        type="checkbox"
        className="taskcheckbox"
      />
      <span className="tasktext">
        {task.text}
      </span>
      <button className="taskbutton">
        edit
      </button>
      <button className="taskbutton taskbuttondanger">
        erase
      </button>
    </div>
  )
}

export default Item