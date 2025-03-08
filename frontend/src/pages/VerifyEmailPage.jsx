import {
  Center,
  Heading,
  Button,
  FormControl,
  Flex,
  Stack,
  HStack,
  Box,
  useColorModeValue,
} from "@chakra-ui/react";
import { PinInput, PinInputField } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle";

export default function VerifyEmailPage() {
  const navigate = useNavigate();

  return (
    <Flex minH="100vh" align="center" justify="center" bg={useColorModeValue("gray.50", "gray.800")}>
      <Box position="absolute" top="1rem" right="1rem">
        <ThemeToggle />
      </Box>
      <Stack
        spacing={4}
        w="full"
        maxW="sm"
        bg={useColorModeValue("white", "gray.700")}
        rounded="xl"
        boxShadow="lg"
        p={6}
        my={10}
      >
        <Center>
          <Heading fontSize="2xl">Verify your Email</Heading>
        </Center>
        <Center fontSize="md" fontWeight="bold">
          We have sent a code to your email
        </Center>
        <FormControl>
          <Center>
            <HStack>
              <PinInput>
                <PinInputField />
                <PinInputField />
                <PinInputField />
                <PinInputField />
              </PinInput>
            </HStack>
          </Center>
        </FormControl>
        <Stack spacing={6}>
          <Button
            bg="brand.500"
            color="white"
            _hover={{ bg: "brand.600" }}
            onClick={() => navigate("/login")}
          >
            Verify
          </Button>
        </Stack>
      </Stack>
    </Flex>
  );
}
