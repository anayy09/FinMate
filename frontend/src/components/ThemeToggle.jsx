import { Button, Flex, useColorMode, useColorModeValue } from "@chakra-ui/react";
import { BsSun, BsMoonStarsFill } from "react-icons/bs";

export default function ThemeToggle() {
  const { colorMode, toggleColorMode } = useColorMode();

  return (
    <Button
      aria-label="Toggle Theme"
      onClick={toggleColorMode}
      bg={useColorModeValue("brand.500", "gray.700")}
      color="white"
      _hover={{ bg: useColorModeValue("gray.700", "brand.500") }}
      borderRadius={999}
    >
      {colorMode === "light" ? <BsMoonStarsFill /> : <BsSun />}
    </Button>
  );
}
