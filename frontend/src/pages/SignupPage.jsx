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
  } from "@chakra-ui/react";
  import { useState } from "react";
  import { ViewIcon, ViewOffIcon } from "@chakra-ui/icons";
  import { useNavigate } from "react-router-dom";
  
  export default function SignupPage() {
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();
  
    return (
      <Flex minH="100vh" align="center" justify="center">
        <Stack spacing={8} mx="auto" maxW="lg" py={12} px={6}>
          <Stack align="center">
            <Heading fontSize="4xl">Sign up</Heading>
          </Stack>
          <Box rounded="lg" bg="white" boxShadow="lg" p={8}>
            <Stack spacing={4}>
              <HStack>
                <Box>
                  <FormControl id="firstName" isRequired>
                    <FormLabel>First Name</FormLabel>
                    <Input type="text" />
                  </FormControl>
                </Box>
                <Box>
                  <FormControl id="lastName">
                    <FormLabel>Last Name</FormLabel>
                    <Input type="text" />
                  </FormControl>
                </Box>
              </HStack>
              <FormControl id="email" isRequired>
                <FormLabel>Email</FormLabel>
                <Input type="email" />
              </FormControl>
              <FormControl id="password" isRequired>
                <FormLabel>Password</FormLabel>
                <InputGroup>
                  <Input type={showPassword ? "text" : "password"} />
                  <InputRightElement h="full">
                    <Button variant="ghost" onClick={() => setShowPassword((prev) => !prev)}>
                      {showPassword ? <ViewIcon /> : <ViewOffIcon />}
                    </Button>
                  </InputRightElement>
                </InputGroup>
              </FormControl>
              <Stack spacing={6} pt={2}>
                <Button
                  size="lg"
                  bg="brand.500"
                  color="white"
                  _hover={{ bg: "brand.600" }}
                  onClick={() => navigate("/verify-email")}
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
      </Flex>
    );
  }
  