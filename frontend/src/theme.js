import { extendTheme } from "@chakra-ui/react";

const theme = extendTheme({
  colors: {
    brand: {
      50: "#e3f9e5",
      100: "#c1eac5",
      200: "#a3d9a5",
      300: "#7bc47f",
      400: "#57ae5b",
      500: "#3f9142", // Primary green shade
      600: "#2f8132",
      700: "#207227",
      800: "#0e5814",
      900: "#05400a",
    },
  },
  fonts: {
    heading: "'Outfit', sans-serif",
    body: "'Outfit', sans-serif",
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: "600",
        rounded: "lg",
      },
      variants: {
        solid: (props) => ({
          bg: props.colorMode === "dark" ? "brand.500" : "brand.500",
          color: "white",
          _hover: {
            bg: props.colorMode === "dark" ? "brand.600" : "brand.600",
          },
        }),
      },
    },
  },
  config: {
    initialColorMode: "light",
    useSystemColorMode: false,
  },
});

export default theme;
