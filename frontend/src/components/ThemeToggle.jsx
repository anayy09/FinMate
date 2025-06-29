import { IconButton, useColorMode, useColorModeValue, Tooltip } from "@chakra-ui/react";
import { BsSun, BsMoonStarsFill } from "react-icons/bs";

export default function ThemeToggle() {
  const { colorMode, toggleColorMode } = useColorMode();
  
  // Use consistent navbar styling
  const hoverBg = useColorModeValue("gray.50", "gray.800");
  const color = useColorModeValue("gray.700", "gray.100");

  return (
    <Tooltip label={`Switch to ${colorMode === "light" ? "dark" : "light"} mode`} hasArrow>
      <IconButton
        aria-label="Toggle Theme"
        icon={colorMode === "light" ? <BsMoonStarsFill /> : <BsSun />}
        onClick={toggleColorMode}
        variant="ghost"
        size="md"
        color={color}
        _hover={{ 
          bg: hoverBg,
          transform: "translateY(-1px)"
        }}
        _active={{ transform: "translateY(0)" }}
        transition="all 0.2s"
      />
    </Tooltip>
  );
}
