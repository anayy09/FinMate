import { useState } from "react";
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
  useToast,
} from "@chakra-ui/react";
import { requestPasswordReset } from "../api/auth";

export default function ForgotPasswordModal({ isOpen, onClose }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handlePasswordReset = async () => {
    setLoading(true);
    try {
      await requestPasswordReset(email);
      toast({ title: "Check your email for reset instructions", status: "success", duration: 4000 });
      onClose();
    } catch (error) {
      toast({ title: "Reset failed", description: error.message, status: "error", duration: 3000 });
    }
    setLoading(false);
  };

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
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </FormControl>
            <Button isLoading={loading} colorScheme="blue" onClick={handlePasswordReset}>
              Request Reset
            </Button>
          </Stack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
