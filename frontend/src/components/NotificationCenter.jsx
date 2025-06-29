import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Icon,
  Button,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useColorModeValue,
  Divider,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Spinner,
  useToast
} from '@chakra-ui/react';
import {
  FaBell,
  FaLightbulb,
  FaExclamationTriangle,
  FaCheckCircle,
  FaMoneyBillWave,
  FaTrophy,
  FaChartLine
} from 'react-icons/fa';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '../api/insights.js';

const NotificationIcon = ({ type }) => {
  const iconMap = {
    budget_warning: FaExclamationTriangle,
    budget_exceeded: FaExclamationTriangle,
    weekly_summary: FaChartLine,
    monthly_report: FaChartLine,
    ai_insight: FaLightbulb,
    anomaly_alert: FaExclamationTriangle,
    goal_achievement: FaTrophy,
    saving_suggestion: FaMoneyBillWave
  };
  
  const colorMap = {
    budget_warning: 'orange',
    budget_exceeded: 'red',
    weekly_summary: 'blue',
    monthly_report: 'blue',
    ai_insight: 'purple',
    anomaly_alert: 'red',
    goal_achievement: 'green',
    saving_suggestion: 'green'
  };
  
  const IconComponent = iconMap[type] || FaBell;
  
  return <Icon as={IconComponent} color={colorMap[type] || 'gray.500'} />;
};

const NotificationItem = ({ notification, onMarkRead }) => {
  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const isRead = notification.read_at !== null;
  
  const handleMarkRead = async () => {
    if (!isRead) {
      await onMarkRead(notification.id);
    }
  };
  
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  return (
    <Box
      p={4}
      bg={bgColor}
      border="1px"
      borderColor={borderColor}
      borderRadius="md"
      opacity={isRead ? 0.7 : 1}
      borderLeft={isRead ? "4px solid" : "4px solid"}
      borderLeftColor={isRead ? "gray.300" : "blue.400"}
      _hover={{ bg: useColorModeValue('gray.50', 'gray.600') }}
      cursor="pointer"
      onClick={handleMarkRead}
    >
      <HStack align="start" spacing={3}>
        <Box mt={1}>
          <NotificationIcon type={notification.notification_type} />
        </Box>
        
        <VStack align="start" spacing={2} flex={1}>
          <HStack justify="space-between" w="full">
            <Text fontWeight="semibold" fontSize="sm">
              {notification.title}
            </Text>
            <HStack spacing={2}>
              {!isRead && (
                <Badge colorScheme="blue" size="sm">
                  New
                </Badge>
              )}
              <Text fontSize="xs" color="gray.500">
                {formatDate(notification.created_at)}
              </Text>
            </HStack>
          </HStack>
          
          <Text fontSize="sm" color="gray.600">
            {notification.message}
          </Text>
          
          {notification.data && Object.keys(notification.data).length > 0 && (
            <Box fontSize="xs" color="gray.500">
              {notification.data.category && (
                <Text>Category: {notification.data.category}</Text>
              )}
              {notification.data.amount && (
                <Text>Amount: ${parseFloat(notification.data.amount).toFixed(2)}</Text>
              )}
            </Box>
          )}
        </VStack>
      </HStack>
    </Box>
  );
};

const NotificationCenter = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const toast = useToast();
  
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await getNotifications({ page_size: 20 });
      setNotifications(data.results || []);
      
      // Count unread notifications
      const unreadCount = (data.results || []).filter(n => n.read_at === null).length;
      setUnreadCount(unreadCount);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast({
        title: 'Error',
        description: 'Failed to load notifications',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleMarkRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId);
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, read_at: new Date().toISOString(), status: 'read' }
            : n
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };
  
  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead();
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => ({ ...n, read_at: new Date().toISOString(), status: 'read' }))
      );
      
      setUnreadCount(0);
      
      toast({
        title: 'Success',
        description: 'All notifications marked as read',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };
  
  useEffect(() => {
    fetchNotifications();
  }, []);
  
  return (
    <>
      <Button
        variant="ghost"
        onClick={onOpen}
        position="relative"
        aria-label="Notifications"
      >
        <Icon as={FaBell} />
        {unreadCount > 0 && (
          <Badge
            position="absolute"
            top="-1"
            right="-1"
            colorScheme="red"
            borderRadius="full"
            fontSize="xs"
            minW="20px"
            h="20px"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>
      
      <Modal isOpen={isOpen} onClose={onClose} size="lg" scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent maxH="80vh">
          <ModalHeader>
            <HStack justify="space-between">
              <Text>Notifications</Text>
              {unreadCount > 0 && (
                <Button size="sm" variant="ghost" onClick={handleMarkAllRead}>
                  Mark all read
                </Button>
              )}
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          
          <ModalBody pb={6}>
            {loading ? (
              <Box textAlign="center" py={8}>
                <Spinner />
                <Text mt={2} color="gray.500">Loading notifications...</Text>
              </Box>
            ) : notifications.length === 0 ? (
              <Box textAlign="center" py={8}>
                <Icon as={FaBell} size="40px" color="gray.400" />
                <Text mt={4} color="gray.500">No notifications yet</Text>
                <Text fontSize="sm" color="gray.400">
                  You'll see budget alerts, AI insights, and summaries here
                </Text>
              </Box>
            ) : (
              <VStack spacing={4} align="stretch">
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkRead={handleMarkRead}
                  />
                ))}
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

export default NotificationCenter;
