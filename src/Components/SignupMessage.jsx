import { useNavigate } from "react-router-dom";
import { Col, Row } from "reactstrap";
// import logo from "../assets/images/wenyfour-black.PNG";
export default function Settings() {
  const navigate = useNavigate();

  return (
    <>
      <div className="text-center mt-5">
        <img
          src="https://res.cloudinary.com/dx5ilizca/image/upload/v1700895319/Galaxy__2_-removebg-preview_w1jyje.png"
          alt="Wenyfour logo"
          style={{ width: 200 }}
        />
      </div>
      {/* <CompHeader header={"Verify your email"}> */}
      <h4
        className="page_title text-center mt-4 m-0"
        style={{ fontWeight: 900, fontSize: 40 }}
      >
        Verify your email
      </h4>
      <Row className="m-0">
        <Col md={4}></Col>
        <Col md={4}>
          <div className="mt-3 text-center">
            <p className="m-0" style={{ fontWeight: "" }}>
              Registration successful! Check your email <b>inbox or spam</b> for
              a confirmation link, the link will be valid for only <b>1 hour</b>{" "}
              Welcome to Wenyfour!
            </p>

            <button
              className="mt-4 app_button"
              onClick={() => navigate("/auth")}
            >
              Login here
            </button>
          </div>
        </Col>
        <Col md={4}></Col>
      </Row>
    </>
  );
}
