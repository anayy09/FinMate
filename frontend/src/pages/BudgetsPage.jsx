import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  VStack,
  HStack,
  Text,
  Button,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Progress,
  Badge,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  FormControl,
  FormLabel,
  Input,
  Select,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  useToast,
  Spinner,
  Center,
  Grid,
  GridItem,
  IconButton,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useColorModeValue,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
} from '@chakra-ui/react';
import { AddIcon, EditIcon, DeleteIcon } from '@chakra-ui/icons';
import Navbar from '../components/Navbar';
import { getBudgets, createBudget, updateBudget } from '../api/transactions';
import { getCategories } from '../api/transactions';

const BudgetsPage = () => {
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState(null);
  const [budgetToDelete, setBudgetToDelete] = useState(null);
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  
  const toast = useToast();
  const cancelRef = React.useRef();
  
  const bg = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.700');

  // Form state
  const [formData, setFormData] = useState({
    category: '',
    amount: '',
    month: new Date().toISOString().slice(0, 7), // Current month in YYYY-MM format
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [budgetsData, categoriesData] = await Promise.all([
        getBudgets(),
        getCategories('expense')
      ]);
      
      setBudgets(budgetsData.results || budgetsData || []);
      setCategories(categoriesData.results || categoriesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load budgets data',
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
    setSubmitting(true);

    try {
      const budgetData = {
        category: parseInt(formData.category),
        amount: parseFloat(formData.amount),
        month: formData.month,
      };

      if (selectedBudget) {
        await updateBudget(selectedBudget.id, budgetData);
        toast({
          title: 'Success',
          description: 'Budget updated successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        await createBudget(budgetData);
        toast({
          title: 'Success',
          description: 'Budget created successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }

      fetchData();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving budget:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save budget',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (budget) => {
    setSelectedBudget(budget);
    setFormData({
      category: budget.category.toString(),
      amount: budget.amount.toString(),
      month: budget.month,
    });
    onOpen();
  };

  const handleDelete = (budget) => {
    setBudgetToDelete(budget);
    onDeleteOpen();
  };

  const confirmDelete = async () => {
    try {
      // Note: You'll need to implement deleteBudget in the API
      // await deleteBudget(budgetToDelete.id);
      toast({
        title: 'Info',
        description: 'Delete functionality will be implemented soon',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
      onDeleteClose();
      setBudgetToDelete(null);
    } catch (error) {
      console.error('Error deleting budget:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete budget',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleCloseModal = () => {
    setSelectedBudget(null);
    setFormData({
      category: '',
      amount: '',
      month: new Date().toISOString().slice(0, 7),
    });
    onClose();
  };

  const getBudgetStatus = (spent, budgetAmount) => {
    const percentage = (spent / budgetAmount) * 100;
    if (percentage >= 100) return { color: 'red', status: 'Over Budget' };
    if (percentage >= 80) return { color: 'orange', status: 'High Usage' };
    if (percentage >= 60) return { color: 'yellow', status: 'Moderate Usage' };
    return { color: 'green', status: 'On Track' };
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category?.name || 'Unknown Category';
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <Box pt="80px" bg={bg} minH="100vh">
          <Center h="50vh">
            <Spinner size="xl" color="blue.500" />
          </Center>
        </Box>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <Box pt="80px" bg={bg} minH="100vh">
        <Container maxW="7xl" py={8}>
          <VStack spacing={6} align="stretch">
            {/* Header */}
            <HStack justify="space-between" align="center">
              <VStack align="start" spacing={1}>
                <Heading size="lg">Budget Management</Heading>
                <Text color="gray.600">
                  Track your spending against monthly budgets
                </Text>
              </VStack>
              <Button
                leftIcon={<AddIcon />}
                colorScheme="blue"
                onClick={onOpen}
              >
                Create Budget
              </Button>
            </HStack>

            {/* Budget Overview Stats */}
            <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4}>
              <Card bg={cardBg}>
                <CardBody>
                  <Stat>
                    <StatLabel>Total Budgets</StatLabel>
                    <StatNumber>{budgets.length}</StatNumber>
                    <StatHelpText>Active this month</StatHelpText>
                  </Stat>
                </CardBody>
              </Card>
              <Card bg={cardBg}>
                <CardBody>
                  <Stat>
                    <StatLabel>Total Budgeted</StatLabel>
                    <StatNumber>
                      ${budgets.reduce((sum, budget) => sum + parseFloat(budget.amount || 0), 0).toFixed(2)}
                    </StatNumber>
                    <StatHelpText>This month</StatHelpText>
                  </Stat>
                </CardBody>
              </Card>
              <Card bg={cardBg}>
                <CardBody>
                  <Stat>
                    <StatLabel>Total Spent</StatLabel>
                    <StatNumber>
                      ${budgets.reduce((sum, budget) => sum + parseFloat(budget.spent || 0), 0).toFixed(2)}
                    </StatNumber>
                    <StatHelpText>This month</StatHelpText>
                  </Stat>
                </CardBody>
              </Card>
              <Card bg={cardBg}>
                <CardBody>
                  <Stat>
                    <StatLabel>Remaining</StatLabel>
                    <StatNumber>
                      ${(budgets.reduce((sum, budget) => sum + parseFloat(budget.amount || 0), 0) - 
                         budgets.reduce((sum, budget) => sum + parseFloat(budget.spent || 0), 0)).toFixed(2)}
                    </StatNumber>
                    <StatHelpText>
                      <StatArrow type="increase" />
                      Available to spend
                    </StatHelpText>
                  </Stat>
                </CardBody>
              </Card>
            </Grid>

            {/* Budget Cards */}
            {budgets.length === 0 ? (
              <Card bg={cardBg}>
                <CardBody>
                  <Center py={8}>
                    <VStack spacing={4}>
                      <Text fontSize="lg" color="gray.500">
                        No budgets created yet
                      </Text>
                      <Text color="gray.400">
                        Create your first budget to start tracking your spending
                      </Text>
                      <Button colorScheme="blue" onClick={onOpen}>
                        Create Your First Budget
                      </Button>
                    </VStack>
                  </Center>
                </CardBody>
              </Card>
            ) : (
              <Grid templateColumns="repeat(auto-fill, minmax(350px, 1fr))" gap={6}>
                {budgets.map((budget) => {
                  const spent = parseFloat(budget.spent || 0);
                  const budgetAmount = parseFloat(budget.amount || 0);
                  const percentage = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0;
                  const status = getBudgetStatus(spent, budgetAmount);

                  return (
                    <Card key={budget.id} bg={cardBg}>
                      <CardHeader>
                        <HStack justify="space-between" align="start">
                          <VStack align="start" spacing={1}>
                            <Heading size="md">{getCategoryName(budget.category)}</Heading>
                            <Text color="gray.500" fontSize="sm">
                              {budget.month}
                            </Text>
                          </VStack>
                          <HStack spacing={2}>
                            <Badge colorScheme={status.color}>
                              {status.status}
                            </Badge>
                            <IconButton
                              icon={<EditIcon />}
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(budget)}
                            />
                            <IconButton
                              icon={<DeleteIcon />}
                              size="sm"
                              variant="ghost"
                              colorScheme="red"
                              onClick={() => handleDelete(budget)}
                            />
                          </HStack>
                        </HStack>
                      </CardHeader>
                      <CardBody pt={0}>
                        <VStack spacing={4} align="stretch">
                          <Progress
                            value={Math.min(percentage, 100)}
                            colorScheme={status.color}
                            size="lg"
                            hasStripe={percentage > 100}
                            isAnimated={percentage > 100}
                          />
                          <HStack justify="space-between">
                            <VStack align="start" spacing={0}>
                              <Text fontSize="sm" color="gray.500">Spent</Text>
                              <Text fontWeight="bold">${spent.toFixed(2)}</Text>
                            </VStack>
                            <VStack align="center" spacing={0}>
                              <Text fontSize="sm" color="gray.500">Progress</Text>
                              <Text fontWeight="bold">{percentage.toFixed(1)}%</Text>
                            </VStack>
                            <VStack align="end" spacing={0}>
                              <Text fontSize="sm" color="gray.500">Budget</Text>
                              <Text fontWeight="bold">${budgetAmount.toFixed(2)}</Text>
                            </VStack>
                          </HStack>
                          <VStack align="stretch" spacing={1}>
                            <Text fontSize="sm" color="gray.500">
                              Remaining: ${Math.max(0, budgetAmount - spent).toFixed(2)}
                            </Text>
                            {percentage > 100 && (
                              <Text fontSize="sm" color="red.500" fontWeight="medium">
                                Over budget by ${(spent - budgetAmount).toFixed(2)}
                              </Text>
                            )}
                          </VStack>
                        </VStack>
                      </CardBody>
                    </Card>
                  );
                })}
              </Grid>
            )}
          </VStack>
        </Container>

        {/* Create/Edit Budget Modal */}
        <Modal isOpen={isOpen} onClose={handleCloseModal} size="md">
          <ModalOverlay />
          <ModalContent>
            <form onSubmit={handleSubmit}>
              <ModalHeader>
                {selectedBudget ? 'Edit Budget' : 'Create Budget'}
              </ModalHeader>
              <ModalCloseButton />
              <ModalBody>
                <VStack spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>Category</FormLabel>
                    <Select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="Select category"
                    >
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Budget Amount</FormLabel>
                    <NumberInput
                      value={formData.amount}
                      onChange={(value) => setFormData({ ...formData, amount: value })}
                      min={0}
                      precision={2}
                    >
                      <NumberInputField placeholder="0.00" />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Month</FormLabel>
                    <Input
                      type="month"
                      value={formData.month}
                      onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                    />
                  </FormControl>
                </VStack>
              </ModalBody>
              <ModalFooter>
                <Button variant="ghost" mr={3} onClick={handleCloseModal}>
                  Cancel
                </Button>
                <Button
                  colorScheme="blue"
                  type="submit"
                  isLoading={submitting}
                  loadingText={selectedBudget ? "Updating..." : "Creating..."}
                >
                  {selectedBudget ? 'Update Budget' : 'Create Budget'}
                </Button>
              </ModalFooter>
            </form>
          </ModalContent>
        </Modal>

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          isOpen={isDeleteOpen}
          leastDestructiveRef={cancelRef}
          onClose={onDeleteClose}
        >
          <AlertDialogOverlay>
            <AlertDialogContent>
              <AlertDialogHeader fontSize="lg" fontWeight="bold">
                Delete Budget
              </AlertDialogHeader>
              <AlertDialogBody>
                Are you sure you want to delete this budget? This action cannot be undone.
              </AlertDialogBody>
              <AlertDialogFooter>
                <Button ref={cancelRef} onClick={onDeleteClose}>
                  Cancel
                </Button>
                <Button colorScheme="red" onClick={confirmDelete} ml={3}>
                  Delete
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>
      </Box>
    </>
  );
};

export default BudgetsPage;
