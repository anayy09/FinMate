import { Box, Container, VStack } from "@chakra-ui/react";
import Hero from "../components/Hero";
import Features from "../components/Features";
import Footer from "../components/Footer";
import Carousel from "../components/Carousel";
import PageTransition from "../components/PageTransition";
import Navbar from "../components/Navbar";

export default function LandingPage() {
  return (
    <Box>
      <Navbar />
      <PageTransition>
        <Container maxW="container.xl" mt="6rem">
          <VStack>
            <Hero />
            <Features />
            <Carousel />
          </VStack>
        </Container>
      </PageTransition>
      <Footer />
    </Box>
  );
}
