// Carousel.jsx
import React from "react";
import {
  Box,
  IconButton,
  Stack,
  Heading,
  Text,
  Container,
  useColorModeValue,
} from "@chakra-ui/react";
import { BiLeftArrowAlt, BiRightArrowAlt } from "react-icons/bi";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const settings = {
  dots: true,
  arrows: false,
  fade: true,
  infinite: true,
  autoplay: true,
  speed: 500,
  autoplaySpeed: 5000,
  slidesToShow: 1,
  slidesToScroll: 1,
};

const cards = [
  {
    title: "Smart Budgeting",
    text: "AI-powered budgeting for smarter savings.",
    image: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
  },
  {
    title: "Track Every Penny",
    text: "Monitor your expenses like a pro.",
    image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
  },
  {
    title: "Financial Freedom",
    text: "Plan, save, and achieve your goals.",
    image: "https://images.unsplash.com/photo-1553729459-efe14ef6055d?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
  },
];

export default function Carousel() {
  const [slider, setSlider] = React.useState(null);
  const bgOverlay = useColorModeValue(
    "linear-gradient(to bottom, rgba(255,255,255,0.1), rgba(255,255,255,0.9))",
    "linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.9))"
  );
  const headingColor = useColorModeValue("gray.800", "white");
  const textColor = useColorModeValue("gray.600", "gray.300");

  return (
    <Box
      position="relative"
      height={{ base: "300px", md: "500px" }}
      width="full"
      overflow="hidden"
      my={10}
      borderRadius={20}
    >
      <IconButton
        aria-label="left-arrow"
        variant="ghost"
        position="absolute"
        left={{ base: "5px", md: "10px" }}
        top="50%"
        transform="translateY(-50%)"
        zIndex={2}
        onClick={() => slider?.slickPrev()}
      >
        <BiLeftArrowAlt size="40px" />
      </IconButton>
      <IconButton
        aria-label="right-arrow"
        variant="ghost"
        position="absolute"
        right={{ base: "5px", md: "10px" }}
        top="50%"
        transform="translateY(-50%)"
        zIndex={2}
        onClick={() => slider?.slickNext()}
      >
        <BiRightArrowAlt size="40px" />
      </IconButton>

      <Slider {...settings} ref={(slider) => setSlider(slider)}>
        {cards.map((card, index) => (
          <Box
            key={index}
            height={{ base: "300px", md: "500px" }}
            position="relative"
            backgroundPosition="center"
            backgroundRepeat="no-repeat"
            backgroundSize="cover"
            backgroundImage={`url(${card.image})`}
          >
            <Box
              position="absolute"
              width="100%"
              height="100%"
              background={bgOverlay}
            />
            <Container size="container.lg" height="100%">
              <Stack
                spacing={6}
                w="full"
                position="absolute"
                top="50%"
                transform="translate(0, -50%)"
              >
                <Heading
                  fontSize={{ base: "2xl", md: "4xl", lg: "5xl" }}
                  color={headingColor}
                >
                  {card.title}
                </Heading>
                <Text
                  fontSize={{ base: "md", lg: "lg" }}
                  color={textColor}
                >
                  {card.text}
                </Text>
              </Stack>
            </Container>
          </Box>
        ))}
      </Slider>
    </Box>
  );
}
