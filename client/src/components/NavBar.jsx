import { useContext } from "react";
import { Container, Nav, Navbar, Stack } from "react-bootstrap";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import Notifications from "./Chat/Notifications";
import ecc from "../lib/ecc.js";

const NavBar = () => {
  const { user, logoutUser } = useContext(AuthContext);

  const generateNewKeys = () => {
    const eccKeys = ecc.generateKeys();

    downloadKey(
      eccKeys.privateKey.toString(16),
      `${user._id}_ecc_private_key.ecprv`
    );
    downloadKey(
      JSON.stringify(eccKeys.publicKey.map((k) => k.toString(16))),
      `${user._id}_ecc_public_key.ecpub`
    );
  };

  const downloadKey = (key, filename) => {
    const element = document.createElement("a");
    const file = new Blob([key], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
  };

  return (
    <Navbar bg="dark" className="mb-4" style={{ height: "3.75rem" }}>
      <Container>
        <h2>
          <Link to="/" className="link-light text-decoration-none">
            ChattApp
          </Link>
        </h2>
        {user && <span className="text-warning">Logged in as {user.name}</span>}
        <Nav>
          <Stack direction="horizontal" gap={3}>
            {!user && (
              <>
                <Link to="/login" className="link-light text-decoration-none">
                  Login
                </Link>
                <Link
                  to="/register"
                  className="link-light text-decoration-none"
                >
                  Register
                </Link>
              </>
            )}

            {user && (
              <>
                <button className="text-white mr-4" onClick={generateNewKeys}>
                  Generate E2E Keys
                </button>
                <Notifications />
                <Link
                  onClick={() => logoutUser()}
                  to="/login"
                  className="link-light text-decoration-none"
                >
                  Logout
                </Link>
              </>
            )}
          </Stack>
        </Nav>
      </Container>
    </Navbar>
  );
};

export default NavBar;
