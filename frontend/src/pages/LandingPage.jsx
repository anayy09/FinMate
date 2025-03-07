import { Box, Container, VStack } from "@chakra-ui/react";
import Hero from "../components/Hero";
import Features from "../components/Features";
import Footer from "../components/Footer";
import Carousel from "../components/Carousel";
import ThemeToggle from "../components/ThemeToggle";

export default function LandingPage() {
  return (
    <Box>
      <Box position="absolute" top="1rem" right="1rem">
        <ThemeToggle />
      </Box>
      <Container maxW="container. xl">
        <VStack>
          <Hero />
          <Features />
          <Carousel />
        </VStack>
      </Container>
      <Footer />
    </Box>
  );
}
