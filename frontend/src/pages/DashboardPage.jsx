import { useAuth } from "../context/AuthContext";
import { useState, useEffect } from "react";
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
  Card,
  CardHeader,
  CardBody,
  SimpleGrid,
  Badge,
  useToast,
  Spinner,
  Alert,
  AlertIcon,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getTransactionAnalytics, getAccounts } from "../api/transactions";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const bg = useColorModeValue("gray.50", "gray.800");
  const cardBg = useColorModeValue("white", "gray.700");
  
  const [analytics, setAnalytics] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Show loading state while authentication is being checked
  if (loading) {
    return (
      <Box minH="100vh" bg={bg}>
        <Navbar />
        <Flex justify="center" align="center" minH="80vh">
          <Spinner size="xl" />
        </Flex>
      </Box>
    );
  }

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setAnalyticsLoading(true);
        const [analyticsData, accountsData] = await Promise.all([
          getTransactionAnalytics(),
          getAccounts()
        ]);
        setAnalytics(analyticsData);
        setAccounts(accountsData.results || accountsData);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setError("Failed to load dashboard data");
      } finally {
        setAnalyticsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  };

  if (analyticsLoading) {
    return (
      <Box minH="100vh" bg={bg}>
        <Navbar />
        <Container maxW="container.xl" pt="6rem" pb={8}>
          <Flex justify="center" align="center" minH="60vh">
            <Spinner size="xl" />
          </Flex>
        </Container>
      </Box>
    );
  }

  if (error) {
    return (
      <Box minH="100vh" bg={bg}>
        <Navbar />
        <Container maxW="container.xl" pt="6rem" pb={8}>
          <Alert status="error" mb={4}>
            <AlertIcon />
            {error}
          </Alert>
        </Container>
      </Box>
    );
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
          <Flex gap={3}>
            <Button
              colorScheme="blue"
              onClick={() => navigate("/transactions")}
            >
              Add Transaction
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/settings")}
            >
              Settings
            </Button>
          </Flex>
        </Flex>

        {/* Financial Overview */}
        <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={6} mb={8}>
          <Stat
            px={6}
            py={4}
            bg={cardBg}
            shadow="md"
            rounded="lg"
          >
            <StatLabel>Total Income</StatLabel>
            <StatNumber color="green.500">
              {formatCurrency(analytics?.total_income)}
            </StatNumber>
            <StatHelpText>This month</StatHelpText>
          </Stat>

          <Stat
            px={6}
            py={4}
            bg={cardBg}
            shadow="md"
            rounded="lg"
          >
            <StatLabel>Total Expenses</StatLabel>
            <StatNumber color="red.500">
              {formatCurrency(analytics?.total_expenses)}
            </StatNumber>
            <StatHelpText>This month</StatHelpText>
          </Stat>

          <Stat
            px={6}
            py={4}
            bg={cardBg}
            shadow="md"
            rounded="lg"
          >
            <StatLabel>Net Worth</StatLabel>
            <StatNumber color={analytics?.net_worth >= 0 ? "green.500" : "red.500"}>
              {formatCurrency(analytics?.net_worth)}
            </StatNumber>
            <StatHelpText>Income - Expenses</StatHelpText>
          </Stat>
        </Grid>

        {/* Accounts Overview */}
        {accounts.length > 0 && (
          <Card mb={8} bg={cardBg}>
            <CardHeader>
              <Heading size="md">Your Accounts</Heading>
            </CardHeader>
            <CardBody>
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                {accounts.map((account) => (
                  <Box key={account.id} p={4} border="1px" borderColor="gray.200" rounded="md">
                    <Text fontWeight="bold">{account.name}</Text>
                    <Text fontSize="sm" color="gray.500" mb={2}>
                      {account.account_type.replace('_', ' ').toUpperCase()}
                    </Text>
                    <Text fontSize="lg" fontWeight="bold">
                      {account.balance_display}
                    </Text>
                  </Box>
                ))}
              </SimpleGrid>
            </CardBody>
          </Card>
        )}

        {/* Category Breakdown */}
        {analytics?.category_breakdown?.length > 0 && (
          <Card mb={8} bg={cardBg}>
            <CardHeader>
              <Heading size="md">Spending by Category</Heading>
            </CardHeader>
            <CardBody>
              <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={4}>
                {analytics.category_breakdown.slice(0, 6).map((category) => (
                  <Flex key={category.category_id} justify="space-between" align="center" p={3} border="1px" borderColor="gray.200" rounded="md">
                    <Box>
                      <Text fontWeight="medium">{category.category__name || 'Uncategorized'}</Text>
                      <Text fontSize="sm" color="gray.500">
                        {category.transaction_count} transactions
                      </Text>
                    </Box>
                    <Box textAlign="right">
                      <Text fontWeight="bold">{formatCurrency(category.total_amount)}</Text>
                      <Badge colorScheme="blue" size="sm">
                        {category.percentage?.toFixed(1)}%
                      </Badge>
                    </Box>
                  </Flex>
                ))}
              </Grid>
            </CardBody>
          </Card>
        )}

        {/* Recent Transactions */}
        {analytics?.recent_transactions?.length > 0 && (
          <Card mb={8} bg={cardBg}>
            <CardHeader>
              <Flex justify="space-between" align="center">
                <Heading size="md">Recent Transactions</Heading>
                <Button size="sm" variant="ghost" onClick={() => navigate("/transactions")}>
                  View All
                </Button>
              </Flex>
            </CardHeader>
            <CardBody>
              {analytics.recent_transactions.map((transaction) => (
                <Flex key={transaction.id} justify="space-between" align="center" py={3} borderBottom="1px" borderColor="gray.100">
                  <Box>
                    <Text fontWeight="medium">{transaction.description}</Text>
                    <Text fontSize="sm" color="gray.500">
                      {transaction.category_name} • {new Date(transaction.transaction_date).toLocaleDateString()}
                    </Text>
                  </Box>
                  <Text 
                    fontWeight="bold" 
                    color={transaction.transaction_type === 'income' ? 'green.500' : 'red.500'}
                  >
                    {transaction.transaction_type === 'income' ? '+' : '-'}{transaction.amount_display}
                  </Text>
                </Flex>
              ))}
            </CardBody>
          </Card>
        )}

        {/* Getting Started Section (shown when no data) */}
        {(!analytics || analytics.transaction_count === 0) && (
          <Box bg={cardBg} p={6} rounded="lg" shadow="md">
            <Heading size="md" mb={4}>
              Getting Started with FinMate
            </Heading>
            <Text mb={4} color="gray.600">
              Welcome to FinMate! Let's set up your financial tracking system:
            </Text>
            <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={6}>
              <Box>
                <Text fontWeight="bold" mb={2}>📊 1. Add Your Accounts</Text>
                <Text fontSize="sm" color="gray.600" mb={3}>
                  Set up your bank accounts, credit cards, and cash accounts
                </Text>
                <Button size="sm" colorScheme="blue" onClick={() => navigate("/accounts")}>
                  Add Account
                </Button>
              </Box>
              <Box>
                <Text fontWeight="bold" mb={2}>💰 2. Record Transactions</Text>
                <Text fontSize="sm" color="gray.600" mb={3}>
                  Start logging your income and expenses to track your spending
                </Text>
                <Button size="sm" colorScheme="green" onClick={() => navigate("/transactions")}>
                  Add Transaction
                </Button>
              </Box>
              <Box>
                <Text fontWeight="bold" mb={2}>📈 3. Set Budgets</Text>
                <Text fontSize="sm" color="gray.600" mb={3}>
                  Create monthly budgets for different spending categories
                </Text>
                <Button size="sm" colorScheme="purple" onClick={() => navigate("/budgets")}>
                  Create Budget
                </Button>
              </Box>
              <Box>
                <Text fontWeight="bold" mb={2}>🔒 4. Secure Your Account</Text>
                <Text fontSize="sm" color="gray.600" mb={3}>
                  Enable two-factor authentication for enhanced security
                </Text>
                <Button size="sm" colorScheme="orange" onClick={() => navigate("/settings")}>
                  Security Settings
                </Button>
              </Box>
            </Grid>
          </Box>
        )}
      </Container>
    </Box>
  );
}
