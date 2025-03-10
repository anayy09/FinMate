import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Button,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  InputGroup,
  InputRightElement,
  Stack,
  Text,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import { resetPassword } from '../api/auth';
import PageTransition from '../components/PageTransition';

export default function PasswordResetPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { token } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const handleResetPassword = async () => {
    // Validate passwords
    if (!password) {
      toast({
        title: 'Error',
        description: 'Please enter a password',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token, password);
      toast({
        title: 'Success',
        description: 'Your password has been reset successfully.',
        status: 'success',
        duration: 5000,
      });
      navigate('/login');
    } catch (error) {
      let errorMessage = 'Failed to reset password';
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error.detail) {
        errorMessage = error.detail;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      toast({
        title: 'Error',
        description: errorMessage,
        status: 'error',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <Flex
        minH={'100vh'}
        align={'center'}
        justify={'center'}
        bg={useColorModeValue('gray.50', 'gray.800')}>
        <Stack
          spacing={6}
          w={'full'}
          maxW={'md'}
          bg={useColorModeValue('white', 'gray.700')}
          rounded={'xl'}
          boxShadow={'lg'}
          p={8}
          my={12}>
          <Heading lineHeight={1.1} fontSize={{ base: '2xl', md: '3xl' }}>
            Reset Your Password
          </Heading>
          <Text fontSize={{ base: 'sm', sm: 'md' }} color={useColorModeValue('gray.600', 'gray.300')}>
            Please enter your new password below.
          </Text>

          <FormControl id="password" isRequired>
            <FormLabel>New Password</FormLabel>
            <InputGroup>
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <InputRightElement h={'full'}>
                <Button
                  variant={'ghost'}
                  onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <ViewIcon /> : <ViewOffIcon />}
                </Button>
              </InputRightElement>
            </InputGroup>
          </FormControl>

          <FormControl id="confirmPassword" isRequired>
            <FormLabel>Confirm Password</FormLabel>
            <InputGroup>
              <Input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <InputRightElement h={'full'}>
                <Button
                  variant={'ghost'}
                  onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <ViewIcon /> : <ViewOffIcon />}
                </Button>
              </InputRightElement>
            </InputGroup>
          </FormControl>

          <Stack spacing={6}>
            <Button
              bg={'brand.500'}
              color={'white'}
              _hover={{
                bg: 'brand.600',
              }}
              onClick={handleResetPassword}
              isLoading={loading}>
              Reset Password
            </Button>
          </Stack>
        </Stack>
      </Flex>
    </PageTransition>
  );
}