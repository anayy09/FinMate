import { useAuth } from "../context/AuthContext";
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  Grid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  useColorModeValue,
  Container,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const bg = useColorModeValue("gray.50", "gray.800");
  const cardBg = useColorModeValue("white", "gray.700");

  // Show loading state while authentication is being checked
  if (loading) {
    return (
      <Box minH="100vh" bg={bg}>
        <Navbar />
        <Flex justify="center" align="center" minH="80vh">
          <Text>Loading...</Text>
        </Flex>
      </Box>
    );
  }

  // Redirect to login if user is not authenticated
  if (!user) {
    navigate("/login");
    return null;
  }

  return (
    <Box minH="100vh" bg={bg}>
      <Navbar />
      <Container maxW="container.xl" pt="6rem" pb={8}>
        <Flex justify="space-between" align="center" mb={8}>
          <Box>
            <Heading size="lg" mb={2}>
              Welcome back, {user.name}!
            </Heading>
            <Text color="gray.500">
              Here's what's happening with your finances today.
            </Text>
          </Box>
          <Button
            colorScheme="green"
            onClick={() => navigate("/settings")}
          >
            Settings
          </Button>
        </Flex>

        <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={6} mb={8}>
          <Stat
            px={6}
            py={4}
            bg={cardBg}
            shadow="md"
            rounded="lg"
          >
            <StatLabel>Total Balance</StatLabel>
            <StatNumber>$0.00</StatNumber>
            <StatHelpText>No transactions yet</StatHelpText>
          </Stat>

          <Stat
            px={6}
            py={4}
            bg={cardBg}
            shadow="md"
            rounded="lg"
          >
            <StatLabel>This Month's Spending</StatLabel>
            <StatNumber>$0.00</StatNumber>
            <StatHelpText>No expenses this month</StatHelpText>
          </Stat>

          <Stat
            px={6}
            py={4}
            bg={cardBg}
            shadow="md"
            rounded="lg"
          >
            <StatLabel>Savings Goal</StatLabel>
            <StatNumber>$0.00</StatNumber>
            <StatHelpText>Set your first goal</StatHelpText>
          </Stat>
        </Grid>

        <Box bg={cardBg} p={6} rounded="lg" shadow="md">
          <Heading size="md" mb={4}>
            Getting Started
          </Heading>
          <Text mb={4} color="gray.600">
            Welcome to FinMate! Your personal finance management system is ready to help you:
          </Text>
          <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={4}>
            <Box>
              <Text fontWeight="bold" mb={2}>📊 Track Expenses</Text>
              <Text fontSize="sm" color="gray.600">
                Log your daily transactions and categorize your spending
              </Text>
            </Box>
            <Box>
              <Text fontWeight="bold" mb={2}>💰 Set Budgets</Text>
              <Text fontSize="sm" color="gray.600">
                Create monthly budgets and get alerts when you overspend
              </Text>
            </Box>
            <Box>
              <Text fontWeight="bold" mb={2}>📈 View Analytics</Text>
              <Text fontSize="sm" color="gray.600">
                Visualize your spending patterns with charts and reports
              </Text>
            </Box>
            <Box>
              <Text fontWeight="bold" mb={2}>🔒 Secure & Private</Text>
              <Text fontSize="sm" color="gray.600">
                Your financial data is encrypted and secure with 2FA protection
              </Text>
            </Box>
          </Grid>
        </Box>
      </Container>
    </Box>
  );
}
