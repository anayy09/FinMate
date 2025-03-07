import { Button, Flex, useColorMode } from "@chakra-ui/react";
import { BsSun, BsMoonStarsFill } from "react-icons/bs";

export default function ThemeToggle() {
  const { colorMode, toggleColorMode } = useColorMode();

  return (
    <Button
      aria-label="Toggle Theme"
      onClick={toggleColorMode}
      bg="brand.500"
      color="white"
      _hover={{ bg: "brand.600" }}
    >
      {colorMode === "light" ? <BsMoonStarsFill /> : <BsSun />}
    </Button>
  );
}
