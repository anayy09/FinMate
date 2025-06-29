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
  Divider,
  SimpleGrid,
  Flex,
} from '@chakra-ui/react';
import { AddIcon, EditIcon, DeleteIcon, ExternalLinkIcon } from '@chakra-ui/icons';
import Navbar from '../components/Navbar';
import { getAccounts, createAccount, updateAccount, updateAccountBalance } from '../api/transactions';
import PlaidIntegration from '../components/PlaidIntegration';

const AccountsPage = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [accountToDelete, setAccountToDelete] = useState(null);
  const [balanceUpdateAccount, setBalanceUpdateAccount] = useState(null);
  const [newBalance, setNewBalance] = useState('');
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const { isOpen: isBalanceOpen, onOpen: onBalanceOpen, onClose: onBalanceClose } = useDisclosure();
  
  const toast = useToast();
  const cancelRef = React.useRef();
  
  const bg = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.700');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    account_type: '',
    balance: '',
  });

  const accountTypes = [
    { value: 'checking', label: 'Checking Account' },
    { value: 'savings', label: 'Savings Account' },
    { value: 'credit', label: 'Credit Card' },
    { value: 'investment', label: 'Investment Account' },
    { value: 'cash', label: 'Cash' },
    { value: 'other', label: 'Other' },
  ];

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const data = await getAccounts();
      setAccounts(data.results || data || []);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      toast({
        title: 'Error',
        description: 'Failed to load accounts',
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
      const accountData = {
        name: formData.name,
        account_type: formData.account_type,
        balance: parseFloat(formData.balance),
      };

      if (selectedAccount) {
        await updateAccount(selectedAccount.id, accountData);
        toast({
          title: 'Success',
          description: 'Account updated successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        await createAccount(accountData);
        toast({
          title: 'Success',
          description: 'Account created successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }

      fetchAccounts();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving account:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save account',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (account) => {
    setSelectedAccount(account);
    setFormData({
      name: account.name,
      account_type: account.account_type,
      balance: account.balance.toString(),
    });
    onOpen();
  };

  const handleDelete = (account) => {
    setAccountToDelete(account);
    onDeleteOpen();
  };

  const handleBalanceUpdate = (account) => {
    setBalanceUpdateAccount(account);
    setNewBalance(account.balance.toString());
    onBalanceOpen();
  };

  const confirmDelete = async () => {
    try {
      // Note: You'll need to implement deleteAccount in the API
      toast({
        title: 'Info',
        description: 'Delete functionality will be implemented soon',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
      onDeleteClose();
      setAccountToDelete(null);
    } catch (error) {
      console.error('Error deleting account:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete account',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const confirmBalanceUpdate = async () => {
    try {
      await updateAccountBalance(balanceUpdateAccount.id, parseFloat(newBalance));
      toast({
        title: 'Success',
        description: 'Account balance updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      fetchAccounts();
      onBalanceClose();
      setBalanceUpdateAccount(null);
      setNewBalance('');
    } catch (error) {
      console.error('Error updating balance:', error);
      toast({
        title: 'Error',
        description: 'Failed to update account balance',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleCloseModal = () => {
    setSelectedAccount(null);
    setFormData({
      name: '',
      account_type: '',
      balance: '',
    });
    onClose();
  };

  const getAccountTypeLabel = (type) => {
    const accountType = accountTypes.find(at => at.value === type);
    return accountType?.label || type;
  };

  const getAccountTypeColor = (type) => {
    const colors = {
      checking: 'blue',
      savings: 'green',
      credit: 'red',
      investment: 'purple',
      cash: 'orange',
      other: 'gray',
    };
    return colors[type] || 'gray';
  };

  const calculateNetWorth = () => {
    return accounts.reduce((total, account) => {
      const balance = parseFloat(account.balance || 0);
      // For credit cards, treat as negative (debt)
      return account.account_type === 'credit' ? total - balance : total + balance;
    }, 0);
  };

  const getTotalAssets = () => {
    return accounts
      .filter(account => account.account_type !== 'credit')
      .reduce((total, account) => total + parseFloat(account.balance || 0), 0);
  };

  const getTotalDebt = () => {
    return accounts
      .filter(account => account.account_type === 'credit')
      .reduce((total, account) => total + parseFloat(account.balance || 0), 0);
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
                <Heading size="lg">Account Management</Heading>
                <Text color="gray.600">
                  Manage your financial accounts and track balances
                </Text>
              </VStack>
              <HStack spacing={3}>
                {/* <PlaidIntegration onAccountConnected={fetchAccounts} /> */}
                <Button
                  leftIcon={<AddIcon />}
                  colorScheme="blue"
                  onClick={onOpen}
                >
                  Add Account
                </Button>
              </HStack>
            </HStack>

            {/* Account Overview Stats */}
            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
              <Card bg={cardBg}>
                <CardBody>
                  <Stat>
                    <StatLabel>Total Accounts</StatLabel>
                    <StatNumber>{accounts.length}</StatNumber>
                    <StatHelpText>Connected accounts</StatHelpText>
                  </Stat>
                </CardBody>
              </Card>
              <Card bg={cardBg}>
                <CardBody>
                  <Stat>
                    <StatLabel>Net Worth</StatLabel>
                    <StatNumber color={calculateNetWorth() >= 0 ? 'green.500' : 'red.500'}>
                      ${calculateNetWorth().toFixed(2)}
                    </StatNumber>
                    <StatHelpText>Assets minus debts</StatHelpText>
                  </Stat>
                </CardBody>
              </Card>
              <Card bg={cardBg}>
                <CardBody>
                  <Stat>
                    <StatLabel>Total Assets</StatLabel>
                    <StatNumber color="green.500">
                      ${getTotalAssets().toFixed(2)}
                    </StatNumber>
                    <StatHelpText>All positive balances</StatHelpText>
                  </Stat>
                </CardBody>
              </Card>
              <Card bg={cardBg}>
                <CardBody>
                  <Stat>
                    <StatLabel>Total Debt</StatLabel>
                    <StatNumber color="red.500">
                      ${getTotalDebt().toFixed(2)}
                    </StatNumber>
                    <StatHelpText>Credit card balances</StatHelpText>
                  </Stat>
                </CardBody>
              </Card>
            </SimpleGrid>

            {/* Account Cards */}
            {accounts.length === 0 ? (
              <Card bg={cardBg}>
                <CardBody>
                  <Center py={8}>
                    <VStack spacing={4}>
                      <Text fontSize="lg" color="gray.500">
                        No accounts added yet
                      </Text>
                      <Text color="gray.400">
                        Add your first account to start tracking your finances
                      </Text>
                      <HStack spacing={3}>
                        <PlaidIntegration onAccountConnected={fetchAccounts} />
                        <Button colorScheme="blue" onClick={onOpen}>
                          Add Manual Account
                        </Button>
                      </HStack>
                    </VStack>
                  </Center>
                </CardBody>
              </Card>
            ) : (
              <Grid templateColumns="repeat(auto-fill, minmax(350px, 1fr))" gap={6}>
                {accounts.map((account) => {
                  const balance = parseFloat(account.balance || 0);
                  const isDebt = account.account_type === 'credit';

                  return (
                    <Card key={account.id} bg={cardBg}>
                      <CardHeader>
                        <HStack justify="space-between" align="start">
                          <VStack align="start" spacing={1}>
                            <Heading size="md">{account.name}</Heading>
                            <HStack spacing={2}>
                              <Badge colorScheme={getAccountTypeColor(account.account_type)}>
                                {getAccountTypeLabel(account.account_type)}
                              </Badge>
                              {account.is_plaid_account && (
                                <Badge colorScheme="purple" variant="outline">
                                  Plaid Connected
                                </Badge>
                              )}
                            </HStack>
                          </VStack>
                          <HStack spacing={1}>
                            <IconButton
                              icon={<EditIcon />}
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(account)}
                              isDisabled={account.is_plaid_account}
                            />
                            <IconButton
                              icon={<DeleteIcon />}
                              size="sm"
                              variant="ghost"
                              colorScheme="red"
                              onClick={() => handleDelete(account)}
                              isDisabled={account.is_plaid_account}
                            />
                          </HStack>
                        </HStack>
                      </CardHeader>
                      <CardBody pt={0}>
                        <VStack spacing={4} align="stretch">
                          <Divider />
                          <VStack spacing={2} align="stretch">
                            <HStack justify="space-between">
                              <Text fontSize="sm" color="gray.500">Current Balance</Text>
                              <Text 
                                fontSize="2xl" 
                                fontWeight="bold"
                                color={isDebt ? 'red.500' : balance >= 0 ? 'green.500' : 'red.500'}
                              >
                                ${Math.abs(balance).toFixed(2)}
                              </Text>
                            </HStack>
                            {isDebt && (
                              <Text fontSize="sm" color="red.500" textAlign="right">
                                Outstanding debt
                              </Text>
                            )}
                          </VStack>
                          
                          {account.plaid_account_id && (
                            <HStack justify="space-between" fontSize="sm" color="gray.500">
                              <Text>Account ID</Text>
                              <Text fontFamily="mono">{account.plaid_account_id.slice(-8)}</Text>
                            </HStack>
                          )}

                          <HStack spacing={2}>
                            {!account.is_plaid_account && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleBalanceUpdate(account)}
                                flex={1}
                              >
                                Update Balance
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(account)}
                              flex={1}
                              isDisabled={account.is_plaid_account}
                            >
                              Edit Details
                            </Button>
                          </HStack>
                        </VStack>
                      </CardBody>
                    </Card>
                  );
                })}
              </Grid>
            )}
          </VStack>
        </Container>

        {/* Create/Edit Account Modal */}
        <Modal isOpen={isOpen} onClose={handleCloseModal} size="md">
          <ModalOverlay />
          <ModalContent>
            <form onSubmit={handleSubmit}>
              <ModalHeader>
                {selectedAccount ? 'Edit Account' : 'Add Account'}
              </ModalHeader>
              <ModalCloseButton />
              <ModalBody>
                <VStack spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>Account Name</FormLabel>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Chase Checking, Wells Fargo Savings"
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Account Type</FormLabel>
                    <Select
                      value={formData.account_type}
                      onChange={(e) => setFormData({ ...formData, account_type: e.target.value })}
                      placeholder="Select account type"
                    >
                      {accountTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Initial Balance</FormLabel>
                    <NumberInput
                      value={formData.balance}
                      onChange={(value) => setFormData({ ...formData, balance: value })}
                      precision={2}
                    >
                      <NumberInputField placeholder="0.00" />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
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
                  loadingText={selectedAccount ? "Updating..." : "Creating..."}
                >
                  {selectedAccount ? 'Update Account' : 'Add Account'}
                </Button>
              </ModalFooter>
            </form>
          </ModalContent>
        </Modal>

        {/* Balance Update Modal */}
        <Modal isOpen={isBalanceOpen} onClose={onBalanceClose} size="sm">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Update Account Balance</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4}>
                <Text>
                  Update balance for <strong>{balanceUpdateAccount?.name}</strong>
                </Text>
                <FormControl>
                  <FormLabel>New Balance</FormLabel>
                  <NumberInput
                    value={newBalance}
                    onChange={(value) => setNewBalance(value)}
                    precision={2}
                  >
                    <NumberInputField placeholder="0.00" />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onBalanceClose}>
                Cancel
              </Button>
              <Button colorScheme="blue" onClick={confirmBalanceUpdate}>
                Update Balance
              </Button>
            </ModalFooter>
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
                Delete Account
              </AlertDialogHeader>
              <AlertDialogBody>
                Are you sure you want to delete this account? This action cannot be undone and will affect all related transactions.
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

export default AccountsPage;
