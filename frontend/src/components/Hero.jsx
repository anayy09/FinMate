import { Box, Heading, Container, Text, Button, Stack } from "@chakra-ui/react";

export default function Hero() {
  return (
    <Container maxW={"3xl"} textAlign={"center"} py={20}>
      <Stack spacing={8}>
        <Heading
          fontSize={{ base: "2xl", sm: "4xl", md: "6xl" }}
          fontWeight={600}
        >
          Manage Your{" "}
          <Text as={"span"} color={"green.400"}>
            Finances
          </Text>{" "}
          Smartly
        </Heading>
        <Text color={"gray.500"}>
          Track your expenses, analyze spending habits, and get AI-driven
          financial insights to save more.
        </Text>
        <Stack direction={"row"} justify={"center"} spacing={6}>
          <Button colorScheme={"green"} size="lg">
            Join Now
          </Button>
          <Button variant={"outline"} colorScheme={"green"} size="lg">
            Learn More
          </Button>
        </Stack>
      </Stack>
    </Container>
  );
}
