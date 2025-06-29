import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Icon,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardFooter,
  Heading,
  SimpleGrid,
  useColorModeValue,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Progress,
  useToast,
  Spinner,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Textarea,
  ButtonGroup
} from '@chakra-ui/react';
import {
  FaLightbulb,
  FaBrain,
  FaChartLine,
  FaPiggyBank,
  FaExclamationTriangle,
  FaThumbsUp,
  FaThumbsDown,
  FaRocket,
  FaCheckCircle
} from 'react-icons/fa';
import { getAIInsights, generateAIInsights, markInsightActionTaken, provideInsightFeedback } from '../api/insights.js';

const InsightIcon = ({ type }) => {
  const iconMap = {
    spending_pattern: FaChartLine,
    budget_suggestion: FaPiggyBank,
    savings_opportunity: FaPiggyBank,
    prediction: FaBrain,
    anomaly: FaExclamationTriangle,
    goal_recommendation: FaRocket
  };
  
  const colorMap = {
    spending_pattern: 'blue',
    budget_suggestion: 'green',
    savings_opportunity: 'green',
    prediction: 'purple',
    anomaly: 'red',
    goal_recommendation: 'orange'
  };
  
  const IconComponent = iconMap[type] || FaLightbulb;
  
  return <Icon as={IconComponent} color={colorMap[type] || 'gray.500'} boxSize={5} />;
};

