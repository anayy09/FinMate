import { Box, Flex, Button, Link, Spacer, useColorModeValue, useToast } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; // Import AuthContext
import { logout } from "../api/auth";
import ThemeToggle from "./ThemeToggle";

export default function Navbar() {
  const { user, setUser } = useAuth(); // Get user state from AuthContext
  const navigate = useNavigate();
  const toast = useToast();
  const bg = useColorModeValue("white", "gray.800");
  const color = useColorModeValue("gray.800", "white");

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null); // Clear user data
      toast({ title: "Logged out successfully", status: "success", duration: 3000 });
      navigate("/login");
    } catch (error) {
      toast({ title: "Logout failed", description: error.message, status: "error", duration: 3000 });
    }
  };

  return (
    <Box bg={bg} px={6} py={4} boxShadow="md" position="fixed" width="100%" top={0} zIndex={10}>
      <Flex align="center">
        <Link fontSize="xl" fontWeight="bold" onClick={() => navigate("/")} color={color} _hover={{ textDecoration: "none" }}>
          FinMate
        </Link>
        <Spacer />
        <Flex gap={4}>
          {user ? (
            <>
              <Button variant="ghost" onClick={handleLogout}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => navigate("/login")}>
                Login
              </Button>
              <Button colorScheme="green" onClick={() => navigate("/signup")}>
                Sign Up
              </Button>
            </>
          )}
          <ThemeToggle />
        </Flex>
      </Flex>
    </Box>
  );
}
