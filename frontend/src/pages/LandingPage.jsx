import { Box, Container, VStack } from "@chakra-ui/react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Hero from "../components/Hero";
import Features from "../components/Features";
import Footer from "../components/Footer";
import Carousel from "../components/Carousel";
import PageTransition from "../components/PageTransition";
import Navbar from "../components/Navbar";

export default function LandingPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return <Box>Loading...</Box>;
  }

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
