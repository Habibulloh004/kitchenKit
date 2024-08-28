import { Link } from "react-router-dom"
import { useDataContext } from "../context/DataContext"

const Order = () => {
    const { data } = useDataContext()
  return (
    <div>Order <Link to={"/"}>id</Link></div>
  )
}

export default Order