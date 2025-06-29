import React, { useState, useCallback } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import { useAuth } from '../context/AuthContext';
import api from '../api/auth';
import {
  Button,
  Box,
  VStack,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useToast,
  Text,
  Spinner,
  Icon,
  HStack,
  Badge,
} from '@chakra-ui/react';
import { FaUniversity, FaPlus, FaSync } from 'react-icons/fa';

const PlaidLinkComponent = ({ onSuccess, onError }) => {
  const [linkToken, setLinkToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const toast = useToast();

  const createLinkToken = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.post('/api/plaid/create-link-token/');
      setLinkToken(response.data.link_token);
    } catch (error) {
      console.error('Error creating link token:', error);
      toast({
        title: 'Connection Error',
        description: 'Failed to initialize bank connection. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      if (onError) onError(error);
    } finally {
      setLoading(false);
    }
  }, [toast, onError]);

  const onPlaidSuccess = useCallback(async (public_token, metadata) => {
    try {
      setLoading(true);
      
      // Exchange public token for access token
      const response = await api.post('/api/plaid/exchange-public-token/', {
        public_token,
      });

      toast({
        title: 'Bank Connected Successfully!',
        description: `Connected ${response.data.accounts.length} account(s) from ${response.data.institution}`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      if (onSuccess) {
        onSuccess(response.data);
      }
    } catch (error) {
      console.error('Error exchanging public token:', error);
      toast({
        title: 'Connection Failed',
        description: 'Failed to connect your bank account. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      if (onError) onError(error);
    } finally {
      setLoading(false);
    }
  }, [toast, onSuccess, onError]);

  const onPlaidExit = useCallback((err, metadata) => {
    if (err) {
      console.error('Plaid Link error:', err);
      toast({
        title: 'Connection Cancelled',
        description: 'Bank connection was cancelled.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
    }
  }, [toast]);

  const config = {
    token: linkToken,
    onSuccess: onPlaidSuccess,
    onExit: onPlaidExit,
  };

  const { open, ready } = usePlaidLink(config);

  const handleConnectBank = useCallback(() => {
    if (linkToken && ready) {
      open();
    } else {
      createLinkToken();
    }
  }, [linkToken, ready, open, createLinkToken]);

  // Auto-create link token when component mounts
  React.useEffect(() => {
    if (!linkToken && !loading) {
      createLinkToken();
    }
  }, [linkToken, loading, createLinkToken]);

  return (
    <Button
      leftIcon={loading ? <Spinner size="sm" /> : <Icon as={FaUniversity} />}
      colorScheme="blue"
      onClick={handleConnectBank}
      isLoading={loading}
      loadingText="Connecting..."
      isDisabled={!ready || loading}
      size="lg"
    >
      Connect Bank Account
    </Button>
  );
};

const BankAccountCard = ({ account, onSync, onDisconnect }) => {
  const [syncing, setSyncing] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const toast = useToast();

  const handleSync = async () => {
    try {
      setSyncing(true);
      const response = await api.post('/api/plaid/sync-transactions/', {
        account_id: account.id,
      });

      toast({
        title: 'Sync Complete',
        description: `Added ${response.data.summary.transactions_added} new transactions`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      if (onSync) onSync(response.data);
    } catch (error) {
      console.error('Error syncing transactions:', error);
      toast({
        title: 'Sync Failed',
        description: 'Failed to sync transactions. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setDisconnecting(true);
      await api.delete(`/api/plaid/disconnect-account/${account.id}/`);

      toast({
        title: 'Account Disconnected',
        description: 'Bank account has been disconnected successfully.',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });

      if (onDisconnect) onDisconnect(account.id);
    } catch (error) {
      console.error('Error disconnecting account:', error);
      toast({
        title: 'Disconnect Failed',
        description: 'Failed to disconnect account. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setDisconnecting(false);
    }
  };

  const isConnected = account.plaid_account_id && account.plaid_access_token;

  return (
    <Box
      p={4}
      border="1px"
      borderColor="gray.200"
      borderRadius="md"
      bg="white"
      shadow="sm"
    >
      <VStack align="stretch" spacing={3}>
        <HStack justify="space-between">
          <Box>
            <Text fontWeight="bold" fontSize="lg">
              {account.name}
            </Text>
            <Text fontSize="sm" color="gray.600">
              {account.account_type} • Balance: ${account.balance}
            </Text>
            {account.institution_name && (
              <Text fontSize="xs" color="gray.500">
                {account.institution_name}
              </Text>
            )}
          </Box>
          <VStack spacing={1}>
            {isConnected && (
              <Badge colorScheme="green" size="sm">
                Connected
              </Badge>
            )}
            {account.last_sync && (
              <Text fontSize="xs" color="gray.500">
                Last sync: {new Date(account.last_sync).toLocaleDateString()}
              </Text>
            )}
          </VStack>
        </HStack>

        {isConnected && (
          <HStack spacing={2}>
            <Button
              size="sm"
              leftIcon={<Icon as={FaSync} />}
              onClick={handleSync}
              isLoading={syncing}
              loadingText="Syncing..."
              colorScheme="blue"
              variant="outline"
            >
              Sync Transactions
            </Button>
            <Button
              size="sm"
              onClick={handleDisconnect}
              isLoading={disconnecting}
              loadingText="Disconnecting..."
              colorScheme="red"
              variant="outline"
            >
              Disconnect
            </Button>
          </HStack>
        )}
      </VStack>
    </Box>
  );
};

const PlaidIntegration = ({ accounts = [], onAccountsUpdated }) => {
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handlePlaidSuccess = (data) => {
    if (onAccountsUpdated) {
      onAccountsUpdated(data.accounts);
    }
  };

  const handlePlaidError = (error) => {
    console.error('Plaid integration error:', error);
  };

  const handleAccountSync = (syncData) => {
    // Refresh accounts after sync
    if (onAccountsUpdated) {
      // You might want to refetch accounts here
      toast({
        title: 'Transactions Updated',
        description: 'Your transactions have been synced.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleAccountDisconnect = (accountId) => {
    if (onAccountsUpdated) {
      // Remove the disconnected account from the list
      const updatedAccounts = accounts.filter(acc => acc.id !== accountId);
      onAccountsUpdated(updatedAccounts);
    }
  };

  const connectedAccounts = accounts.filter(acc => 
    acc.plaid_account_id && acc.plaid_access_token
  );

  return (
    <Box p={6}>
      <VStack spacing={6} align="stretch">
        <Box textAlign="center">
          <Text fontSize="2xl" fontWeight="bold" mb={2}>
            Bank Account Integration
          </Text>
          <Text color="gray.600" mb={4}>
            Connect your bank accounts to automatically sync transactions
          </Text>
          
          <PlaidLinkComponent 
            onSuccess={handlePlaidSuccess}
            onError={handlePlaidError}
          />
        </Box>

        {connectedAccounts.length > 0 && (
          <Box>
            <Text fontSize="lg" fontWeight="semibold" mb={4}>
              Connected Accounts ({connectedAccounts.length})
            </Text>
            <VStack spacing={4}>
              {connectedAccounts.map((account) => (
                <BankAccountCard
                  key={account.id}
                  account={account}
                  onSync={handleAccountSync}
                  onDisconnect={handleAccountDisconnect}
                />
              ))}
            </VStack>
          </Box>
        )}

        {accounts.length === 0 && (
          <Alert status="info">
            <AlertIcon />
            <Box>
              <AlertTitle>No Bank Accounts Connected</AlertTitle>
              <AlertDescription>
                Connect your bank accounts to automatically track transactions and manage your finances more effectively.
              </AlertDescription>
            </Box>
          </Alert>
        )}
      </VStack>
    </Box>
  );
};

export default PlaidIntegration;
export { PlaidLinkComponent, BankAccountCard };
