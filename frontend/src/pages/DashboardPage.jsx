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
  StatArrow,
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
  Select,
  VStack,
  HStack,
  Spacer,
  Icon,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
} from 'recharts';
import { FaWallet, FaUniversity, FaChartLine, FaPlus } from 'react-icons/fa';
import Navbar from "../components/Navbar";
import PlaidIntegration from "../components/PlaidIntegration";
import AIInsights from "../components/AIInsights";
import { getTransactionAnalytics, getAccounts } from "../api/transactions";
import api from "../api/auth";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658'];

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const bg = useColorModeValue("gray.50", "gray.800");
  const cardBg = useColorModeValue("white", "gray.700");
  
  const [analytics, setAnalytics] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const [showPlaidIntegration, setShowPlaidIntegration] = useState(false);

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
        const [analyticsData, accountsData, transactionsData] = await Promise.all([
          getTransactionAnalytics(),
          getAccounts(),
          api.get(`/api/transactions/?days=${selectedPeriod}`)
        ]);
        setAnalytics(analyticsData);
        setAccounts(accountsData.results || accountsData);
        setTransactions(transactionsData.data.results || transactionsData.data);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setError("Failed to load dashboard data");
      } finally {
        setAnalyticsLoading(false);
      }
    };

    fetchDashboardData();
  }, [selectedPeriod]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  };

  const prepareExpenseByCategory = () => {
    if (!transactions || transactions.length === 0) return [];
    
    const categoryExpenses = {};
    
    transactions
      .filter(transaction => transaction.transaction_type === 'expense')
      .forEach(transaction => {
        const categoryName = transaction.category?.name || 'Uncategorized';
        categoryExpenses[categoryName] = (categoryExpenses[categoryName] || 0) + parseFloat(transaction.amount);
      });

    return Object.entries(categoryExpenses).map(([name, value]) => ({
      name,
      value: parseFloat(value.toFixed(2)),
    }));
  };

  const prepareMonthlyTrend = () => {
    if (!transactions || transactions.length === 0) return [];
    
    const monthlyData = {};
    
    transactions.forEach(transaction => {
      const date = new Date(transaction.transaction_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { month: monthKey, income: 0, expenses: 0 };
      }
      
      if (transaction.transaction_type === 'income') {
        monthlyData[monthKey].income += parseFloat(transaction.amount);
      } else if (transaction.transaction_type === 'expense') {
        monthlyData[monthKey].expenses += parseFloat(transaction.amount);
      }
    });

    return Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));
  };

  const prepareWeeklySpending = () => {
    if (!transactions || transactions.length === 0) return [];
    
    const weeklyData = {};
    const now = new Date();
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dayKey = date.toISOString().split('T')[0];
      weeklyData[dayKey] = {
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        amount: 0,
      };
    }

    transactions
      .filter(transaction => transaction.transaction_type === 'expense')
      .forEach(transaction => {
        const dateKey = transaction.transaction_date;
        if (weeklyData[dateKey]) {
          weeklyData[dateKey].amount += parseFloat(transaction.amount);
        }
      });

    return Object.values(weeklyData).reverse();
  };

  const handleAccountsUpdated = (newAccounts) => {
    setAccounts(prev => [...prev, ...newAccounts]);
    // Refresh analytics after account update
    const fetchAnalytics = async () => {
      try {
        const analyticsData = await getTransactionAnalytics();
        setAnalytics(analyticsData);
      } catch (error) {
        console.error("Error refreshing analytics:", error);
      }
    };
    fetchAnalytics();
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
          <HStack spacing={4}>
            <Select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              width="200px"
              size="sm"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 3 months</option>
              <option value="365">Last year</option>
            </Select>
            <Button
              colorScheme="blue"
              leftIcon={<Icon as={FaUniversity} />}
              onClick={() => setShowPlaidIntegration(!showPlaidIntegration)}
              size="sm"
            >
              {showPlaidIntegration ? 'Hide' : 'Connect'} Bank
            </Button>
            <Button
              colorScheme="green"
              leftIcon={<Icon as={FaPlus} />}
              onClick={() => navigate("/transactions")}
              size="sm"
            >
              Add Transaction
            </Button>
          </HStack>
        </Flex>

        {/* Plaid Integration */}
        {showPlaidIntegration && (
          <Card mb={8} bg={cardBg}>
            <CardBody>
              <PlaidIntegration
                accounts={accounts}
                onAccountsUpdated={handleAccountsUpdated}
              />
            </CardBody>
          </Card>
        )}

        {/* Financial Overview */}
        <Grid templateColumns={{ base: "1fr", md: "repeat(4, 1fr)" }} gap={6} mb={8}>
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
            <StatHelpText>
              <StatArrow type="increase" />
              This month
            </StatHelpText>
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
            <StatHelpText>
              <StatArrow type="decrease" />
              This month
            </StatHelpText>
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

          <Stat
            px={6}
            py={4}
            bg={cardBg}
            shadow="md"
            rounded="lg"
          >
            <StatLabel>Total Balance</StatLabel>
            <StatNumber color="blue.500">
              <Icon as={FaWallet} mr={2} />
              {formatCurrency(accounts.reduce((sum, acc) => sum + parseFloat(acc.balance || 0), 0))}
            </StatNumber>
            <StatHelpText>
              Across {accounts.length} accounts
            </StatHelpText>
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
                    <HStack justify="space-between" mb={2}>
                      <Text fontWeight="bold">{account.name}</Text>
                      {account.plaid_account_id && (
                        <Badge colorScheme="green" size="sm">Connected</Badge>
                      )}
                    </HStack>
                    <Text fontSize="sm" color="gray.500" mb={2}>
                      {account.account_type.replace('_', ' ').toUpperCase()}
                    </Text>
                    <Text fontSize="lg" fontWeight="bold" color={parseFloat(account.balance) >= 0 ? "green.500" : "red.500"}>
                      {account.balance_display || formatCurrency(account.balance)}
                    </Text>
                  </Box>
                ))}
              </SimpleGrid>
            </CardBody>
          </Card>
        )}

        {/* Advanced Charts Section */}
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8} mb={8}>
          <Card>
            {/* Expenses by Category Pie Chart */}
            <CardHeader pb={2}>
              <Heading size="md">Expenses by Category</Heading>
            </CardHeader>
            <CardBody>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={prepareExpenseByCategory()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {prepareExpenseByCategory().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`$${value.toFixed(2)}`, 'Amount']} />
                </PieChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>

          <Card>
            {/* Monthly Income vs Expenses */}
            <CardHeader pb={2}>
              <Heading size="md">Monthly Trends</Heading>
            </CardHeader>
            <CardBody>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={prepareMonthlyTrend()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`$${value.toFixed(2)}`, 'Amount']} />
                  <Legend />
                  <Bar dataKey="income" fill="#48BB78" />
                  <Bar dataKey="expenses" fill="#F56565" />
                </BarChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>

          <Card>
            {/* Weekly Spending Pattern */}
            <CardHeader pb={2}>
              <Heading size="md">Weekly Spending</Heading>
            </CardHeader>
            <CardBody>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={prepareWeeklySpending()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`$${value.toFixed(2)}`, 'Amount']} />
                  <Area type="monotone" dataKey="amount" stroke="#8884d8" fill="#8884d8" />
                </AreaChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>

          <Card>
            {/* Spending Trends Line Chart */}
            <CardHeader pb={2}>
              <Heading size="md">Spending Trends</Heading>
            </CardHeader>
            <CardBody>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={prepareMonthlyTrend()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`$${value.toFixed(2)}`, 'Amount']} />
                  <Legend />
                  <Line type="monotone" dataKey="expenses" stroke="#F56565" strokeWidth={2} />
                  <Line type="monotone" dataKey="income" stroke="#48BB78" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* AI Insights Section */}
        <Box mb={8}>
          <AIInsights />
        </Box>

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
                <Button size="sm" colorScheme="orange" onClick={() => navigate("/profile")}>
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
