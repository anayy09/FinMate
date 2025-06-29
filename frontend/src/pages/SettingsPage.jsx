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
} from "@chakra-ui/react";
import { FaTrash, FaMobile, FaDesktop, FaTablet } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import axios from "axios";

const API_URL = "http://127.0.0.1:8000/api";

export default function SettingsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const bg = useColorModeValue("gray.50", "gray.800");
  const cardBg = useColorModeValue("white", "gray.700");
  
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
  const [disablePassword, setDisablePassword] = useState("");

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    fetchSessions();
  }, [user, navigate]);

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

  if (!user) return null;

  return (
    <Box minH="100vh" bg={bg}>
      <Navbar />
      <Container maxW="container.xl" pt="6rem" pb={8}>
        <Heading size="lg" mb={6}>Settings</Heading>
        
        <Tabs>
          <TabList>
            <Tab>Security</Tab>
            <Tab>Device Management</Tab>
            <Tab>Profile</Tab>
          </TabList>

          <TabPanels>
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

            {/* Profile Tab */}
            <TabPanel>
              <Card bg={cardBg}>
                <CardBody>
                  <VStack align="stretch" spacing={4}>
                    <Heading size="md">Profile Information</Heading>
                    <VStack align="stretch" spacing={3}>
                      <HStack justify="space-between">
                        <Text>Name:</Text>
                        <Text fontWeight="medium">{user.name}</Text>
                      </HStack>
                      <HStack justify="space-between">
                        <Text>Email:</Text>
                        <Text fontWeight="medium">{user.email}</Text>
                      </HStack>
                      <HStack justify="space-between">
                        <Text>Account Status:</Text>
                        <Badge colorScheme="green">Active</Badge>
                      </HStack>
                    </VStack>
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
    </Box>
  );
}
