import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton,
    FormControl,
    FormLabel,
    Input,
    Button,
    Stack,
  } from "@chakra-ui/react";
  
  export default function ForgotPasswordModal({ isOpen, onClose }) {
    return (
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Forgot Password?</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <Stack spacing={4}>
              <FormControl>
                <FormLabel>Email Address</FormLabel>
                <Input type="email" />
              </FormControl>
              <Button colorScheme="blue">Request Reset</Button>
            </Stack>
          </ModalBody>
        </ModalContent>
      </Modal>
    );
  }
  