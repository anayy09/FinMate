import {
  Box,
  Container,
  Stack,
  Text,
  IconButton,
  useColorModeValue,
} from "@chakra-ui/react";
import { FaInstagram, FaTwitter, FaYoutube } from "react-icons/fa";

export default function Footer() {
  return (
    <Box
      bg={useColorModeValue("gray.50", "gray.900")}
      color={useColorModeValue("gray.700", "gray.200")}
      mt={10}
    >
      <Container
        as={Stack}
        maxW="6xl"
        py={4}
        direction={{ base: "column", md: "row" }}
        spacing={4}
        justify={{ base: "center", md: "space-between" }}
        align={{ base: "center", md: "center" }}
      >
        <Text>© 2025 FinMate. All rights reserved.</Text>
        <Stack direction="row" spacing={6}>
          <IconButton
            aria-label="Twitter"
            icon={<FaTwitter />}
            size="sm"
            color="current"
            variant="ghost"
          />
          <IconButton
            aria-label="YouTube"
            icon={<FaYoutube />}
            size="sm"
            color="current"
            variant="ghost"
          />
          <IconButton
            aria-label="Instagram"
            icon={<FaInstagram />}
            size="sm"
            color="current"
            variant="ghost"
          />
        </Stack>
      </Container>
    </Box>
  );
}