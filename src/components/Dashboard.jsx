import { useState } from "react";
import { Button, Offcanvas, Nav } from "react-bootstrap";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import BlackjackTable from "./BlackjackTable";

export default function Dashboard() {
  const [showSidebar, setShowSidebar] = useState(false);
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await logout();
      navigate("/login");
    } catch {
      alert("Failed to log out");
    }
  }

  return (
    <>
      {!showSidebar && (
        <Button
          variant="dark"
          onClick={() => setShowSidebar(true)}
          style={{
            position: "fixed",
            top: "80px",
            left: "20px",
            zIndex: 1060,
            boxShadow: "0 0 15px #7f00ff",
            fontFamily: "Orbitron",
            color: "#fff",
            background: "rgba(0,0,0,0.85)",
            border: "1px solid #7f00ff",
            textShadow: "0 0 10px #e100ff",
          }}
        >
          ☰ Menu
        </Button>
      )}
      <Offcanvas
        show={showSidebar}
        onHide={() => setShowSidebar(false)}
        backdrop={false}
        scroll={true}
        placement="start"
        style={{
          top: "70px",
          height: "calc(100% - 70px)",
          zIndex: 1055,
          backgroundColor: "rgba(0, 0, 0, 0.95)",
          color: "#fff",
          boxShadow: "0 0 20px #7f00ff",
        }}
      >
        <Offcanvas.Header closeButton closeVariant="white">
          <Offcanvas.Title
            style={{
              fontFamily: "Orbitron",
              fontSize: "28px",
              color: "#ff00ff",
              textShadow: "0 0 10px #ff00ff, 0 0 25px #7f00ff",
            }}
          >
            Bit Jack
          </Offcanvas.Title>
        </Offcanvas.Header>

        <Offcanvas.Body
          style={{
            fontFamily: "Orbitron",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "100%",
          }}
        >
          <div>
            <div className="mb-3">
              Logged in as{" "}
              <strong style={{ color: "#ccc" }}>{currentUser?.email}</strong>
            </div>
            <div className="mb-4">
              Balance: <strong style={{ color: "#00ffcc" }}>$0.00</strong>
            </div>
            <Nav className="flex-column gap-3">
              <Button variant="outline-secondary" disabled>
                Deposit
              </Button>
              <Button variant="outline-secondary" disabled>
                Withdraw
              </Button>
            </Nav>
          </div>
          <div className="d-flex flex-column gap-2">
            <Button
              variant="outline-light"
              onClick={() => navigate("/update-profile")}
              style={{
                borderColor: "#ff00ff",
                color: "#ff00ff",
                textShadow: "0 0 5px #ff00ff",
              }}
            >
              Update Profile
            </Button>
            <Button
              variant="outline-danger"
              onClick={handleLogout}
              className="w-100"
              style={{
                textShadow: "0 0 5px #ff0000",
                borderColor: "#ff0044",
                color: "#ff0044",
              }}
            >
              Log Out
            </Button>
          </div>
        </Offcanvas.Body>
      </Offcanvas>
      <BlackjackTable />
    </>
  );
}
