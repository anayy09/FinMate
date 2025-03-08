import { useState } from "react";
import {
  Flex,
  Box,
  FormControl,
  FormLabel,
  Input,
  Checkbox,
  Stack,
  Button,
  Heading,
  Text,
  Link,
  useDisclosure,
  useToast,
  useColorModeValue,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import ForgotPasswordModal from "../components/ForgotPasswordModal";
import PageTransition from "../components/PageTransition";
import Navbar from "../components/Navbar";
import { login } from "../api/auth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const handleLogin = async () => {
    setLoading(true);
    try {
      await login({ email, password });
      toast({ title: "Login Successful", status: "success", duration: 3000 });
      navigate("/dashboard");
    } catch (error) {
      toast({ title: "Login Failed", description: error.message, status: "error", duration: 3000 });
    }
    setLoading(false);
  };

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
          <Heading fontSize="4xl">Sign in</Heading>
        </Stack>
          <Box
            rounded="lg"
            boxShadow="lg"
            p={8}
            bg={useColorModeValue("white", "gray.700")}
          >
          <Stack spacing={4}>
            <FormControl id="email">
              <FormLabel>Email</FormLabel>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </FormControl>
            <FormControl id="password">
              <FormLabel>Password</FormLabel>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </FormControl>
            <Stack spacing={6}>
                <Stack direction="row" align="start" justify="space-between">
              <Checkbox>Remember me</Checkbox>
                  <Text color="brand.500" cursor="pointer" onClick={onOpen}>
                    Forgot password?
                  </Text>
                </Stack>
              <Button
              isLoading={loading}
                  bg="brand.500"
                  color="white"
                  _hover={{ bg: "brand.600" }}
                  onClick={handleLogin}
                >
                Sign in
              </Button>
            </Stack>
              <Text align="center">
                New User?{" "}
                <Link color="brand.500" onClick={() => navigate("/signup")}>
                  Sign up here
                </Link>
              </Text>
          </Stack>
        </Box>
      </Stack>
      </PageTransition>
      <ForgotPasswordModal isOpen={isOpen} onClose={onClose} />
    </Flex>
  );
}
