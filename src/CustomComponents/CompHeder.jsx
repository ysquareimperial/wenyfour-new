import { BsArrowLeft } from "react-icons/bs";
import { Col, Row } from "reactstrap";
import BackButton from "../Components/BackButton";

export default function CompHeader({ children, header }) {
  return (
    <>
      <div className="p-3">
        <BackButton headingText={header}/>
      </div>
    </>
  );
}
