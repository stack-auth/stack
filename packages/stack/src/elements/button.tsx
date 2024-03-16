export default function Button(props: {
  children: React.ReactNode,
  style?: any,
  className?: string,
  onClick?: () => void,
  loading?: boolean,
  leftIcon?: React.ReactNode,
  rightIcon?: React.ReactNode,
}) {
  let leftIconJsx;
  if (props.leftIcon) {
    leftIconJsx = <div>{props.leftIcon}</div>;
  } else if (props.rightIcon) {
    leftIconJsx = <div className="wl_invisible">{props.rightIcon}</div>;
  }

  let rightIconJsx;
  if (props.rightIcon) {
    rightIconJsx = <div>{props.rightIcon}</div>;
  } else if (props.leftIcon) {
    rightIconJsx = <div className="wl_invisible">{props.leftIcon}</div>;
  }


  return (
    <button
      className={"wl_btn wl_items-center " + (props.className || "")}
      style={props.style}
      onClick={props.onClick}
      disabled={props.loading}
    >
      {leftIconJsx}
      <div className="wl_flex-grow wl_flex wl_items-center wl_justify-center">
        <span className={`wl_loading wl_loading-spinner wl_mr-2 ${props.loading ? "" : "wl_invisible"}`}/>
        {props.children}
        <span className="wl_loading wl_loading-spinner wl_ml-2 wl_invisible"/>
      </div>
      {rightIconJsx}
    </button>
  );
}
