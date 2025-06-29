import {
  Box,
  Flex,
  Button,
  Link,
  Spacer,
  useColorModeValue,
  useToast,
  HStack,
  Avatar,
  Text,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Badge,
  VStack,
  Icon,
  Tooltip,
  useDisclosure,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  IconButton,
  Stack
} from "@chakra-ui/react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; // Import AuthContext
import ThemeToggle from "./ThemeToggle";
import NotificationCenter from "./NotificationCenter";
import { FiUser, FiSettings, FiLogOut, FiCreditCard, FiShield, FiMenu, FiDollarSign, FiHome, FiRefreshCw, FiSmartphone } from "react-icons/fi";
import { FaChartLine } from "react-icons/fa";

export default function Navbar() {
  const { user, handleLogout } = useAuth(); // Get user state and logout function from AuthContext
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Enhanced color scheme
  const bg = useColorModeValue("white", "gray.900");
  const color = useColorModeValue("gray.700", "gray.100");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const hoverBg = useColorModeValue("gray.50", "gray.800");
  const activeBg = useColorModeValue("blue.50", "blue.900");
  const activeColor = useColorModeValue("blue.600", "blue.200");

  const onLogout = async () => {
    try {
      await handleLogout();
      toast({
        title: "Logged out successfully",
        status: "success",
        duration: 3000,
        position: "top-right"
      });
      navigate("/");
    } catch (error) {
      toast({
        title: "Logout failed",
        description: error.message,
        status: "error",
        duration: 3000,
        position: "top-right"
      });
    }
  };

  const isActive = (path) => location.pathname === path;

  // Enhanced navigation items with icons
  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: FaChartLine },
    { path: "/transactions", label: "Transactions", icon: FiCreditCard },
    { path: "/budgets", label: "Budgets", icon: FiDollarSign },
    { path: "/accounts", label: "Accounts", icon: FiHome },
    { path: "/recurring-transactions", label: "Recurring", icon: FiRefreshCw },
  ];

  return (
    <>
      <Box
        bg={bg}
        px={8}
        py={4}
        boxShadow="sm"
        borderBottom="1px"
        borderColor={borderColor}
        position="fixed"
        width="100%"
        top={0}
        zIndex={1000}
        backdropFilter="blur(10px)"
      >
        <Flex align="center" mx="auto">
          {/* Logo */}
          <Link
            fontSize="2xl"
            fontWeight="bold"
            onClick={() => navigate("/")}
            color={activeColor}
            _hover={{ textDecoration: "none", transform: "scale(1.05)" }}
            transition="all 0.2s"
            cursor="pointer"
          >
            FinMate
          </Link>

          {/* Desktop Navigation Items */}
          {user && (
            <HStack spacing={1} ml={12} display={{ base: "none", lg: "flex" }}>
              {navItems.map((item) => (
                <Tooltip key={item.path} label={item.label} hasArrow>
                  <Button
                    variant="ghost"
                    size="md"
                    bg={isActive(item.path) ? activeBg : "transparent"}
                    color={isActive(item.path) ? activeColor : color}
                    _hover={{
                      bg: isActive(item.path) ? activeBg : hoverBg,
                      transform: "translateY(-1px)"
                    }}
                    _active={{ transform: "translateY(0)" }}
                    transition="all 0.2s"
                    onClick={() => navigate(item.path)}
                    leftIcon={
                      typeof item.icon === "string" ? (
                        <Text fontSize="lg">{item.icon}</Text>
                      ) : (
                        <Icon as={item.icon} />
                      )
                    }
                  >
                    {item.label}
                  </Button>
                </Tooltip>
              ))}
            </HStack>
          )}

          <Spacer />

          {/* Right side controls */}
          <HStack spacing={4}>
            {user ? (
              <>
                {/* Mobile menu button */}
                <IconButton
                  aria-label="Open navigation menu"
                  icon={<FiMenu />}
                  variant="ghost"
                  display={{ base: "flex", lg: "none" }}
                  onClick={onOpen}
                />

                {/* Notifications - Hidden on mobile */}
                <Box display={{ base: "none", md: "block" }}>
                  <NotificationCenter />
                </Box>

                {/* Theme Toggle */}
                <ThemeToggle />

                {/* User Profile Menu */}
                <Menu>
                  <MenuButton
                    as={Button}
                    variant="ghost"
                    p={2}
                    _hover={{ bg: hoverBg }}
                    _active={{ bg: activeBg }}
                    transition="all 0.2s"
                  >
                    <HStack spacing={3}>
                      <Avatar
                        size="sm"
                        name={user?.name}
                        src={user?.avatar}
                        bg={activeColor}
                        color="white"
                      />
                      <VStack spacing={0} align="start" display={{ base: "none", md: "flex" }}>
                        <Text fontSize="sm" fontWeight="medium" color={color}>
                          {user?.name || "User"}
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          {user?.email}
                        </Text>
                      </VStack>
                      {user?.is_premium && (
                        <Badge colorScheme="purple" size="sm">
                          Pro
                        </Badge>
                      )}
                    </HStack>
                  </MenuButton>

                  <MenuList
                    bg={bg}
                    borderColor={borderColor}
                    boxShadow="xl"
                    py={2}
                    minW="200px"
                  >
                    {/* User Info Header */}
                    <Box px={4} py={2} borderBottom="1px" borderColor={borderColor}>
                      <Text fontSize="sm" fontWeight="semibold" color={color}>
                        {user?.name || "User"}
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        {user?.email}
                      </Text>
                      {user?.is_premium && (
                        <Badge colorScheme="purple" size="sm" mt={1}>
                          Premium Member
                        </Badge>
                      )}
                    </Box>

                    <MenuItem
                      icon={<FiUser />}
                      onClick={() => navigate("/profile?tab=details")}
                      _hover={{ bg: hoverBg }}
                    >
                      View Profile
                    </MenuItem>

                    <MenuItem
                      icon={<FiCreditCard />}
                      onClick={() => navigate("/profile?tab=bank-accounts")}
                      _hover={{ bg: hoverBg }}
                    >
                      Bank Accounts
                    </MenuItem>

                    <MenuItem
                      icon={<FaChartLine />}
                      onClick={() => navigate("/profile?tab=reports")}
                      _hover={{ bg: hoverBg }}
                    >
                      Reports
                    </MenuItem>

                    <MenuItem
                      icon={<FiShield />}
                      onClick={() => navigate("/profile?tab=security")}
                      _hover={{ bg: hoverBg }}
                    >
                      Security
                    </MenuItem>

                    <MenuItem
                      icon={<FiSmartphone />}
                      onClick={() => navigate("/profile?tab=device-management")}
                      _hover={{ bg: hoverBg }}
                    >
                      Devices
                    </MenuItem>

                    <MenuDivider />

                    <MenuItem
                      icon={<FiLogOut />}
                      onClick={onLogout}
                      _hover={{ bg: "red.50", color: "red.600" }}
                      color="red.500"
                    >
                      Sign Out
                    </MenuItem>
                  </MenuList>
                </Menu>
              </>
            ) : (
              <>
                <ThemeToggle />
                <Button
                  variant="ghost"
                  onClick={() => navigate("/login")}
                  _hover={{ bg: hoverBg }}
                >
                  Login
                </Button>
                <Button
                  colorScheme="blue"
                  onClick={() => navigate("/signup")}
                  bg={activeColor}
                  _hover={{ transform: "translateY(-1px)", boxShadow: "lg" }}
                  transition="all 0.2s"
                >
                  Sign Up
                </Button>
              </>
            )}
          </HStack>
        </Flex>
      </Box>

      {/* Mobile Navigation Drawer */}
      {user && (
        <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
          <DrawerOverlay />
          <DrawerContent bg={bg}>
            <DrawerCloseButton />
            <DrawerHeader borderBottomWidth="1px" borderColor={borderColor}>
              <HStack>
                <Avatar
                  size="sm"
                  name={user?.name}
                  src={user?.avatar}
                  bg={activeColor}
                  color="white"
                />
                <VStack spacing={0} align="start">
                  <Text fontSize="sm" fontWeight="medium">
                    {user?.name || "User"}
                  </Text>
                  <Text fontSize="xs" color="gray.500">
                    {user?.email}
                  </Text>
                </VStack>
              </HStack>
            </DrawerHeader>

            <DrawerBody>
              <Stack spacing={2} mt={4}>
                {navItems.map((item) => (
                  <Button
                    key={item.path}
                    variant="ghost"
                    justifyContent="flex-start"
                    bg={isActive(item.path) ? activeBg : "transparent"}
                    color={isActive(item.path) ? activeColor : color}
                    onClick={() => {
                      navigate(item.path);
                      onClose();
                    }}
                    leftIcon={
                      typeof item.icon === "string" ? (
                        <Text fontSize="lg">{item.icon}</Text>
                      ) : (
                        <Icon as={item.icon} />
                      )
                    }
                  >
                    {item.label}
                  </Button>
                ))}

                {/* Mobile-specific menu items */}
                <Box mt={6}>
                  <Text fontSize="xs" fontWeight="medium" color="gray.500" mb={2} textTransform="uppercase">
                    Account
                  </Text>

                  <Stack spacing={1}>
                    <Button
                      variant="ghost"
                      justifyContent="flex-start"
                      onClick={() => {
                        navigate("/profile?tab=details");
                        onClose();
                      }}
                      leftIcon={<FiUser />}
                    >
                      Profile Details
                    </Button>

                    <Button
                      variant="ghost"
                      justifyContent="flex-start"
                      onClick={() => {
                        navigate("/profile?tab=bank-accounts");
                        onClose();
                      }}
                      leftIcon={<FiCreditCard />}
                    >
                      Bank Accounts
                    </Button>

                    <Button
                      variant="ghost"
                      justifyContent="flex-start"
                      onClick={() => {
                        navigate("/profile?tab=reports");
                        onClose();
                      }}
                      leftIcon={<FiSettings />}
                    >
                      Reports
                    </Button>

                    <Button
                      variant="ghost"
                      justifyContent="flex-start"
                      onClick={() => {
                        navigate("/profile?tab=security");
                        onClose();
                      }}
                      leftIcon={<FiShield />}
                    >
                      Security
                    </Button>

                    <NotificationCenter />

                    <Button
                      variant="ghost"
                      justifyContent="flex-start"
                      onClick={onLogout}
                      leftIcon={<FiLogOut />}
                      color="red.500"
                      _hover={{ bg: "red.50" }}
                    >
                      Sign Out
                    </Button>
                  </Stack>
                </Box>
              </Stack>
            </DrawerBody>
          </DrawerContent>
        </Drawer>
      )}
    </>
  );
}
