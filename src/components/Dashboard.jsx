import { useState, useEffect } from "react";
import { Button, Offcanvas, Nav } from "react-bootstrap";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import BlackjackTable from "./BlackjackTable";
import { db } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import "../styles/Dashboard.css";

export default function Dashboard() {
  const [showSidebar, setShowSidebar] = useState(false);
  const { currentUser, logout, balance, setBalance } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await logout();
      navigate("/login");
    } catch {
      alert("Failed to log out");
    }
  }

  useEffect(() => {
    const fetchBalance = async () => {
      const ref = doc(db, "users", currentUser.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setBalance(snap.data().balance || 0);
      }
    };
    if (currentUser) fetchBalance();
  }, [currentUser]);

  const handleDeposit = async () => {
    const input = prompt("Enter deposit amount:");
    const amount = parseFloat(input);
    if (isNaN(amount) || amount <= 0) return alert("Invalid amount");

    const userRef = doc(db, "users", currentUser.uid);
    const snap = await getDoc(userRef);
    const current = snap.data().balance || 0;
    await updateDoc(userRef, { balance: current + amount });
    setBalance(current + amount);
  };

  const handleWithdraw = async () => {
    const input = prompt("Enter withdrawal amount:");
    const amount = parseFloat(input);
    if (isNaN(amount) || amount <= 0) return alert("Invalid amount");

    const userRef = doc(db, "users", currentUser.uid);
    const snap = await getDoc(userRef);
    const current = snap.data().balance || 0;
    if (amount > current) return alert("Insufficient funds");

    await updateDoc(userRef, { balance: current - amount });
    setBalance(current - amount);
  };

  return (
    <>
      {!showSidebar && (
        <Button
          variant="dark"
          onClick={() => setShowSidebar(true)}
          className="menu-button"
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
        className="sidebar-canvas"
      >
        <Offcanvas.Header closeButton closeVariant="white">
          <Offcanvas.Title className="sidebar-title">
            Bit Jack
          </Offcanvas.Title>
        </Offcanvas.Header>

        <Offcanvas.Body className="sidebar-body">
          <div>
            <div className="mb-3">
              Logged in as <strong className="email-label">{currentUser?.email}</strong>
            </div>
            <div className="mb-4">
              Balance: <strong className="balance-label">${balance.toFixed(2)}</strong>
            </div>
            <Nav className="flex-column gap-3">
              <Button variant="outline-secondary" onClick={handleDeposit}>
                Deposit
              </Button>
              <Button variant="outline-secondary" onClick={handleWithdraw}>
                Withdraw
              </Button>
            </Nav>
          </div>
          <div className="d-flex flex-column gap-2">
            <Button
              variant="outline-light"
              onClick={() => navigate("/update-profile")}
              className="btn-update-profile"
            >
              Update Profile
            </Button>
            <Button
              variant="outline-danger"
              onClick={handleLogout}
              className="w-100 btn-logout"
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