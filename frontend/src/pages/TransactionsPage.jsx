import { useState, useEffect } from "react";
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  IconButton,
  useColorModeValue,
  useToast,
  Spinner,
  Alert,
  AlertIcon,
  Flex,
  Input,
  Select,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  NumberInput,
  NumberInputField,
  Textarea,
  HStack,
  VStack,
} from "@chakra-ui/react";
import { EditIcon, DeleteIcon, AddIcon } from "@chakra-ui/icons";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getCategories,
  getAccounts,
} from "../api/transactions";

export default function TransactionsPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const bg = useColorModeValue("gray.50", "gray.800");
  const cardBg = useColorModeValue("white", "gray.700");
  
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Form state
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [formData, setFormData] = useState({
    account: '',
    category: '',
    amount: '',
    transaction_type: 'expense',
    description: '',
    notes: '',
    transaction_date: new Date().toISOString().split('T')[0],
    merchant_name: '',
    location: ''
  });
  
  // Filter state
  const [filters, setFilters] = useState({
    search: '',
    transaction_type: '',
    category: '',
    account: '',
    start_date: '',
    end_date: ''
  });
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  // Authentication check
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
  
  if (!user) {
    navigate("/login");
    return null;
  }
  
  useEffect(() => {
    fetchData();
  }, [filters]);
  
  const fetchData = async () => {
    try {
      setTransactionsLoading(true);
      const [transactionsData, categoriesData, accountsData] = await Promise.all([
        getTransactions(filters),
        getCategories(),
        getAccounts()
      ]);
      
      setTransactions(transactionsData.results || transactionsData);
      setCategories(categoriesData.results || categoriesData);
      setAccounts(accountsData.results || accountsData);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to load transactions");
      toast({
        title: "Error",
        description: "Failed to load transactions",
        status: "error",
        duration: 3000,
      });
    } finally {
      setTransactionsLoading(false);
    }
  };
  
  const handleSubmit = async () => {
    try {
      // Validate required fields
      if (!formData.account) {
        toast({
          title: "Error",
          description: "Please select an account",
          status: "error",
          duration: 3000,
        });
        return;
      }
      
      if (!formData.amount || formData.amount <= 0) {
        toast({
          title: "Error",
          description: "Please enter a valid amount",
          status: "error",
          duration: 3000,
        });
        return;
      }
      
      if (editingTransaction) {
        await updateTransaction(editingTransaction.id, formData);
        toast({
          title: "Success",
          description: "Transaction updated successfully",
          status: "success",
          duration: 3000,
        });
      } else {
        await createTransaction(formData);
        toast({
          title: "Success",
          description: "Transaction created successfully",
          status: "success",
          duration: 3000,
        });
      }
      
      onClose();
      resetForm();
      fetchData();
    } catch (error) {
      console.error("Error saving transaction:", error);
      
      // Better error handling for API responses
      let errorMessage = "Failed to save transaction";
      if (error.account) {
        errorMessage = Array.isArray(error.account) ? error.account[0] : error.account;
      } else if (error.description) {
        errorMessage = Array.isArray(error.description) ? error.description[0] : error.description;
      } else if (error.amount) {
        errorMessage = Array.isArray(error.amount) ? error.amount[0] : error.amount;
      } else if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        status: "error",
        duration: 5000,
      });
    }
  };
  
  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      account: transaction.account,
      category: transaction.category || '',
      amount: transaction.amount,
      transaction_type: transaction.transaction_type,
      description: transaction.description,
      notes: transaction.notes || '',
      transaction_date: transaction.transaction_date,
      merchant_name: transaction.merchant_name || '',
      location: transaction.location || ''
    });
    onOpen();
  };
  
  const handleDelete = async (transactionId) => {
    if (window.confirm("Are you sure you want to delete this transaction?")) {
      try {
        await deleteTransaction(transactionId);
        toast({
          title: "Success",
          description: "Transaction deleted successfully",
          status: "success",
          duration: 3000,
        });
        fetchData();
      } catch (error) {
        console.error("Error deleting transaction:", error);
        toast({
          title: "Error",
          description: "Failed to delete transaction",
          status: "error",
          duration: 3000,
        });
      }
    }
  };
  
  const resetForm = () => {
    setEditingTransaction(null);
    setFormData({
      account: accounts.length > 0 ? accounts[0].id : '',
      category: '',
      amount: '',
      transaction_type: 'expense',
      description: '',
      notes: '',
      transaction_date: new Date().toISOString().split('T')[0],
      merchant_name: '',
      location: ''
    });
  };
  
  const handleAddNew = () => {
    resetForm();
    onOpen();
  };
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  };
  
  const getTransactionTypeColor = (type) => {
    switch (type) {
      case 'income': return 'green';
      case 'expense': return 'red';
      case 'transfer': return 'blue';
      default: return 'gray';
    }
  };
  
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
        <Flex justify="space-between" align="center" mb={6}>
          <Box>
            <Heading size="lg" mb={2}>
              Transactions
            </Heading>
            <Text color="gray.500">
              Manage your income, expenses, and transfers
            </Text>
          </Box>
          <Button leftIcon={<AddIcon />} colorScheme="blue" onClick={handleAddNew} disabled={accounts.length === 0}>
            Add Transaction
          </Button>
        </Flex>

        {accounts.length === 0 && (
          <Alert status="warning" mb={6}>
            <AlertIcon />
            <Box>
              <Text fontWeight="bold">No accounts found</Text>
              <Text>You need to create an account before you can add transactions. Please contact support or refresh the page.</Text>
            </Box>
          </Alert>
        )}
        
        {/* Filters */}
        <Box bg={cardBg} p={4} rounded="lg" shadow="sm" mb={6}>
          <VStack spacing={4}>
            <HStack spacing={4} w="full">
              <Input
                placeholder="Search transactions..."
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
              />
              <Select
                placeholder="All Types"
                value={filters.transaction_type}
                onChange={(e) => setFilters({...filters, transaction_type: e.target.value})}
              >
                <option value="income">Income</option>
                <option value="expense">Expense</option>
                <option value="transfer">Transfer</option>
              </Select>
              <Select
                placeholder="All Categories"
                value={filters.category}
                onChange={(e) => setFilters({...filters, category: e.target.value})}
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
            </HStack>
            <HStack spacing={4} w="full">
              <Input
                type="date"
                placeholder="Start Date"
                value={filters.start_date}
                onChange={(e) => setFilters({...filters, start_date: e.target.value})}
              />
              <Input
                type="date"
                placeholder="End Date"
                value={filters.end_date}
                onChange={(e) => setFilters({...filters, end_date: e.target.value})}
              />
              <Select
                placeholder="All Accounts"
                value={filters.account}
                onChange={(e) => setFilters({...filters, account: e.target.value})}
              >
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </Select>
            </HStack>
          </VStack>
        </Box>
        
        {/* Transactions Table */}
        <Box bg={cardBg} rounded="lg" shadow="sm" overflow="hidden">
          {transactionsLoading ? (
            <Flex justify="center" align="center" p={8}>
              <Spinner size="lg" />
            </Flex>
          ) : transactions.length === 0 ? (
            <Box p={8} textAlign="center">
              <Text fontSize="lg" color="gray.500" mb={4}>
                No transactions found
              </Text>
              <Button colorScheme="blue" onClick={handleAddNew}>
                Add Your First Transaction
              </Button>
            </Box>
          ) : (
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Date</Th>
                  <Th>Description</Th>
                  <Th>Category</Th>
                  <Th>Account</Th>
                  <Th>Type</Th>
                  <Th isNumeric>Amount</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {transactions.map((transaction) => (
                  <Tr key={transaction.id}>
                    <Td>{new Date(transaction.transaction_date).toLocaleDateString()}</Td>
                    <Td>
                      <Text fontWeight="medium">{transaction.description}</Text>
                      {transaction.merchant_name && (
                        <Text fontSize="sm" color="gray.500">{transaction.merchant_name}</Text>
                      )}
                    </Td>
                    <Td>{transaction.category_name || 'Uncategorized'}</Td>
                    <Td>{transaction.account_name}</Td>
                    <Td>
                      <Badge colorScheme={getTransactionTypeColor(transaction.transaction_type)}>
                        {transaction.transaction_type}
                      </Badge>
                    </Td>
                    <Td isNumeric>
                      <Text 
                        color={transaction.transaction_type === 'income' ? 'green.500' : 'red.500'}
                        fontWeight="medium"
                      >
                        {transaction.transaction_type === 'income' ? '+' : '-'}
                        {formatCurrency(transaction.amount)}
                      </Text>
                    </Td>
                    <Td>
                      <HStack spacing={2}>
                        <IconButton
                          icon={<EditIcon />}
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(transaction)}
                        />
                        <IconButton
                          icon={<DeleteIcon />}
                          size="sm"
                          variant="ghost"
                          colorScheme="red"
                          onClick={() => handleDelete(transaction.id)}
                        />
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </Box>
        
        {/* Transaction Form Modal */}
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>
              {editingTransaction ? 'Edit Transaction' : 'Add New Transaction'}
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              <VStack spacing={4}>
                <HStack spacing={4} w="full">
                  <FormControl>
                    <FormLabel>Account</FormLabel>
                    <Select
                      value={formData.account}
                      onChange={(e) => setFormData({...formData, account: e.target.value})}
                      required
                    >
                      <option value="">Select Account</option>
                      {accounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.name}
                        </option>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl>
                    <FormLabel>Type</FormLabel>
                    <Select
                      value={formData.transaction_type}
                      onChange={(e) => setFormData({...formData, transaction_type: e.target.value})}
                    >
                      <option value="expense">Expense</option>
                      <option value="income">Income</option>
                      <option value="transfer">Transfer</option>
                    </Select>
                  </FormControl>
                </HStack>
                
                <HStack spacing={4} w="full">
                  <FormControl>
                    <FormLabel>Amount</FormLabel>
                    <NumberInput>
                      <NumberInputField
                        value={formData.amount}
                        onChange={(e) => setFormData({...formData, amount: e.target.value})}
                        placeholder="0.00"
                        required
                      />
                    </NumberInput>
                  </FormControl>
                  <FormControl>
                    <FormLabel>Date</FormLabel>
                    <Input
                      type="date"
                      value={formData.transaction_date}
                      onChange={(e) => setFormData({...formData, transaction_date: e.target.value})}
                      required
                    />
                  </FormControl>
                </HStack>
                
                <FormControl>
                  <FormLabel>Description</FormLabel>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Transaction description (optional)"
                  />
                </FormControl>
                
                <HStack spacing={4} w="full">
                  <FormControl>
                    <FormLabel>Category</FormLabel>
                    <Select
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                    >
                      <option value="">Auto-categorize</option>
                      {categories
                        .filter(cat => cat.category_type === formData.transaction_type)
                        .map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl>
                    <FormLabel>Merchant</FormLabel>
                    <Input
                      value={formData.merchant_name}
                      onChange={(e) => setFormData({...formData, merchant_name: e.target.value})}
                      placeholder="Store or merchant name"
                    />
                  </FormControl>
                </HStack>
                
                <FormControl>
                  <FormLabel>Notes</FormLabel>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    placeholder="Additional notes (optional)"
                    rows={3}
                  />
                </FormControl>
                
                <HStack spacing={4} w="full" pt={4}>
                  <Button variant="ghost" onClick={onClose} w="full">
                    Cancel
                  </Button>
                  <Button colorScheme="blue" onClick={handleSubmit} w="full">
                    {editingTransaction ? 'Update' : 'Create'} Transaction
                  </Button>
                </HStack>
              </VStack>
            </ModalBody>
          </ModalContent>
        </Modal>
      </Container>
    </Box>
  );
}
