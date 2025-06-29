import { useState, useEffect } from "react";
import {
  Flex,
  Box,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  HStack,
  InputRightElement,
  Stack,
  Button,
  Heading,
  Text,
  Link,
  useToast,
  useColorModeValue,
} from "@chakra-ui/react";
import { ViewIcon, ViewOffIcon } from "@chakra-ui/icons";
import { useNavigate } from "react-router-dom";
import PageTransition from "../components/PageTransition";
import Navbar from "../components/Navbar";
import { signup } from "../api/auth";
import { useAuth } from "../context/AuthContext";

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (!authLoading && user) {
      navigate("/dashboard");
    }
  }, [user, authLoading, navigate]);

  const handleSignup = async () => {
    setLoading(true);
    try {
      const name = `${firstName} ${lastName}`.trim();

      if (!name) {
        throw new Error("First name is required");
      }
      await signup({ name, email, password });
      toast({
        title: "Signup Successful",
        description:
          "A verification email has been sent to your email address.",
        status: "success",
        duration: 5000,
      });
      navigate("/login");
    } catch (error) {
      let errorMessage = "An unexpected error occurred";

      // Check if error object directly contains field errors
      if (error.email) {
        errorMessage = Array.isArray(error.email)
          ? error.email[0]
          : error.email;
      } else if (error.password) {
        errorMessage = Array.isArray(error.password)
          ? error.password[0]
          : error.password;
      } else if (error.name) {
        errorMessage = Array.isArray(error.name) ? error.name[0] : error.name;
      } else if (error.message) {
        errorMessage = error.message;
      } else if (error.detail) {
        errorMessage = error.detail;
      } else {
        // Try to find any error message
        const firstField = Object.keys(error)[0];
        if (
          firstField &&
          error[firstField] &&
          Array.isArray(error[firstField]) &&
          error[firstField].length > 0
        ) {
          errorMessage = `${firstField}: ${error[firstField][0]}`;
        }
      }
      toast({
        title: "Signup Failed",
        description: errorMessage,
        status: "error",
        duration: 3000,
      });
      console.error("Signup error:", error);
    }
    setLoading(false);
  };

  if (authLoading) {
    return <Box>Loading...</Box>;
  }

  return (
    <Flex
      minH="100vh"
      align="center"
      justify="center"
      bg={useColorModeValue("gray.50", "gray.800")}
    >
      <Navbar />
      <PageTransition>
        <Stack spacing={8} mx="auto" maxW="lg" py={12} px={6}>
          <Stack align="center">
            <Heading fontSize="4xl">Sign up</Heading>
          </Stack>
          <Box
            rounded="lg"
            bg={useColorModeValue("white", "gray.700")}
            boxShadow="lg"
            p={8}
          >
            <Stack spacing={4}>
              <HStack>
                <Box>
                  <FormControl id="firstName" isRequired>
                    <FormLabel>First Name</FormLabel>
                    <Input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </FormControl>
                </Box>
                <Box>
                  <FormControl id="lastName">
                    <FormLabel>Last Name</FormLabel>
                    <Input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </FormControl>
                </Box>
              </HStack>
              <FormControl id="email" isRequired>
                <FormLabel>Email</FormLabel>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </FormControl>
              <FormControl id="password" isRequired>
                <FormLabel>Password</FormLabel>
                <InputGroup>
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <InputRightElement h="full">
                    <Button
                      variant="ghost"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <ViewIcon /> : <ViewOffIcon />}
                    </Button>
                  </InputRightElement>
                </InputGroup>
              </FormControl>
              <Stack spacing={6} pt={2}>
                <Button
                  size="lg"
                  isLoading={loading}
                  bg="brand.500"
                  color="white"
                  _hover={{ bg: "brand.600" }}
                  onClick={handleSignup}
                >
                  Sign up
                </Button>
              </Stack>
              <Text align="center">
                Already a user?{" "}
                <Link color="brand.500" onClick={() => navigate("/login")}>
                  Login
                </Link>
              </Text>
            </Stack>
          </Box>
        </Stack>
      </PageTransition>
    </Flex>
  );
}
