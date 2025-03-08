import { Box, Flex, Button, Link, Spacer, useColorModeValue } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";

export default function Navbar() {
  const navigate = useNavigate();
  const bg = useColorModeValue("white", "gray.800");
  const color = useColorModeValue("gray.800", "white");

  return (
    <Box bg={bg} px={6} py={4} boxShadow="md" position="fixed" width="100%" top={0} zIndex={10}>
      <Flex align="center">
        <Link fontSize="xl" fontWeight="bold" onClick={() => navigate("/")} color={color} _hover={{ textDecoration: "none" }}>
          FinMate
        </Link>
        <Spacer />
        <Flex gap={4}>
          <Button variant="ghost" onClick={() => navigate("/login")}>
            Login
          </Button>
          <Button colorScheme="green" onClick={() => navigate("/signup")}>
            Sign Up
          </Button>
          <ThemeToggle />
        </Flex>
      </Flex>
    </Box>
  );
}
