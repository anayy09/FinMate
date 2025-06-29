import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  Card,
  CardBody,
  useColorModeValue,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
  Input,
  Image,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Spinner,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Badge,
  Flex,
  IconButton,
  Divider,
  Select,
  Switch,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Progress,
  Avatar,
  AvatarBadge,
  Textarea,
} from "@chakra-ui/react";
import { FaTrash, FaMobile, FaDesktop, FaTablet, FaDownload, FaUniversity, FaSync, FaEnvelope, FaEdit, FaUser, FaCalendar, FaMapMarkerAlt, FaPhone } from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import axios from "axios";
import { 
  getBankAccounts, 
  updateBankAccountSettings, 
  disconnectBankAccount,
  triggerPlaidSync,
  getPlaidSyncStatus,
  downloadReport,
  emailReport,
  getReportTypes,
  updateReportSettings
} from "../api/reports";

const API_URL = "http://127.0.0.1:8000/api";

export default function ProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const bg = useColorModeValue("gray.50", "gray.800");
  const cardBg = useColorModeValue("white", "gray.700");
  
  // Tab management
  const searchParams = new URLSearchParams(location.search);
  const tabParam = searchParams.get('tab');
  
  // Map URL tab parameters to tab indices
  const tabMapping = {
    'details': 0,
    'bank-accounts': 1,
    'reports': 2,
    'security': 3,
    'device-management': 4
  };
  
  // Reverse mapping for updating URL
  const indexToTab = {
    0: 'details',
    1: 'bank-accounts',
    2: 'reports',
    3: 'security',
    4: 'device-management'
  };
  
  const [activeTabIndex, setActiveTabIndex] = useState(
    tabParam && tabMapping[tabParam] !== undefined ? tabMapping[tabParam] : 0
  );
  
  // Update tab when URL changes
  useEffect(() => {
    const newTabParam = new URLSearchParams(location.search).get('tab');
    if (newTabParam && tabMapping[newTabParam] !== undefined) {
      setActiveTabIndex(tabMapping[newTabParam]);
    }
  }, [location.search]);
  
  // Handle tab change and update URL
  const handleTabChange = (index) => {
    setActiveTabIndex(index);
    const tabName = indexToTab[index];
    if (tabName) {
      navigate(`/profile?tab=${tabName}`, { replace: true });
    }
  };
  
  // 2FA states
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(user?.two_factor_enabled || false);
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [verificationToken, setVerificationToken] = useState("");
  const [isSetupLoading, setIsSetupLoading] = useState(false);
  const [isVerifyLoading, setIsVerifyLoading] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  
  // Device management states
  const [sessions, setSessions] = useState([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  
  // Modals
  const { isOpen: isDisable2FAOpen, onOpen: onDisable2FAOpen, onClose: onDisable2FAClose } = useDisclosure();
  const { isOpen: isEditAccountOpen, onOpen: onEditAccountOpen, onClose: onEditAccountClose } = useDisclosure();
  const { isOpen: isEditProfileOpen, onOpen: onEditProfileOpen, onClose: onEditProfileClose } = useDisclosure();
  const [disablePassword, setDisablePassword] = useState("");
  
  // Edit account states
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [editAccountData, setEditAccountData] = useState({
    name: '',
    auto_sync_enabled: false,
    sync_frequency: 'daily'
  });

  // Profile states
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
    location: user?.location || '',
    dateOfBirth: user?.date_of_birth || '',
    occupation: user?.occupation || '',
    currency: user?.preferred_currency || 'USD'
  });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  
  // Update profile data when user changes
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        bio: user.bio || '',
        location: user.location || '',
        dateOfBirth: user.date_of_birth || '',
        occupation: user.occupation || '',
        currency: user.preferred_currency || 'USD'
      });
    }
  }, [user]);
  
  // Bank Accounts states
  const [bankAccounts, setBankAccounts] = useState([]);
  const [syncStatus, setSyncStatus] = useState({});
  const [isLoadingBankAccounts, setIsLoadingBankAccounts] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Reports states
  const [reportSettings, setReportSettings] = useState({
    frequency: 'monthly',
    autoSync: true,
    emailReports: true
  });
  const [reportTypes, setReportTypes] = useState({});
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  useEffect(() => {
    fetchSessions();
    fetchBankAccounts();
    fetchReportTypes();
    loadReportSettings();
  }, []);

  // Fetch bank accounts
  const fetchBankAccounts = async () => {
    setIsLoadingBankAccounts(true);
    try {
      const data = await getBankAccounts();
      setBankAccounts(data.accounts || []);
      
      // Get sync status
      const syncData = await getPlaidSyncStatus();
      setSyncStatus(syncData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load bank accounts",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoadingBankAccounts(false);
    }
  };

  // Fetch report types
  const fetchReportTypes = async () => {
    try {
      const data = await getReportTypes();
      setReportTypes(data);
    } catch (error) {
      console.error('Error fetching report types:', error);
    }
  };

  // Load report settings
  const loadReportSettings = () => {
    // Load from user preferences or localStorage
    const savedSettings = localStorage.getItem('reportSettings');
    if (savedSettings) {
      setReportSettings(JSON.parse(savedSettings));
    }
  };

  const fetchSessions = async () => {
    setIsLoadingSessions(true);
    try {
      const token = localStorage.getItem("access_token");
      const response = await axios.get(`${API_URL}/user/sessions/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setSessions(response.data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch sessions",
        status: "error",
        duration: 3000,
      });
    }
    setIsLoadingSessions(false);
  };

  const setup2FA = async () => {
    setIsSetupLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const response = await axios.post(`${API_URL}/auth/setup-2fa/`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setQrCode(response.data.qr_code);
      setSecret(response.data.secret);
      setShowSetup(true);
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to setup 2FA",
        status: "error",
        duration: 3000,
      });
    }
    setIsSetupLoading(false);
  };

  const verify2FA = async () => {
    setIsVerifyLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      await axios.post(`${API_URL}/auth/verify-2fa/`, {
        token: verificationToken,
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setTwoFactorEnabled(true);
      setShowSetup(false);
      toast({
        title: "Success",
        description: "2FA enabled successfully",
        status: "success",
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to verify 2FA",
        status: "error",
        duration: 3000,
      });
    }
    setIsVerifyLoading(false);
  };

  const disable2FA = async () => {
    try {
      const token = localStorage.getItem("access_token");
      await axios.post(`${API_URL}/auth/disable-2fa/`, {
        password: disablePassword,
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setTwoFactorEnabled(false);
      setDisablePassword("");
      onDisable2FAClose();
      toast({
        title: "Success",
        description: "2FA disabled successfully",
        status: "success",
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to disable 2FA",
        status: "error",
        duration: 3000,
      });
    }
  };

  const logoutDevice = async (sessionId) => {
    try {
      const token = localStorage.getItem("access_token");
      await axios.post(`${API_URL}/user/logout-device/`, {
        session_id: sessionId,
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setSessions(sessions.filter(session => session.session_id !== sessionId));
      toast({
        title: "Success",
        description: "Device logged out successfully",
        status: "success",
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to logout device",
        status: "error",
        duration: 3000,
      });
    }
  };

  const getDeviceIcon = (deviceInfo) => {
    const info = deviceInfo?.toLowerCase() || "";
    if (info.includes("mobile") || info.includes("android") || info.includes("iphone")) {
      return FaMobile;
    } else if (info.includes("tablet") || info.includes("ipad")) {
      return FaTablet;
    }
    return FaDesktop;
  };

  // Bank Account Management Functions
  const handleSyncAccount = async (accountId) => {
    try {
      setIsSyncing(true);
      await triggerPlaidSync(accountId, false);
      toast({
        title: "Success",
        description: "Account sync started",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      // Refresh bank accounts after sync
      setTimeout(() => {
        fetchBankAccounts();
      }, 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sync account",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncAll = async () => {
    try {
      setIsSyncing(true);
      await triggerPlaidSync(null, false);
      toast({
        title: "Success",
        description: "Syncing all accounts started",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      // Refresh bank accounts after sync
      setTimeout(() => {
        fetchBankAccounts();
      }, 3000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sync accounts",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleUpdateSyncSettings = async (accountId, settings) => {
    try {
      await updateBankAccountSettings(accountId, settings);
      toast({
        title: "Success",
        description: "Account settings updated",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      fetchBankAccounts();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update settings",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleDisconnectAccount = async (accountId) => {
    if (window.confirm("Are you sure you want to disconnect this account?")) {
      try {
        await disconnectBankAccount(accountId);
        toast({
          title: "Success",
          description: "Account disconnected successfully",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        fetchBankAccounts();
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to disconnect account",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    }
  };

  const handleEditAccount = (account) => {
    setSelectedAccount(account);
    setEditAccountData({
      name: account.name || '',
      auto_sync_enabled: account.auto_sync_enabled || false,
      sync_frequency: account.sync_frequency || 'daily'
    });
    onEditAccountOpen();
  };

  const handleSaveAccountEdit = async () => {
    if (!selectedAccount) return;
    
    try {
      await updateBankAccountSettings(selectedAccount.id, {
        name: editAccountData.name,
        auto_sync_enabled: editAccountData.auto_sync_enabled,
        sync_frequency: editAccountData.sync_frequency
      });
      
      toast({
        title: "Success",
        description: "Account settings updated successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      
      fetchBankAccounts();
      onEditAccountClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update account settings",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleCloseEditModal = () => {
    setSelectedAccount(null);
    setEditAccountData({
      name: '',
      auto_sync_enabled: false,
      sync_frequency: 'daily'
    });
    onEditAccountClose();
  };

  // Profile Functions
  const handleEditProfile = () => {
    setProfileData({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      bio: user?.bio || '',
      location: user?.location || '',
      dateOfBirth: user?.date_of_birth || '',
      occupation: user?.occupation || '',
      currency: user?.preferred_currency || 'USD'
    });
    onEditProfileOpen();
  };

  const handleSaveProfile = async () => {
    setIsUpdatingProfile(true);
    try {
      const token = localStorage.getItem("access_token");
      const response = await axios.patch(`${API_URL}/user/profile/`, {
        name: profileData.name,
        email: profileData.email,
        phone: profileData.phone,
        bio: profileData.bio,
        location: profileData.location,
        date_of_birth: profileData.dateOfBirth,
        occupation: profileData.occupation,
        preferred_currency: profileData.currency
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      toast({
        title: "Success",
        description: "Profile updated successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      // Refresh user profile data from the backend
      if (fetchUserProfile) {
        await fetchUserProfile();
      }
      
      onEditProfileClose();

    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to update profile",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleCloseProfileModal = () => {
    setProfileData({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      bio: user?.bio || '',
      location: user?.location || '',
      dateOfBirth: user?.date_of_birth || '',
      occupation: user?.occupation || '',
      currency: user?.preferred_currency || 'USD'
    });
    onEditProfileClose();
  };

  // Report Functions
  const handleDownloadReport = async (period, format) => {
    try {
      setIsGeneratingReport(true);
      await downloadReport({
        period,
        format,
        report_type: period === 'this_week' ? 'weekly' : 'monthly'
      });
      toast({
        title: "Success",
        description: `${format.toUpperCase()} report downloaded successfully`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate report",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleEmailReport = async (period, format) => {
    try {
      await emailReport({
        period,
        format,
        report_type: period === 'this_week' ? 'weekly' : 'monthly',
        email: user.email
      });
      toast({
        title: "Success",
        description: `Report will be emailed to ${user.email}`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to email report",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleUpdateReportSettings = async (newSettings) => {
    try {
      setReportSettings(newSettings);
      localStorage.setItem('reportSettings', JSON.stringify(newSettings));
      
      await updateReportSettings({
        frequency: newSettings.frequency,
        autoSync: newSettings.autoSync
      });
      
      toast({
        title: "Success",
        description: "Report settings updated",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update settings",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box minH="100vh" bg={bg}>
      <Navbar />
      <Container maxW="container.xl" pt="6rem" pb={8}>
        <Heading size="lg" mb={6}>Profile</Heading>
        
        <Tabs index={activeTabIndex} onChange={handleTabChange}>
          <TabList>
            <Tab>Details</Tab>
            <Tab>Bank Accounts</Tab>
            <Tab>Reports</Tab>
            <Tab>Security</Tab>
            <Tab>Device Management</Tab>
          </TabList>

          <TabPanels>
            {/* Profile Tab */}
            <TabPanel>
              <VStack spacing={6} align="stretch">
                {/* Profile Header Card */}
                <Card bg={cardBg}>
                  <CardBody>
                    <Flex direction={{ base: "column", md: "row" }} align="center" gap={6}>
                      <Avatar
                        size="2xl"
                        name={user?.name}
                        src={user?.avatar}
                        bg={useColorModeValue('blue.500', 'blue.300')}
                      >
                        <AvatarBadge
                          boxSize="1.25em"
                          bg="green.500"
                          borderColor={useColorModeValue('white', 'gray.800')}
                        />
                      </Avatar>
                      
                      <VStack align={{ base: "center", md: "start" }} spacing={3} flex={1}>
                        <VStack align={{ base: "center", md: "start" }} spacing={1}>
                          <Heading size="lg" color={useColorModeValue('gray.800', 'gray.100')}>
                            {user?.name || 'User Name'}
                          </Heading>
                          <Text color="gray.500" fontSize="md">
                            {user?.email}
                          </Text>
                          {user?.occupation && (
                            <Text color="gray.600" fontSize="sm">
                              {user.occupation}
                            </Text>
                          )}
                        </VStack>
                        
                        <HStack spacing={3}>
                          <Badge colorScheme="green" variant="solid">
                            Active Account
                          </Badge>
                          <Badge colorScheme="blue" variant="outline">
                            Member since {new Date(user?.date_joined || Date.now()).getFullYear()}
                          </Badge>
                        </HStack>
                      </VStack>

                      <Button
                        leftIcon={<FaEdit />}
                        colorScheme="blue"
                        onClick={handleEditProfile}
                        size="md"
                      >
                        Edit Profile
                      </Button>
                    </Flex>
                  </CardBody>
                </Card>

                {/* Profile Details Grid */}
                <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
                  {/* Personal Information */}
                  <Card bg={cardBg}>
                    <CardBody>
                      <VStack align="stretch" spacing={4}>
                        <HStack>
                          <Box color={useColorModeValue('blue.500', 'blue.300')}>
                            <FaUser size={20} />
                          </Box>
                          <Heading size="sm">Personal Information</Heading>
                        </HStack>
                        
                        <VStack align="stretch" spacing={3}>
                          <HStack justify="space-between" py={2}>
                            <Text color="gray.600" fontSize="sm">Full Name:</Text>
                            <Text fontWeight="medium">{user?.name || 'Not provided'}</Text>
                          </HStack>
                          <Divider />
                          
                          <HStack justify="space-between" py={2}>
                            <Text color="gray.600" fontSize="sm">Email:</Text>
                            <Text fontWeight="medium">{user?.email}</Text>
                          </HStack>
                          <Divider />
                          
                          <HStack justify="space-between" py={2}>
                            <Text color="gray.600" fontSize="sm">Phone:</Text>
                            <Text fontWeight="medium" color={user?.phone ? 'inherit' : 'gray.400'}>
                              {user?.phone || 'Not provided'}
                            </Text>
                          </HStack>
                          <Divider />
                          
                          <HStack justify="space-between" py={2}>
                            <Text color="gray.600" fontSize="sm">Date of Birth:</Text>
                            <Text fontWeight="medium" color={user?.date_of_birth ? 'inherit' : 'gray.400'}>
                              {user?.date_of_birth ? new Date(user.date_of_birth).toLocaleDateString() : 'Not provided'}
                            </Text>
                          </HStack>
                        </VStack>
                      </VStack>
                    </CardBody>
                  </Card>

                  {/* Additional Details */}
                  <Card bg={cardBg}>
                    <CardBody>
                      <VStack align="stretch" spacing={4}>
                        <HStack>
                          <Box color={useColorModeValue('green.500', 'green.300')}>
                            <FaMapMarkerAlt size={20} />
                          </Box>
                          <Heading size="sm">Additional Details</Heading>
                        </HStack>
                        
                        <VStack align="stretch" spacing={3}>
                          <HStack justify="space-between" py={2}>
                            <Text color="gray.600" fontSize="sm">Location:</Text>
                            <Text fontWeight="medium" color={user?.location ? 'inherit' : 'gray.400'}>
                              {user?.location || 'Not provided'}
                            </Text>
                          </HStack>
                          <Divider />
                          
                          <HStack justify="space-between" py={2}>
                            <Text color="gray.600" fontSize="sm">Occupation:</Text>
                            <Text fontWeight="medium" color={user?.occupation ? 'inherit' : 'gray.400'}>
                              {user?.occupation || 'Not provided'}
                            </Text>
                          </HStack>
                          <Divider />
                          
                          <HStack justify="space-between" py={2}>
                            <Text color="gray.600" fontSize="sm">Preferred Currency:</Text>
                            <Badge colorScheme="blue" variant="outline">
                              {user?.preferred_currency || 'USD'}
                            </Badge>
                          </HStack>
                          <Divider />
                          
                          <HStack justify="space-between" py={2}>
                            <Text color="gray.600" fontSize="sm">Account Type:</Text>
                            <Badge colorScheme="purple" variant="solid">
                              {user?.is_premium ? 'Premium' : 'Free'}
                            </Badge>
                          </HStack>
                        </VStack>
                      </VStack>
                    </CardBody>
                  </Card>
                </SimpleGrid>

                {/* Bio Section */}
                {user?.bio && (
                  <Card bg={cardBg}>
                    <CardBody>
                      <VStack align="stretch" spacing={4}>
                        <Heading size="sm">About</Heading>
                        <Text color="gray.600" lineHeight="tall">
                          {user.bio}
                        </Text>
                      </VStack>
                    </CardBody>
                  </Card>
                )}

                {/* Account Statistics */}
                <Card bg={cardBg}>
                  <CardBody>
                    <VStack align="stretch" spacing={4}>
                      <Heading size="sm">Account Statistics</Heading>
                      <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
                        <Stat textAlign="center">
                          <StatLabel fontSize="xs" color="gray.500">Member Since</StatLabel>
                          <StatNumber fontSize="lg">
                            {new Date(user?.date_joined || Date.now()).toLocaleDateString()}
                          </StatNumber>
                        </Stat>
                        <Stat textAlign="center">
                          <StatLabel fontSize="xs" color="gray.500">Last Login</StatLabel>
                          <StatNumber fontSize="lg">
                            {user?.last_login ? new Date(user.last_login).toLocaleDateString() : 'Today'}
                          </StatNumber>
                        </Stat>
                        <Stat textAlign="center">
                          <StatLabel fontSize="xs" color="gray.500">Profile Complete</StatLabel>
                          <StatNumber fontSize="lg">
                            {Math.round(
                              ((user?.name ? 1 : 0) + 
                               (user?.phone ? 1 : 0) + 
                               (user?.location ? 1 : 0) + 
                               (user?.occupation ? 1 : 0) + 
                               (user?.bio ? 1 : 0)) / 5 * 100
                            )}%
                          </StatNumber>
                        </Stat>
                        <Stat textAlign="center">
                          <StatLabel fontSize="xs" color="gray.500">Security Level</StatLabel>
                          <StatNumber fontSize="lg" color={twoFactorEnabled ? 'green.500' : 'orange.500'}>
                            {twoFactorEnabled ? 'High' : 'Medium'}
                          </StatNumber>
                        </Stat>
                      </SimpleGrid>
                    </VStack>
                  </CardBody>
                </Card>
              </VStack>
            </TabPanel>

            {/* Bank Accounts Tab */}
            <TabPanel>
              <VStack spacing={6} align="stretch">
                <Card bg={cardBg}>
                  <CardBody>
                    <VStack align="stretch" spacing={6}>
                      <Flex 
                        direction={{ base: "column", md: "row" }}
                        justify="space-between" 
                        align={{ base: "start", md: "center" }}
                        gap={4}
                      >
                        <Box>
                          <Heading size="md" mb={2} color={useColorModeValue('gray.800', 'gray.100')}>
                            Connected Bank Accounts
                          </Heading>
                          <Text color="gray.600" fontSize="sm">
                            Manage your connected bank accounts and sync settings
                          </Text>
                          {bankAccounts.length > 0 && (
                            <Text color="gray.500" fontSize="xs" mt={1}>
                              {bankAccounts.length} account{bankAccounts.length !== 1 ? 's' : ''} connected
                            </Text>
                          )}
                        </Box>
                        {bankAccounts.length > 0 && (
                          <HStack spacing={3}>
                            <Button
                              leftIcon={<FaSync />}
                              colorScheme="blue"
                              onClick={handleSyncAll}
                              isLoading={isSyncing}
                              loadingText="Syncing..."
                              size="sm"
                              variant="solid"
                            >
                              Sync All
                            </Button>
                            <Button
                              colorScheme="green"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                // This could open a modal to connect new account
                                toast({
                                  title: "Coming Soon",
                                  description: "Bank connection feature will be available soon",
                                  status: "info",
                                  duration: 3000,
                                });
                              }}
                            >
                              Connect New
                            </Button>
                          </HStack>
                        )}
                      </Flex>

                      {isLoadingBankAccounts ? (
                        <Flex justify="center" py={8}>
                          <Spinner size="lg" />
                        </Flex>
                      ) : bankAccounts.length === 0 ? (
                        <Box textAlign="center" py={16}>
                          <Box 
                            p={4} 
                            bg={useColorModeValue('gray.100', 'gray.700')}
                            borderRadius="full"
                            display="inline-block"
                            mb={4}
                          >
                            <FaUniversity size={32} color={useColorModeValue('#718096', '#A0AEC0')} />
                          </Box>
                          <Heading size="md" mb={2} color={useColorModeValue('gray.700', 'gray.300')}>
                            No bank accounts connected
                          </Heading>
                          <Text color="gray.500" fontSize="sm" mb={6} maxW="400px" mx="auto">
                            Connect your bank account to automatically import transactions and keep track of your finances effortlessly.
                          </Text>
                          <Button
                            colorScheme="blue"
                            onClick={() => {
                              toast({
                                title: "Coming Soon",
                                description: "Bank connection feature will be available soon",
                                status: "info",
                                duration: 3000,
                              });
                            }}
                          >
                            Connect Your First Account
                          </Button>
                        </Box>
                      ) : (
                        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                          {bankAccounts.map((account) => (
                            <Card 
                              key={account.id} 
                              bg={cardBg}
                              shadow="md"
                              borderWidth="1px"
                              borderColor={useColorModeValue('gray.200', 'gray.600')}
                              _hover={{
                                shadow: "lg",
                                transform: "translateY(-2px)",
                                transition: "all 0.2s"
                              }}
                            >
                              <CardBody p={6}>
                                <VStack align="stretch" spacing={4}>
                                  {/* Header */}
                                  <VStack align="start" spacing={3}>
                                    <HStack justify="space-between" w="full">
                                      <HStack spacing={3}>
                                        <Box 
                                          p={2} 
                                          bg={useColorModeValue('blue.50', 'blue.900')}
                                          borderRadius="md"
                                          color={useColorModeValue('blue.600', 'blue.300')}
                                        >
                                          <FaUniversity size={20} />
                                        </Box>
                                        <VStack align="start" spacing={0}>
                                          <Heading size="sm" noOfLines={1}>
                                            {account.name}
                                          </Heading>
                                          <Text fontSize="xs" color="gray.500" textTransform="uppercase">
                                            {account.account_type}
                                          </Text>
                                        </VStack>
                                      </HStack>
                                      {account.is_plaid_account && (
                                        <Badge colorScheme="blue" variant="solid" fontSize="xs">
                                          Plaid
                                        </Badge>
                                      )}
                                    </HStack>

                                    {/* Balance */}
                                    <Box 
                                      p={3} 
                                      bg={useColorModeValue('green.50', 'green.900')}
                                      borderRadius="md"
                                      w="full"
                                    >
                                      <Text fontSize="xs" color="gray.500" mb={1}>
                                        Current Balance
                                      </Text>
                                      <Text fontSize="xl" fontWeight="bold" color={useColorModeValue('green.600', 'green.300')}>
                                        ${parseFloat(account.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                      </Text>
                                    </Box>
                                  </VStack>

                                  {/* Sync Information */}
                                  {account.is_plaid_account && (
                                    <VStack align="stretch" spacing={2}>
                                      <HStack justify="space-between">
                                        <Text fontSize="sm" color="gray.600">
                                          Auto Sync
                                        </Text>
                                        <Switch
                                          size="sm"
                                          isChecked={account.auto_sync_enabled}
                                          onChange={(e) => handleUpdateSyncSettings(account.id, {
                                            auto_sync_enabled: e.target.checked
                                          })}
                                        />
                                      </HStack>
                                      {account.last_plaid_sync && (
                                        <Text fontSize="xs" color="gray.500">
                                          Last sync: {new Date(account.last_plaid_sync).toLocaleDateString()} at{' '}
                                          {new Date(account.last_plaid_sync).toLocaleTimeString([], { 
                                            hour: '2-digit', 
                                            minute: '2-digit' 
                                          })}
                                        </Text>
                                      )}
                                    </VStack>
                                  )}

                                  {/* Actions */}
                                  <VStack spacing={2} w="full">
                                    <HStack spacing={2} w="full">
                                      <Button
                                        size="sm"
                                        colorScheme="gray"
                                        variant="outline"
                                        flex={1}
                                        leftIcon={<FaEdit />}
                                        onClick={() => handleEditAccount(account)}
                                      >
                                        Edit
                                      </Button>
                                      {account.is_plaid_account && (
                                        <Button
                                          size="sm"
                                          colorScheme="blue"
                                          variant="outline"
                                          flex={1}
                                          leftIcon={<FaSync />}
                                          onClick={() => handleSyncAccount(account.id)}
                                          isLoading={isSyncing}
                                        >
                                          Sync
                                        </Button>
                                      )}
                                    <Button
                                      size="sm"
                                      colorScheme="red"
                                      variant="outline"
                                      flex={1}
                                      leftIcon={<FaTrash />}
                                      onClick={() => handleDisconnectAccount(account.id)}
                                    >
                                      Disconnect
                                    </Button>
                                    </HStack>
                                  </VStack>
                                </VStack>
                              </CardBody>
                            </Card>
                          ))}
                        </SimpleGrid>
                      )}
                    </VStack>
                  </CardBody>
                </Card>
              </VStack>
            </TabPanel>

            {/* Reports Tab */}
            <TabPanel>
              <VStack spacing={6} align="stretch">
                <Card bg={cardBg}>
                  <CardBody>
                    <VStack align="stretch" spacing={6}>
                      <Box>
                        <Heading size="md" mb={2}>Financial Reports</Heading>
                        <Text color="gray.600">
                          Generate and download your financial reports
                        </Text>
                      </Box>

                      {/* Quick Actions */}
                      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
                        <Button
                          leftIcon={<FaDownload />}
                          colorScheme="blue"
                          onClick={() => handleDownloadReport('this_month', 'pdf')}
                          isLoading={isGeneratingReport}
                        >
                          Monthly PDF
                        </Button>
                        <Button
                          leftIcon={<FaDownload />}
                          colorScheme="green"
                          onClick={() => handleDownloadReport('this_week', 'csv')}
                          isLoading={isGeneratingReport}
                        >
                          Weekly CSV
                        </Button>
                        <Button
                          leftIcon={<FaEnvelope />}
                          colorScheme="purple"
                          onClick={() => handleEmailReport('this_month', 'pdf')}
                        >
                          Email Report
                        </Button>
                        <Button
                          leftIcon={<FaDownload />}
                          variant="outline"
                          onClick={() => handleDownloadReport('custom', 'pdf')}
                        >
                          Custom Range
                        </Button>
                      </SimpleGrid>

                      <Divider />

                      {/* Report Settings */}
                      <Box>
                        <Heading size="sm" mb={4}>Report Settings</Heading>
                        <VStack spacing={4} align="stretch">
                          <FormControl>
                            <FormLabel>Email Report Frequency</FormLabel>
                            <Select
                              value={reportSettings.frequency}
                              onChange={(e) => handleUpdateReportSettings({
                                ...reportSettings,
                                frequency: e.target.value
                              })}
                            >
                              <option value="never">Never</option>
                              <option value="weekly">Weekly</option>
                              <option value="monthly">Monthly</option>
                              <option value="quarterly">Quarterly</option>
                            </Select>
                          </FormControl>

                          <FormControl display="flex" alignItems="center">
                            <FormLabel mb="0">
                              Enable Automatic Bank Sync
                            </FormLabel>
                            <Switch
                              isChecked={reportSettings.autoSync}
                              onChange={(e) => handleUpdateReportSettings({
                                ...reportSettings,
                                autoSync: e.target.checked
                              })}
                            />
                          </FormControl>

                          <FormControl display="flex" alignItems="center">
                            <FormLabel mb="0">
                              Receive Email Reports
                            </FormLabel>
                            <Switch
                              isChecked={reportSettings.emailReports}
                              onChange={(e) => handleUpdateReportSettings({
                                ...reportSettings,
                                emailReports: e.target.checked
                              })}
                            />
                          </FormControl>
                        </VStack>
                      </Box>
                    </VStack>
                  </CardBody>
                </Card>
              </VStack>
            </TabPanel>

            {/* Security Tab */}
            <TabPanel>
              <VStack spacing={6} align="stretch">
                <Card bg={cardBg}>
                  <CardBody>
                    <VStack align="stretch" spacing={4}>
                      <Box>
                        <Heading size="md" mb={2}>Two-Factor Authentication</Heading>
                        <Text color="gray.600" mb={4}>
                          Add an extra layer of security to your account
                        </Text>
                      </Box>
                      
                      {twoFactorEnabled ? (
                        <Alert status="success">
                          <AlertIcon />
                          <Box>
                            <AlertTitle>2FA Enabled!</AlertTitle>
                            <AlertDescription>
                              Your account is protected with two-factor authentication.
                            </AlertDescription>
                          </Box>
                        </Alert>
                      ) : (
                        <Alert status="warning">
                          <AlertIcon />
                          <Box>
                            <AlertTitle>2FA Not Enabled</AlertTitle>
                            <AlertDescription>
                              Your account would be more secure with 2FA enabled.
                            </AlertDescription>
                          </Box>
                        </Alert>
                      )}

                      {!showSetup && (
                        <HStack justify="space-between">
                          <Text>Two-Factor Authentication Status</Text>
                          <Badge colorScheme={twoFactorEnabled ? "green" : "orange"}>
                            {twoFactorEnabled ? "Enabled" : "Disabled"}
                          </Badge>
                        </HStack>
                      )}

                      {showSetup && (
                        <VStack spacing={4} align="stretch">
                          <Text>Scan this QR code with your authenticator app:</Text>
                          <Box textAlign="center">
                            <Image src={qrCode} alt="2FA QR Code" maxW="200px" mx="auto" />
                          </Box>
                          <Text fontSize="sm" color="gray.600">
                            Or enter this code manually: <Text as="span" fontFamily="mono">{secret}</Text>
                          </Text>
                          <FormControl>
                            <FormLabel>Enter verification code</FormLabel>
                            <Input
                              placeholder="Enter 6-digit code"
                              value={verificationToken}
                              onChange={(e) => setVerificationToken(e.target.value)}
                            />
                          </FormControl>
                        </VStack>
                      )}

                      <HStack>
                        {!twoFactorEnabled && !showSetup && (
                          <Button
                            colorScheme="green"
                            onClick={setup2FA}
                            isLoading={isSetupLoading}
                          >
                            Enable 2FA
                          </Button>
                        )}
                        
                        {showSetup && (
                          <>
                            <Button
                              colorScheme="green"
                              onClick={verify2FA}
                              isLoading={isVerifyLoading}
                              disabled={!verificationToken}
                            >
                              Verify & Enable
                            </Button>
                            <Button
                              variant="ghost"
                              onClick={() => setShowSetup(false)}
                            >
                              Cancel
                            </Button>
                          </>
                        )}
                        
                        {twoFactorEnabled && (
                          <Button
                            colorScheme="red"
                            variant="outline"
                            onClick={onDisable2FAOpen}
                          >
                            Disable 2FA
                          </Button>
                        )}
                      </HStack>
                    </VStack>
                  </CardBody>
                </Card>
              </VStack>
            </TabPanel>

            {/* Device Management Tab */}
            <TabPanel>
              <Card bg={cardBg}>
                <CardBody>
                  <VStack align="stretch" spacing={4}>
                    <Box>
                      <Heading size="md" mb={2}>Active Sessions</Heading>
                      <Text color="gray.600" mb={4}>
                        Manage devices that are signed into your account
                      </Text>
                    </Box>

                    {isLoadingSessions ? (
                      <Flex justify="center" py={8}>
                        <Spinner />
                      </Flex>
                    ) : (
                      <VStack spacing={3} align="stretch">
                        {sessions.map((session, index) => {
                          const DeviceIcon = getDeviceIcon(session.device_info);
                          return (
                            <Box key={session.session_id}>
                              <Flex justify="space-between" align="center" p={4} border="1px" borderColor="gray.200" rounded="md">
                                <HStack spacing={3}>
                                  <Box color="gray.500">
                                    <DeviceIcon size={20} />
                                  </Box>
                                  <VStack align="start" spacing={1}>
                                    <Text fontWeight="medium">
                                      {session.device_info?.includes("Chrome") ? "Chrome Browser" : 
                                       session.device_info?.includes("Firefox") ? "Firefox Browser" :
                                       session.device_info?.includes("Safari") ? "Safari Browser" : "Unknown Device"}
                                    </Text>
                                    <Text fontSize="sm" color="gray.600">
                                      IP: {session.ip_address} • {new Date(session.created_at).toLocaleDateString()}
                                    </Text>
                                  </VStack>
                                </HStack>
                                <IconButton
                                  aria-label="Log out device"
                                  icon={<FaTrash />}
                                  colorScheme="red"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => logoutDevice(session.session_id)}
                                />
                              </Flex>
                              {index < sessions.length - 1 && <Divider />}
                            </Box>
                          );
                        })}
                        {sessions.length === 0 && (
                          <Text textAlign="center" color="gray.500" py={8}>
                            No active sessions found
                          </Text>
                        )}
                      </VStack>
                    )}
                  </VStack>
                </CardBody>
              </Card>
            </TabPanel>

          </TabPanels>
        </Tabs>
      </Container>

      {/* Disable 2FA Modal */}
      <Modal isOpen={isDisable2FAOpen} onClose={onDisable2FAClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Disable Two-Factor Authentication</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text mb={4}>
              Are you sure you want to disable 2FA? This will make your account less secure.
            </Text>
            <FormControl>
              <FormLabel>Enter your password to confirm</FormLabel>
              <Input
                type="password"
                placeholder="Password"
                value={disablePassword}
                onChange={(e) => setDisablePassword(e.target.value)}
              />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onDisable2FAClose}>
              Cancel
            </Button>
            <Button
              colorScheme="red"
              onClick={disable2FA}
              disabled={!disablePassword}
            >
              Disable 2FA
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Edit Account Modal */}
      <Modal isOpen={isEditAccountOpen} onClose={handleCloseEditModal}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit Bank Account</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Account Name</FormLabel>
                <Input
                  placeholder="Enter account name"
                  value={editAccountData.name}
                  onChange={(e) => setEditAccountData({
                    ...editAccountData,
                    name: e.target.value
                  })}
                />
              </FormControl>

              {selectedAccount?.is_plaid_account && (
                <>
                  <FormControl display="flex" alignItems="center">
                    <FormLabel mb="0" flex={1}>
                      Enable Auto Sync
                    </FormLabel>
                    <Switch
                      isChecked={editAccountData.auto_sync_enabled}
                      onChange={(e) => setEditAccountData({
                        ...editAccountData,
                        auto_sync_enabled: e.target.checked
                      })}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Sync Frequency</FormLabel>
                    <Select
                      value={editAccountData.sync_frequency}
                      onChange={(e) => setEditAccountData({
                        ...editAccountData,
                        sync_frequency: e.target.value
                      })}
                    >
                      <option value="hourly">Hourly</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="manual">Manual Only</option>
                    </Select>
                  </FormControl>
                </>
              )}

              <Box p={3} bg={useColorModeValue('blue.50', 'blue.900')} borderRadius="md" w="full">
                <Text fontSize="sm" color={useColorModeValue('blue.600', 'blue.300')}>
                  <strong>Note:</strong> Some settings may be limited based on your bank's API capabilities.
                </Text>
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={handleCloseEditModal}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleSaveAccountEdit}
              disabled={!editAccountData.name.trim()}
            >
              Save Changes
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      {/* Edit Profile Modal */}
      <Modal isOpen={isEditProfileOpen} onClose={handleCloseProfileModal} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit Profile</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="full">
                <FormControl>
                  <FormLabel>Full Name</FormLabel>
                  <Input
                    placeholder="Enter your full name"
                    value={profileData.name}
                    onChange={(e) => setProfileData({
                      ...profileData,
                      name: e.target.value
                    })}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Email</FormLabel>
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({
                      ...profileData,
                      email: e.target.value
                    })}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Phone Number</FormLabel>
                  <Input
                    placeholder="Enter your phone number"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({
                      ...profileData,
                      phone: e.target.value
                    })}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Date of Birth</FormLabel>
                  <Input
                    type="date"
                    value={profileData.dateOfBirth}
                    onChange={(e) => setProfileData({
                      ...profileData,
                      dateOfBirth: e.target.value
                    })}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Location</FormLabel>
                  <Input
                    placeholder="City, Country"
                    value={profileData.location}
                    onChange={(e) => setProfileData({
                      ...profileData,
                      location: e.target.value
                    })}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Occupation</FormLabel>
                  <Input
                    placeholder="Enter your occupation"
                    value={profileData.occupation}
                    onChange={(e) => setProfileData({
                      ...profileData,
                      occupation: e.target.value
                    })}
                  />
                </FormControl>
              </SimpleGrid>

              <FormControl>
                <FormLabel>Preferred Currency</FormLabel>
                <Select
                  value={profileData.currency}
                  onChange={(e) => setProfileData({
                    ...profileData,
                    currency: e.target.value
                  })}
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="CAD">CAD - Canadian Dollar</option>
                  <option value="AUD">AUD - Australian Dollar</option>
                  <option value="JPY">JPY - Japanese Yen</option>
                  <option value="INR">INR - Indian Rupee</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Bio</FormLabel>
                <Textarea
                  placeholder="Tell us about yourself..."
                  value={profileData.bio}
                  onChange={(e) => setProfileData({
                    ...profileData,
                    bio: e.target.value
                  })}
                  rows={3}
                />
              </FormControl>

              <Box p={3} bg={useColorModeValue('green.50', 'green.900')} borderRadius="md" w="full">
                <Text fontSize="sm" color={useColorModeValue('green.600', 'green.300')}>
                  <strong>Tip:</strong> Completing your profile helps us provide better financial insights and recommendations.
                </Text>
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={handleCloseProfileModal}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleSaveProfile}
              isLoading={isUpdatingProfile}
              loadingText="Saving..."
              disabled={!profileData.name.trim() || !profileData.email.trim()}
            >
              Save Changes
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
