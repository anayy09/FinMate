import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/auth';
import {
  Box,
  Container,
  Heading,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Text,
  VStack,
  HStack,
  Card,
  CardHeader,
  CardBody,
  useToast,
  Spinner,
  Alert,
  AlertIcon,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Select,
  NumberInput,
  NumberInputField,
  Textarea,
  Flex,
  Spacer,
  Icon,
  useDisclosure,
  Switch,
} from '@chakra-ui/react';
import { FaPlus, FaEdit, FaTrash, FaCalendarAlt, FaRedo } from 'react-icons/fa';
import Navbar from '../components/Navbar';

const RecurringTransactionsPage = () => {
  const { user } = useAuth();
  const [recurringTransactions, setRecurringTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const [formData, setFormData] = useState({
    account: '',
    category: '',
    amount: '',
    transaction_type: 'expense',
    description: '',
    frequency: 'monthly',
    start_date: '',
    end_date: '',
    is_active: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [recurringRes, accountsRes, categoriesRes] = await Promise.all([
        api.get('/api/recurring-transactions/'),
        api.get('/api/accounts/'),
        api.get('/api/categories/'),
      ]);

      setRecurringTransactions(recurringRes.data.results || recurringRes.data);
      setAccounts(accountsRes.data.results || accountsRes.data);
      setCategories(categoriesRes.data.results || categoriesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load recurring transactions',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.account || !formData.amount || !formData.description) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        ...formData,
        amount: parseFloat(formData.amount),
        next_due_date: formData.start_date, // Initially set next_due_date to start_date
      };

      if (editingTransaction) {
        await api.put(`/api/recurring-transactions/${editingTransaction.id}/`, payload);
        toast({
          title: 'Success',
          description: 'Recurring transaction updated successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        await api.post('/api/recurring-transactions/', payload);
        toast({
          title: 'Success',
          description: 'Recurring transaction created successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }

      resetForm();
      onClose();
      fetchData();
    } catch (error) {
      console.error('Error saving recurring transaction:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to save recurring transaction';
      toast({
        title: 'Error',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      account: transaction.account.id,
      category: transaction.category?.id || '',
      amount: transaction.amount.toString(),
      transaction_type: transaction.transaction_type,
      description: transaction.description,
      frequency: transaction.frequency,
      start_date: transaction.start_date,
      end_date: transaction.end_date || '',
      is_active: transaction.is_active,
    });
    onOpen();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this recurring transaction?')) {
      return;
    }

    try {
      await api.delete(`/api/recurring-transactions/${id}/`);
      toast({
        title: 'Success',
        description: 'Recurring transaction deleted successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      fetchData();
    } catch (error) {
      console.error('Error deleting recurring transaction:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete recurring transaction',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleToggleActive = async (transaction) => {
    try {
      await api.patch(`/api/recurring-transactions/${transaction.id}/`, {
        is_active: !transaction.is_active,
      });
      toast({
        title: 'Success',
        description: `Recurring transaction ${!transaction.is_active ? 'activated' : 'deactivated'}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      fetchData();
    } catch (error) {
      console.error('Error updating recurring transaction:', error);
      toast({
        title: 'Error',
        description: 'Failed to update recurring transaction',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const resetForm = () => {
    setFormData({
      account: '',
      category: '',
      amount: '',
      transaction_type: 'expense',
      description: '',
      frequency: 'monthly',
      start_date: '',
      end_date: '',
      is_active: true,
    });
    setEditingTransaction(null);
  };

  const handleAddNew = () => {
    resetForm();
    onOpen();
  };

  const getFrequencyBadgeColor = (frequency) => {
    const colors = {
      daily: 'purple',
      weekly: 'blue',
      monthly: 'green',
      quarterly: 'orange',
      yearly: 'red',
    };
    return colors[frequency] || 'gray';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <Box minH="100vh" bg="gray.50">
        <Navbar />
        <Container maxW="7xl" pt="6rem" pb={8}>
          <VStack spacing={8} align="center">
            <Spinner size="xl" />
            <Text>Loading recurring transactions...</Text>
          </VStack>
        </Container>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg="gray.50">
      <Navbar />
      <Container maxW="7xl" pt="6rem" pb={8}>
        <VStack spacing={8} align="stretch">
          {/* Header */}
          <Flex align="center">
            <Box>
              <Heading size="lg" mb={2}>
                Recurring Transactions
              </Heading>
              <Text color="gray.600">
                Manage your subscriptions, bills, and recurring payments
              </Text>
            </Box>
            <Spacer />
            <Button
              colorScheme="blue"
              leftIcon={<Icon as={FaPlus} />}
              onClick={handleAddNew}
            >
              Add Recurring Transaction
            </Button>
          </Flex>

          {/* Statistics Cards */}
          <HStack spacing={6}>
            <Card flex={1}>
              <CardBody>
                <VStack spacing={2}>
                  <Icon as={FaRedo} size="lg" color="blue.500" />
                  <Text fontSize="2xl" fontWeight="bold">
                    {recurringTransactions.filter(t => t.is_active).length}
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    Active Recurring
                  </Text>
                </VStack>
              </CardBody>
            </Card>

            <Card flex={1}>
              <CardBody>
                <VStack spacing={2}>
                  <Icon as={FaCalendarAlt} size="lg" color="green.500" />
                  <Text fontSize="2xl" fontWeight="bold">
                    {formatCurrency(
                      recurringTransactions
                        .filter(t => t.is_active && t.transaction_type === 'expense')
                        .reduce((sum, t) => sum + parseFloat(t.amount), 0)
                    )}
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    Monthly Expenses
                  </Text>
                </VStack>
              </CardBody>
            </Card>

            <Card flex={1}>
              <CardBody>
                <VStack spacing={2}>
                  <Icon as={FaCalendarAlt} size="lg" color="purple.500" />
                  <Text fontSize="2xl" fontWeight="bold">
                    {formatCurrency(
                      recurringTransactions
                        .filter(t => t.is_active && t.transaction_type === 'income')
                        .reduce((sum, t) => sum + parseFloat(t.amount), 0)
                    )}
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    Monthly Income
                  </Text>
                </VStack>
              </CardBody>
            </Card>
          </HStack>

          {/* Recurring Transactions Table */}
          <Card>
            <CardHeader>
              <Heading size="md">Your Recurring Transactions</Heading>
            </CardHeader>
            <CardBody>
              {recurringTransactions.length > 0 ? (
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Description</Th>
                      <Th>Amount</Th>
                      <Th>Type</Th>
                      <Th>Frequency</Th>
                      <Th>Next Due</Th>
                      <Th>Account</Th>
                      <Th>Status</Th>
                      <Th>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {recurringTransactions.map((transaction) => (
                      <Tr key={transaction.id}>
                        <Td>
                          <VStack align="start" spacing={1}>
                            <Text fontWeight="medium">{transaction.description}</Text>
                            {transaction.category && (
                              <Badge colorScheme="blue" size="sm">
                                {transaction.category.name}
                              </Badge>
                            )}
                          </VStack>
                        </Td>
                        <Td>
                          <Text
                            fontWeight="bold"
                            color={transaction.transaction_type === 'income' ? 'green.500' : 'red.500'}
                          >
                            {transaction.transaction_type === 'income' ? '+' : '-'}
                            {formatCurrency(transaction.amount)}
                          </Text>
                        </Td>
                        <Td>
                          <Badge
                            colorScheme={transaction.transaction_type === 'income' ? 'green' : 'red'}
                          >
                            {transaction.transaction_type}
                          </Badge>
                        </Td>
                        <Td>
                          <Badge colorScheme={getFrequencyBadgeColor(transaction.frequency)}>
                            {transaction.frequency}
                          </Badge>
                        </Td>
                        <Td>{formatDate(transaction.next_due_date)}</Td>
                        <Td>{transaction.account?.name}</Td>
                        <Td>
                          <Switch
                            isChecked={transaction.is_active}
                            onChange={() => handleToggleActive(transaction)}
                            colorScheme="green"
                          />
                        </Td>
                        <Td>
                          <HStack spacing={2}>
                            <Button
                              size="sm"
                              leftIcon={<Icon as={FaEdit} />}
                              onClick={() => handleEdit(transaction)}
                              variant="outline"
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              leftIcon={<Icon as={FaTrash} />}
                              onClick={() => handleDelete(transaction.id)}
                              colorScheme="red"
                              variant="outline"
                            >
                              Delete
                            </Button>
                          </HStack>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              ) : (
                <Alert status="info">
                  <AlertIcon />
                  <Box>
                    <Text fontWeight="bold">No recurring transactions found</Text>
                    <Text fontSize="sm">
                      Add your first recurring transaction to track subscriptions and bills automatically.
                    </Text>
                  </Box>
                </Alert>
              )}
            </CardBody>
          </Card>
        </VStack>

        {/* Add/Edit Modal */}
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>
              {editingTransaction ? 'Edit Recurring Transaction' : 'Add Recurring Transaction'}
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              <form onSubmit={handleSubmit}>
                <VStack spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>Description</FormLabel>
                    <Input
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="e.g., Netflix Subscription"
                    />
                  </FormControl>

                  <HStack spacing={4} width="100%">
                    <FormControl isRequired>
                      <FormLabel>Amount</FormLabel>
                      <NumberInput min={0} precision={2}>
                        <NumberInputField
                          value={formData.amount}
                          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                          placeholder="0.00"
                        />
                      </NumberInput>
                    </FormControl>

                    <FormControl isRequired>
                      <FormLabel>Type</FormLabel>
                      <Select
                        value={formData.transaction_type}
                        onChange={(e) => setFormData({ ...formData, transaction_type: e.target.value })}
                      >
                        <option value="expense">Expense</option>
                        <option value="income">Income</option>
                      </Select>
                    </FormControl>
                  </HStack>

                  <HStack spacing={4} width="100%">
                    <FormControl isRequired>
                      <FormLabel>Account</FormLabel>
                      <Select
                        value={formData.account}
                        onChange={(e) => setFormData({ ...formData, account: e.target.value })}
                        placeholder="Select account"
                      >
                        {accounts.map((account) => (
                          <option key={account.id} value={account.id}>
                            {account.name} ({formatCurrency(account.balance)})
                          </option>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl>
                      <FormLabel>Category</FormLabel>
                      <Select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        placeholder="Select category"
                      >
                        {categories
                          .filter(cat => cat.category_type === formData.transaction_type || cat.category_type === 'transfer')
                          .map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                      </Select>
                    </FormControl>
                  </HStack>

                  <FormControl isRequired>
                    <FormLabel>Frequency</FormLabel>
                    <Select
                      value={formData.frequency}
                      onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="yearly">Yearly</option>
                    </Select>
                  </FormControl>

                  <HStack spacing={4} width="100%">
                    <FormControl isRequired>
                      <FormLabel>Start Date</FormLabel>
                      <Input
                        type="date"
                        value={formData.start_date}
                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel>End Date (Optional)</FormLabel>
                      <Input
                        type="date"
                        value={formData.end_date}
                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      />
                    </FormControl>
                  </HStack>

                  <FormControl display="flex" alignItems="center">
                    <FormLabel htmlFor="is-active" mb="0">
                      Active
                    </FormLabel>
                    <Switch
                      id="is-active"
                      isChecked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      colorScheme="green"
                    />
                  </FormControl>

                  <HStack spacing={4} width="100%" pt={4}>
                    <Button variant="outline" onClick={onClose} flex={1}>
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      colorScheme="blue"
                      isLoading={submitting}
                      loadingText="Saving..."
                      flex={1}
                    >
                      {editingTransaction ? 'Update' : 'Add'} Recurring Transaction
                    </Button>
                  </HStack>
                </VStack>
              </form>
            </ModalBody>
          </ModalContent>
        </Modal>
      </Container>
    </Box>
  );
};

export default RecurringTransactionsPage;
