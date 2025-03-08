import {
  Box,
  SimpleGrid,
  Icon,
  Text,
  Stack,
  Flex,
  useColorModeValue,
} from "@chakra-ui/react";
import { FcMoneyTransfer, FcBullish, FcPieChart } from "react-icons/fc";

const Feature = ({ title, text, icon }) => {
  return (
    <Stack
      align="center"
      textAlign="center"
      p={8}
      borderRadius={20}
      bg={useColorModeValue("white", "gray.700")}
      shadow="xl"
      transition="all 0.3s"
      _hover={{
        transform: "translateY(-5px)",
        shadow: "xl",
      }}
    >
      <Flex
        w={16}
        h={16}
        align="center"
        justify="center"
        bg={useColorModeValue("green.50", "green.900")}
        rounded="full"
        mb={4}
      >
        {icon}
      </Flex>
      <Text fontWeight={600} fontSize="lg" mb={2}>
        {title}
      </Text>
      <Text color={useColorModeValue("gray.600", "gray.400")}>{text}</Text>
    </Stack>
  );
};

export default function Features() {
  return (
    <Box py={10} px={4}>
      <SimpleGrid
        columns={{ base: 1, md: 3 }}
        spacing={{ base: 8, lg: 12 }}
        maxW="7xl"
        mx="auto"
      >
        <Feature
          icon={<Icon as={FcMoneyTransfer} w={10} h={10} />}
          title="Smart Transactions"
          text="Track every dollar with AI insights and get real-time updates on your spending patterns."
        />
        <Feature
          icon={<Icon as={FcBullish} w={10} h={10} />}
          title="Budget Planning"
          text="Set custom budgets, receive intelligent alerts, and stay on top of your financial goals."
        />
        <Feature
          icon={<Icon as={FcPieChart} w={10} h={10} />}
          title="Expense Analysis"
          text="Comprehensive visual analytics and reports to help you understand your spending habits better."
        />
      </SimpleGrid>
    </Box>
  );
}
