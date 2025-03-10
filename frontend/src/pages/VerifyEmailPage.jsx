import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { verifyEmail } from "../api/auth";
import {
  Box,
  Text,
  Spinner,
  Heading,
  Flex,
  useColorModeValue,
  Icon,
  Alert,
  AlertIcon,
  Progress,
} from "@chakra-ui/react";
import { CheckCircleIcon } from "@chakra-ui/icons";
import PageTransition from "../components/PageTransition";
import Navbar from "../components/Navbar";

export default function VerifyEmailPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [verificationStatus, setVerificationStatus] = useState("verifying"); // "verifying", "success", or "error"
  const [errorMessage, setErrorMessage] = useState("");
  const [redirectProgress, setRedirectProgress] = useState(0);

  useEffect(() => {
    async function verify() {
      try {
        await verifyEmail(token);
        setVerificationStatus("success");

        // Start redirect countdown
        let progress = 0;
        const interval = setInterval(() => {
          progress += 4; // Increases by 4% every 200ms
          setRedirectProgress(progress);

          if (progress >= 100) {
            clearInterval(interval);
            navigate("/login");
          }
        }, 200); // Total time: ~5 seconds (200ms × 25 steps)

        // Cleanup interval if component unmounts
        return () => clearInterval(interval);
      } catch (error) {
        setVerificationStatus("error");
        setErrorMessage(
          error?.response?.data?.message ||
            error?.message ||
            "Verification failed. Please try again or contact support."
        );
      }
    }

    verify();
  }, [token, navigate]);

  return (
    <Flex
      minH="100vh"
      direction="column"
      bg={useColorModeValue("gray.50", "gray.800")}
      py={12}
    >
      <Navbar />
      <PageTransition>
        <Flex align="center" justify="center" grow={1} p={8}>
          <Box
            p={8}
            maxW="md"
            w="full"
            bg={useColorModeValue("white", "gray.700")}
            rounded="lg"
            boxShadow="lg"
            textAlign="center"
          >
            {verificationStatus === "verifying" && (
              <>
                <Spinner size="xl" mb={4} color="brand.500" />
                <Heading as="h2" size="xl" mb={4}>
                  Verifying Your Email
                </Heading>
                <Text fontSize="lg">
                  Please wait while we verify your email address...
                </Text>
              </>
            )}

            {verificationStatus === "success" && (
              <>
                <Icon
                  as={CheckCircleIcon}
                  w={16}
                  h={16}
                  color="green.500"
                  mb={4}
                />
                <Heading as="h2" size="xl" mb={4}>
                  Email Verified!
                </Heading>
                <Text fontSize="lg" mb={6}>
                  Your email has been successfully verified. You can now access
                  all features of FinMate.
                </Text>
                <Text
                  fontSize="md"
                  color={useColorModeValue("gray.500", "gray.400")}
                  mb={4}
                >
                  Redirecting you to login in{" "}
                  {Math.ceil((100 - redirectProgress) / 20)} seconds...
                </Text>
                <Progress
                  value={redirectProgress}
                  colorScheme="green"
                  size="sm"
                  borderRadius="full"
                />
              </>
            )}

            {verificationStatus === "error" && (
              <Alert
                status="error"
                variant="subtle"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                textAlign="center"
                borderRadius="md"
              >
                <AlertIcon boxSize="40px" mr={0} mb={4} />
                <Heading as="h2" size="lg" mb={2}>
                  Verification Failed
                </Heading>
                <Text fontSize="md" mb={4}>
                  {errorMessage}
                </Text>
                <Text
                  fontSize="sm"
                  color={useColorModeValue("gray.500", "gray.400")}
                >
                  You can try again by clicking the link in your email or
                  contact support for assistance.
                </Text>
              </Alert>
            )}
          </Box>
        </Flex>
      </PageTransition>
    </Flex>
  );
}