const InsightCard = ({ insight, onActionTaken, onFeedback }) => {
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  
  const handleActionTaken = async () => {
    await onActionTaken(insight.id);
  };
  
  const handleFeedbackSubmit = async (isRelevant) => {
    setIsSubmittingFeedback(true);
    try {
      await onFeedback(insight.id, isRelevant, feedbackText);
      setFeedbackModalOpen(false);
      setFeedbackText('');
    } finally {
      setIsSubmittingFeedback(false);
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
  
  const getInsightTypeLabel = (type) => {
    const labels = {
      spending_pattern: 'Spending Pattern',
      budget_suggestion: 'Budget Suggestion',
      savings_opportunity: 'Savings Opportunity',
      prediction: 'Expense Prediction',
      anomaly: 'Anomaly Detection',
      goal_recommendation: 'Goal Recommendation'
    };
    return labels[type] || type;
  };
  
  const getConfidenceColor = (score) => {
    if (score >= 85) return 'green';
    if (score >= 70) return 'yellow';
    return 'red';
  };
  
  return (
    <>
      <Card bg={cardBg} border="1px" borderColor={borderColor} shadow="sm">
        <CardHeader pb={2}>
          <HStack justify="space-between" align="start">
            <HStack spacing={3}>
              <InsightIcon type={insight.insight_type} />
              <VStack align="start" spacing={1}>
                <Text fontWeight="semibold" fontSize="md">
                  {insight.title}
                </Text>
                <HStack spacing={2}>
                  <Badge colorScheme="blue" size="sm">
                    {getInsightTypeLabel(insight.insight_type)}
                  </Badge>
                  {insight.confidence_score && (
                    <Badge 
                      colorScheme={getConfidenceColor(parseFloat(insight.confidence_score))}
                      size="sm"
                    >
                      {parseFloat(insight.confidence_score).toFixed(0)}% confidence
                    </Badge>
                  )}
                </HStack>
              </VStack>
            </HStack>
            
            <VStack align="end" spacing={1}>
              <Text fontSize="xs" color="gray.500">
                {formatDate(insight.created_at)}
              </Text>
              {insight.action_taken && (
                <Badge colorScheme="green" size="sm">
                  <Icon as={FaCheckCircle} mr={1} />
                  Action Taken
                </Badge>
              )}
            </VStack>
          </HStack>
        </CardHeader>
        
        <CardBody py={2}>
          <Text fontSize="sm" color="gray.600" mb={3}>
            {insight.description}
          </Text>
          
          {/* Display additional data if available */}
          {insight.data && (
            <Box fontSize="xs" color="gray.500" bg={useColorModeValue('gray.50', 'gray.600')} p={2} borderRadius="md">
              {insight.data.category && (
                <Text>Category: {insight.data.category}</Text>
              )}
              {insight.data.amount && (
                <Text>Amount: ${parseFloat(insight.data.amount).toFixed(2)}</Text>
              )}
              {insight.data.potential_savings && (
                <Text>Potential Savings: ${parseFloat(insight.data.potential_savings).toFixed(2)}</Text>
              )}
              {insight.data.percentage_used && (
                <Text>Budget Used: {parseFloat(insight.data.percentage_used).toFixed(1)}%</Text>
              )}
            </Box>
          )}
          
          {/* Confidence score progress bar */}
          {insight.confidence_score && (
            <Box mt={3}>
              <HStack justify="space-between" mb={1}>
                <Text fontSize="xs" color="gray.500">AI Confidence</Text>
                <Text fontSize="xs" color="gray.500">
                  {parseFloat(insight.confidence_score).toFixed(0)}%
                </Text>
              </HStack>
              <Progress 
                value={parseFloat(insight.confidence_score)} 
                size="sm" 
                colorScheme={getConfidenceColor(parseFloat(insight.confidence_score))}
              />
            </Box>
          )}
        </CardBody>
        
        {insight.is_actionable && (
          <CardFooter pt={2}>
            <HStack spacing={2} w="full">
              {!insight.action_taken && (
                <Button 
                  size="sm" 
                  colorScheme="blue" 
                  onClick={handleActionTaken}
                  leftIcon={<Icon as={FaCheckCircle} />}
                >
                  Mark as Done
                </Button>
              )}
              
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setFeedbackModalOpen(true)}
                leftIcon={<Icon as={FaThumbsUp} />}
              >
                Feedback
              </Button>
            </HStack>
          </CardFooter>
        )}
      </Card>
      
      {/* Feedback Modal */}
      <Modal isOpen={feedbackModalOpen} onClose={() => setFeedbackModalOpen(false)}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Provide Feedback</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4} align="stretch">
              <Text fontSize="sm">
                How relevant was this insight to you?
              </Text>
              
              <ButtonGroup spacing={4} justifyContent="center">
                <Button
                  leftIcon={<Icon as={FaThumbsUp} />}
                  colorScheme="green"
                  onClick={() => handleFeedbackSubmit(true)}
                  isLoading={isSubmittingFeedback}
                >
                  Helpful
                </Button>
                <Button
                  leftIcon={<Icon as={FaThumbsDown} />}
                  colorScheme="red"
                  onClick={() => handleFeedbackSubmit(false)}
                  isLoading={isSubmittingFeedback}
                >
                  Not Helpful
                </Button>
              </ButtonGroup>
              
              <Box>
                <Text fontSize="sm" mb={2} color="gray.600">
                  Additional comments (optional):
                </Text>
                <Textarea
                  placeholder="Tell us how we can improve this insight..."
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  size="sm"
                />
              </Box>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

const AIInsights = () => {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const toast = useToast();
  
  const fetchInsights = async () => {
    setLoading(true);
    try {
      const data = await getAIInsights({ ordering: '-created_at', page_size: 10 });
      setInsights(data.results || []);
    } catch (error) {
      console.error('Error fetching AI insights:', error);
      toast({
        title: 'Error',
        description: 'Failed to load AI insights',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleGenerateInsights = async () => {
    setGenerating(true);
    try {
      await generateAIInsights();
      toast({
        title: 'AI Insights Generated',
        description: 'New insights are being processed. Check back in a moment.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      // Refresh insights after a delay
      setTimeout(() => {
        fetchInsights();
      }, 3000);
    } catch (error) {
      console.error('Error generating insights:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate AI insights',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setGenerating(false);
    }
  };
  
  const handleActionTaken = async (insightId) => {
    try {
      await markInsightActionTaken(insightId);
      
      // Update local state
      setInsights(prev => 
        prev.map(insight => 
          insight.id === insightId 
            ? { ...insight, action_taken: true, action_date: new Date().toISOString() }
            : insight
        )
      );
      
      toast({
        title: 'Action Recorded',
        description: 'Thank you for taking action on this insight!',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error marking action taken:', error);
    }
  };
  
  const handleFeedback = async (insightId, isRelevant, feedback) => {
    try {
      await provideInsightFeedback(insightId, isRelevant, feedback);
      
      // Update local state
      setInsights(prev => 
        prev.map(insight => 
          insight.id === insightId 
            ? { ...insight, is_relevant: isRelevant, feedback }
            : insight
        )
      );
      
      toast({
        title: 'Feedback Submitted',
        description: 'Thank you for helping us improve our AI insights!',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  };
  
  useEffect(() => {
    fetchInsights();
  }, []);
  
  return (
    <Box>
      <HStack justify="space-between" align="center" mb={6}>
        <HStack spacing={2}>
          <Icon as={FaBrain} color="purple.500" boxSize={6} />
          <Heading size="lg">AI Insights</Heading>
        </HStack>
        
        <Button
          leftIcon={<Icon as={FaRocket} />}
          colorScheme="purple"
          onClick={handleGenerateInsights}
          isLoading={generating}
          loadingText="Generating..."
        >
          Generate New Insights
        </Button>
      </HStack>
      
      {loading ? (
        <Box textAlign="center" py={8}>
          <Spinner size="lg" color="purple.500" />
          <Text mt={4} color="gray.500">Loading AI insights...</Text>
        </Box>
      ) : insights.length === 0 ? (
        <Alert status="info">
          <AlertIcon />
          <Box>
            <AlertTitle>No AI insights yet!</AlertTitle>
            <AlertDescription>
              Generate your first AI insights to get personalized recommendations about your spending.
            </AlertDescription>
          </Box>
        </Alert>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          {insights.map((insight) => (
            <InsightCard
              key={insight.id}
              insight={insight}
              onActionTaken={handleActionTaken}
              onFeedback={handleFeedback}
            />
          ))}
        </SimpleGrid>
      )}
    </Box>
  );
};

export default AIInsights;
